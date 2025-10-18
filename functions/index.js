// Forcing a fresh redeploy at [current date and time]
// Use the new v2 syntax for Cloud Functions
const {onRequest, onCall, HttpsError} = require("firebase-functions/v2/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const Razorpay = require('razorpay');

const admin = require("firebase-admin");
admin.initializeApp();

// --- FUNCTION 1: Email-to-Task Webhook (Updated to v2 syntax) ---
exports.emailToTaskWebhook = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const toAddress = req.body.headers.to.text;
    const taskTitle = req.body.headers.subject;
    const taskDescription = req.body.text || "No content.";
    const fromAddress = req.body.headers.from.value[0].address;

    if (!fromAddress) {
      console.error("Could not find a 'from' address in the email.");
      res.status(400).send("Bad Request: Sender address not found.");
      return;
    }
    
    const usersRef = admin.firestore().collection("users");
    const querySnapshot = await usersRef.where("email", "==", fromAddress.toLowerCase()).get();

    if (querySnapshot.empty) {
        console.error("User not found for email:", fromAddress);
        res.status(404).send("User not found.");
        return;
    }
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data(); // Get the user's data

    // --- NEW: PREMIUM CHECK ---
    if (userData.subscription?.status !== 'premium') {
        console.log(`Blocked email-to-task attempt from non-premium user: ${fromAddress}`);
        // Respond with a 403 Forbidden status to indicate a permission issue.
        // The email service will typically not retry on a 403 error.
        res.status(403).send("Forbidden: This feature is for premium users only.");
        return;
    }
    // --- END OF CHECK ---

    const userTasksRef = admin.firestore()
        .collection("users").doc(userId).collection("tasks");

    await userTasksRef.add({
      text: taskTitle,
      description: taskDescription,
      status: "todo",
      priority: "medium",
      category: "Email",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      order: Date.now(),
    });

    console.log(`Successfully created task for user: ${userId}`);
    res.status(200).send("Task created successfully.");

  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Internal Server Error.");
  }
});

// --- FUNCTION 2: Scheduled Task Reminders (Updated to v2 syntax) ---
exports.sendTaskReminders = onSchedule("every 15 minutes", async (event) => {
    const now = new Date();
    const reminderWindowEnd = new Date(now.getTime() + 15 * 60 * 1000);

    const db = admin.firestore();
    const usersSnapshot = await db.collection("users").get();

    const promises = [];

    for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();
        if (user.fcmToken) {
            const tasksSnapshot = await db.collection("users").doc(userDoc.id).collection("tasks").get();

            for (const taskDoc of tasksSnapshot.docs) {
                const task = taskDoc.data();
                if (task.deadline && task.status !== "completed") {
                    const deadline = task.deadline.toDate();
                    if (deadline > now && deadline <= reminderWindowEnd) {
                        const payload = {
                            notification: {
                                title: "Task Reminder!",
                                body: `Your task "${task.text}" is due soon.`,
                            },
                            token: user.fcmToken,
                        };
                        promises.push(admin.messaging().send(payload));
                    }
                }
            }
        }
    }

    try {
      await Promise.all(promises);
      console.log("Successfully sent all reminder notifications.");
    } catch (error) {
      console.error("Error sending notifications:", error);
    }
    
    return null;
});

// --- FUNCTION 3: Slack Slash Command Handler ---
exports.slackTodoCommand = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const slackUserId = req.body.user_id;
    const taskText = req.body.text;
    const responseUrl = req.body.response_url; // URL for sending delayed responses

    if (!taskText) {
      return res.status(200).send({
        response_type: "ephemeral", // Private message
        text: "Please provide some text for your task. Usage: `/todo Finish report`",
      });
    }

    // 1. Look up the Slack user ID to find their linked app account.
    const integrationDocRef = admin.firestore().collection("slackIntegrations").doc(slackUserId);
    const integrationDoc = await integrationDocRef.get();

    if (!integrationDoc.exists) {
      // 2. If the user is not linked, send a private message asking them to link.
      const appUrl = "https://omingle82.github.io/To-Do-List/";
      const linkUrl = `${appUrl}#link-slack?slack_id=${slackUserId}`;
      
      return res.status(200).send({
        response_type: "ephemeral", // 'ephemeral' means the message is only visible to the user
        text: `Welcome! To create tasks from Slack, you first need to link your account. Please visit this link to connect: ${linkUrl}`,
      });
    }

    // 3. If the user is linked, create the task.
    const firestoreUserId = integrationDoc.data().firestoreUserId;
    const userTasksRef = admin.firestore().collection("users").doc(firestoreUserId).collection("tasks");

    await userTasksRef.add({
      text: taskText,
      status: "todo",
      priority: "medium",
      category: "Slack",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      order: Date.now(),
    });

    // Send a confirmation message back to the user
    return res.status(200).send({
      response_type: "ephemeral",
      text: `✅ Task created: "${taskText}"`,
    });

  } catch (error) {
    console.error("Error in Slack command handler:", error);
    return res.status(200).send({
      response_type: "ephemeral",
      text: "Sorry, an internal error occurred while creating your task.",
    });
  }
});

// --- FUNCTION 4: Ban User (Callable Function) ---
exports.banUser = onCall(async (request) => {
  // 1. Security Check: Verify the caller is an admin.
  const adminUid = request.auth?.uid;
  if (!adminUid) {
    throw new HttpsError(
      'unauthenticated',
      'You must be logged in to perform this action.'
    );
  }

  const adminDoc = await admin.firestore().collection('users').doc(adminUid).get();
  if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
      throw new HttpsError(
          'permission-denied',
          'You must be an admin to perform this action.'
      );
  }

  // 2. Get the target user's ID from the data passed in.
  const userIdToBan = request.data.userId;
  if (!userIdToBan) {
    throw new HttpsError(
        'invalid-argument',
        'Please provide a user ID.'
    );
  }

  try {
    // 3. Use the Admin SDK to disable the user's account.
    await admin.auth().updateUser(userIdToBan, { disabled: true });

    // Optional: Update their Firestore document as well.
    await admin.firestore().collection('users').doc(userIdToBan).update({
        status: 'banned'
    });

    // 4. Return a success message.
    return { success: true, message: `Successfully banned user ${userIdToBan}.` };

  } catch (error) {
    console.error("Error banning user:", error);
    throw new HttpsError(
        'internal',
        'An unexpected error occurred.'
    );
  }
});
// --- FUNCTION 5: Unban User (Callable Function) ---
exports.unbanUser = onCall(async (request) => {
  // 1. Security Check: Verify the caller is an admin.
  const adminUid = request.auth?.uid;
  if (!adminUid) {
    throw new HttpsError(
      'unauthenticated', 'You must be logged in.'
    );
  }
  const adminDoc = await admin.firestore().collection('users').doc(adminUid).get();
  if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
      throw new HttpsError(
          'permission-denied', 'You must be an admin to perform this action.'
      );
  }

  // 2. Get the target user's ID.
  const userIdToUnban = request.data.userId;
  if (!userIdToUnban) {
    throw new HttpsError(
        'invalid-argument', 'Please provide a user ID.'
    );
  }

  try {
    // 3. Use the Admin SDK to enable the user's account.
    await admin.auth().updateUser(userIdToUnban, { disabled: false });

    // 4. Update their Firestore document to reflect the change.
    await admin.firestore().collection('users').doc(userIdToUnban).update({
        status: 'active' // or remove the status field
    });

    // 5. Return a success message.
    return { success: true, message: `Successfully unbanned user ${userIdToUnban}.` };

  } catch (error) {
    console.error("Error unbanning user:", error);
    throw new HttpsError(
        'internal', 'An unexpected error occurred.'
    );
  }
});

// --- FUNCTION 6: Change User Role (Callable Function) ---
exports.changeUserRole = onCall(async (request) => {
  // 1. Security Check: Verify the caller is an admin (with a fallback to Firestore).
  const adminUid = request.auth?.uid;
  if (!adminUid) {
    throw new HttpsError('unauthenticated', 'You must be logged in.');
  }

  // THIS IS THE CORRECTED SECURITY BLOCK
  if (request.auth.token.role !== 'admin') {
    const adminDoc = await admin.firestore().collection('users').doc(adminUid).get();
    if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
        throw new HttpsError(
            'permission-denied',
            'You must be an admin to perform this action.'
        );
    }
  }
  // END OF CORRECTED BLOCK

  // 2. Get the target user ID and the new role from the data.
  const { userId, newRole } = request.data;
  if (!userId || !['admin', 'user'].includes(newRole)) {
    throw new HttpsError('invalid-argument', 'Invalid user ID or role specified.');
  }

  // 3. Critical Safety Check: Prevent an admin from demoting themselves.
  if (adminUid === userId && newRole === 'user') {
    throw new HttpsError('failed-precondition', 'Admins cannot remove their own admin status.');
  }

  try {
    // 4. Set the custom claim on the user's auth token.
    await admin.auth().setCustomUserClaims(userId, { role: newRole });

    // 5. Update the user's document in Firestore.
    await admin.firestore().collection('users').doc(userId).update({ role: newRole });

    return { success: true, message: `Successfully set role to ${newRole} for user ${userId}.` };
  } catch (error) {
    console.error("Error changing user role:", error);
    throw new HttpsError('internal', 'An unexpected error occurred.');
  }
});

// --- FUNCTION 7: Generate Daily Analytics (Scheduled) ---
exports.generateDailyAnalytics = onSchedule("every 24 hours", async (event) => {
  console.log("Running daily analytics job...");

  const db = admin.firestore();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  try {
    // 1. Get User Counts
    const listUsersResult = await admin.auth().listUsers();
    const totalUsers = listUsersResult.users.length;
    const newUsers = listUsersResult.users.filter(user => {
        const creationTime = new Date(user.metadata.creationTime);
        return creationTime >= yesterday;
    }).length;

    // 2. Get Task Counts using a Collection Group Query
    const tasksSnapshot = await db.collectionGroup('tasks').get();
    const totalTasks = tasksSnapshot.size;
    const completedTasks = tasksSnapshot.docs.filter(doc => doc.data().status === 'completed').length;

    // 3. Prepare the analytics document
    const analyticsData = {
      date: admin.firestore.Timestamp.fromDate(today),
      totalUsers,
      newUsers,
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
    };

    // 4. Save the report to a new collection
    const reportId = today.toISOString().split('T')[0]; // e.g., '2025-10-11'
    await db.collection('system_analytics').doc(reportId).set(analyticsData);

    console.log("Successfully generated daily analytics:", analyticsData);
    return null;

  } catch (error) {
    console.error("Error generating daily analytics:", error);
    return null;
  }
});

// --- FUNCTION 8: Create Razorpay Subscription ---
// Add the { cors: true } option object as the first argument
exports.createRazorpaySubscription = onCall({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be logged in.');
    }

    // --- NEW: Define your Plan IDs here ---
    const MONTHLY_PLAN_ID = "plan_RSWaZTkYUrIetL"; //  monthly Plan ID
    const YEARLY_PLAN_ID = "plan_RUb4JkF1DNi4be"; // <-- yearly Plan ID 

    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    // Get the user's choice from the data sent by the frontend
    const planType = request.data.planType;
    let selectedPlanId;

    if (planType === 'yearly') {
        selectedPlanId = YEARLY_PLAN_ID;
    } else if (planType === 'monthly') {
        selectedPlanId = MONTHLY_PLAN_ID;
    } else {
        // If the planType is invalid, throw an error
        throw new HttpsError('invalid-argument', 'A valid plan type (monthly or yearly) must be provided.');
    }
    
    try {
        const subscription = await razorpay.subscriptions.create({
            plan_id: selectedPlanId, // Use the selected plan ID
            customer_notify: 1,
            total_count: planType === 'yearly' ? 1 : 12, // Set total cycles
            notes: {
                firebase_uid: request.auth.uid
            }
        });

        return { subscriptionId: subscription.id };

    } catch (error) {
        console.error("Razorpay Subscription creation failed:", error);
        throw new HttpsError('internal', 'Could not create subscription.');
    }
});

// --- FUNCTION 9: Razorpay Webhook Handler ---
exports.razorpayWebhook = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];

  try {
    const crypto = require("crypto");
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest !== signature) {
      return res.status(400).send("Invalid signature");
    }

    const event = req.body;
    if (event.event === 'subscription.charged') {
      const subscription = event.payload.subscription.entity;
      const uid = subscription.notes.firebase_uid;

      if (uid) {
        const userRef = admin.firestore().collection("users").doc(uid);
        await userRef.update({
          "subscription.status": "premium",
          "subscription.planId": subscription.plan_id,
          "subscription.subscriptionId": subscription.id,
          "subscription.currentPeriodEnd": admin.firestore.Timestamp.fromMillis(subscription.current_end * 1000)
        });
      }
    }
    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Error processing Razorpay webhook:", error);
    return res.status(500).send("Webhook processing error.");
  }
});