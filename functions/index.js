// Forcing a fresh redeploy at [current date and time]
// Use the new v2 syntax for Cloud Functions
const {onRequest, onCall, HttpsError} = require("firebase-functions/v2/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onObjectFinalized, onObjectDeleted} = require("firebase-functions/v2/storage");
const Razorpay = require('razorpay');

const admin = require("firebase-admin");
admin.initializeApp();

const MONTHLY_PLAN_ID = "plan_RZGPfzNRtiYgG0";
const YEARLY_PLAN_ID = "plan_RZGREjjDG6aftY";   

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
    const MONTHLY_PLAN_ID = "plan_RZGPfzNRtiYgG0"; //  monthly Plan ID
    const YEARLY_PLAN_ID = "plan_RZGREjjDG6aftY"; // <-- yearly Plan ID 

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

// --- FUNCTION 10: Securely Share or Assign Tasks with Limits ---
const SHARE_ASSIGN_LIMIT_MONTHLY = 20; // Define the limit for monthly users

exports.shareOrAssignTasks = onCall(async (request) => {
    const callerUid = request.auth?.uid;
    if (!callerUid) {
        throw new HttpsError('unauthenticated', 'You must be logged in.');
    }

    // --- 1. Get Input Data ---
    const { recipientEmail, taskIds, action } = request.data; // action is 'share' or 'assign'
    if (!recipientEmail || !Array.isArray(taskIds) || taskIds.length === 0 || !['share', 'assign'].includes(action)) {
        throw new HttpsError('invalid-argument', 'Missing or invalid parameters.');
    }
    if (taskIds.length > SHARE_ASSIGN_LIMIT_MONTHLY) {
         throw new HttpsError('invalid-argument', `You cannot ${action} more than ${SHARE_ASSIGN_LIMIT_MONTHLY} tasks at once.`);
    }

    const db = admin.firestore();
    const callerRef = db.collection('users').doc(callerUid);
    const batch = db.batch(); // Use Firestore batch for atomic operations

    try {
        // --- 2. Get Caller and Recipient Info ---
        const callerDoc = await callerRef.get();
        if (!callerDoc.exists) throw new HttpsError('not-found', 'Caller user document not found.');
        const callerData = callerDoc.data();
        const callerName = callerData.displayName || callerData.email.split('@')[0];

        const recipientQuery = await db.collection('users').where('email', '==', recipientEmail.trim().toLowerCase()).limit(1).get();
        if (recipientQuery.empty) throw new HttpsError('not-found', 'Recipient user not found.');
        const recipientDoc = recipientQuery.docs[0];
        const recipientUid = recipientDoc.id;
        const recipientData = recipientDoc.data();
        const recipientName = recipientData.displayName || recipientEmail.split('@')[0];

        if (callerUid === recipientUid) throw new HttpsError('invalid-argument', 'You cannot send tasks to yourself.');

        // --- 3. Check Subscription & Limits ---
        const subscriptionStatus = callerData.subscription?.status;
        const planId = callerData.subscription?.planId;
        const isYearly = planId === YEARLY_PLAN_ID;

        let currentCount = callerData.teamUsage?.sharedAssignedCount || 0;
        let resetDate = callerData.teamUsage?.resetDate?.toDate();
        const now = new Date();
        let needsUsageUpdate = false;

        // Reset count if reset date has passed
        if (resetDate && now >= resetDate) {
            currentCount = 0;
            resetDate = null; // Will be reset below
            needsUsageUpdate = true;
        }

        // Set next reset date if not already set (e.g., first use or after reset)
        if (!resetDate) {
            resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1); // 1st of next month
            needsUsageUpdate = true;
        }

        // Enforce limit only for non-yearly premium users
        if (subscriptionStatus === 'premium' && !isYearly) {
            if (currentCount + taskIds.length > SHARE_ASSIGN_LIMIT_MONTHLY) {
                throw new HttpsError('permission-denied', `Monthly limit (${SHARE_ASSIGN_LIMIT_MONTHLY} shares/assigns) reached. Upgrade to yearly or wait until ${resetDate.toLocaleDateString()}.`);
            }
            // Prepare to update count
            currentCount += taskIds.length;
            needsUsageUpdate = true;
        } else if (subscriptionStatus !== 'premium') {
             // Block free users entirely (redundant with frontend/rules, but good practice)
             throw new HttpsError('permission-denied', 'Team collaboration requires a premium subscription.');
        }
         // Yearly users have no limit checks

        // --- 4. Prepare Task Operations ---
        const senderTasksRef = db.collection('users').doc(callerUid).collection('tasks');
        const recipientTasksRef = db.collection('users').doc(recipientUid).collection('tasks');

        // Fetch original tasks (ensure they exist and belong to caller)
        const taskPromises = taskIds.map(id => senderTasksRef.doc(id).get());
        const taskDocs = await Promise.all(taskPromises);
        const originalTasksData = {}; // Store task data by ID

        for (const doc of taskDocs) {
            if (!doc.exists) throw new HttpsError('not-found', `Task with ID ${doc.id} not found.`);
            const taskData = doc.data();
            // Basic check to ensure task isn't already shared/assigned in a conflicting way
            if (taskData.sharedBy || taskData.assignedBy || taskData.assignedTo) {
                throw new HttpsError('failed-precondition', `Task "${taskData.text.substring(0,20)}..." is already part of a collaboration.`);
            }
            originalTasksData[doc.id] = taskData;
        }

        // Perform share/assign logic within the batch
        for (const taskId of taskIds) {
            const originalTask = originalTasksData[taskId];
            let conversationId = originalTask.conversationId;

            // Create conversation if it doesn't exist
            if (!conversationId) {
                const convoRef = db.collection('task_conversations').doc();
                conversationId = convoRef.id;
                batch.set(convoRef, { authorizedUsers: [callerUid], createdAt: admin.firestore.FieldValue.serverTimestamp() });
                const originalTaskRef = senderTasksRef.doc(taskId);
                batch.update(originalTaskRef, { conversationId: conversationId });
            }

            // Create the task copy for the recipient
            const { id, ...taskDataToCopy } = originalTask; // Exclude original ID
            const newRecipientTaskRef = recipientTasksRef.doc(); // Generate new ID
            const recipientTaskPayload = {
                ...taskDataToCopy,
                conversationId: conversationId,
                status: 'todo',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
                // order field might need recalculation or setting based on recipient's list
            };

            if (action === 'share') {
                recipientTaskPayload.sharedBy = { name: callerName, uid: callerUid };
            } else { // 'assign'
                recipientTaskPayload.assignedBy = { name: callerName, uid: callerUid };
                recipientTaskPayload.originalTaskId = taskId;
                recipientTaskPayload.originalAssignerUid = callerUid;
                recipientTaskPayload.category = 'Assigned'; // Force category

                // Update the original task to show it's assigned
                const originalTaskRef = senderTasksRef.doc(taskId);
                batch.update(originalTaskRef, {
                    assignedTo: { name: recipientName, uid: recipientUid, status: 'pending' }
                });
            }
            batch.set(newRecipientTaskRef, recipientTaskPayload);

            // Add recipient to the conversation
            const convoRef = db.collection('task_conversations').doc(conversationId);
            batch.update(convoRef, {
                authorizedUsers: admin.firestore.FieldValue.arrayUnion(recipientUid)
            });
        }

        // --- 5. Update Usage Count if necessary ---
        if (needsUsageUpdate) {
            batch.set(callerRef, {
                teamUsage: {
                    sharedAssignedCount: currentCount,
                    resetDate: admin.firestore.Timestamp.fromDate(resetDate)
                }
            }, { merge: true });
        }

        // --- 6. Commit Batch ---
        await batch.commit();

        return { success: true, message: `Successfully ${action === 'share' ? 'shared' : 'assigned'} ${taskIds.length} task(s).` };

    } catch (error) {
        console.error(`Error in shareOrAssignTasks function for user ${callerUid}:`, error);
        // Rethrow HttpsError directly, wrap others
        if (error instanceof HttpsError) {
            throw error;
        } else {
            throw new HttpsError('internal', 'An unexpected error occurred while processing your request.');
        }
    }
});

// --- FUNCTION 11: Update Firestore Storage Usage on File Upload (v2 SYNTAX) ---
// Triggered when a new file is successfully uploaded (finalized)
exports.updateStorageUsageOnUpload = onObjectFinalized(async (event) => {
    // v2 uses event.data instead of just 'object'
    const file = event.data;
    const fileSize = parseInt(file.size || '0'); // Size in bytes
    const filePath = file.name; // Full path e.g., 'task_attachments/shared/convId/file.jpg'

    // Ignore directories or files without size
    if (!filePath || fileSize === 0 || filePath.endsWith('/')) {
        console.log(`Ignoring non-file or zero-byte object: ${filePath}`);
        return null;
    }

    // --- Extract User ID ---
    let userId = null;
    const parts = filePath.split('/');

    if (filePath.startsWith('profile_photos/')) {
        // Path: profile_photos/{userId}/{fileName}
        userId = parts[1];
    } else if (filePath.startsWith('task_attachments/')) {
        // Path: task_attachments/{userId}/{taskId}/{fileName} (legacy)
        if (parts[1] !== 'shared') {
            userId = parts[1]; // User ID is the second part in legacy path
        } else {
            // *** FIX for SHARED FILES ***
            // Read the ownerId from the metadata we set during upload
            const metadata = file.metadata || {};
            if (metadata.ownerId) {
                userId = metadata.ownerId;
            } else {
                console.log(`Skipping shared file: ${filePath}. Missing 'ownerId' in metadata.`);
                return null;
            }
        }
    }

    if (!userId) {
        console.log(`Could not determine userId for file: ${filePath}`);
        return null;
    }

    // --- Update Firestore ---
    const userRef = admin.firestore().collection('users').doc(userId);
    try {
        // Atomically increment the storage usage
        await userRef.set({
            storageUsed: admin.firestore.FieldValue.increment(fileSize)
        }, { merge: true }); // Use set with merge:true to create field if it doesn't exist
        console.log(`Incremented storage for user ${userId} by ${fileSize} bytes.`);
        return null;
    } catch (error) {
        console.error(`Failed to update storage usage for user ${userId} on upload:`, error);
        return null;
    }
});

// --- FUNCTION 12: Update Firestore Storage Usage on File Delete (v2 SYNTAX) ---
// Triggered when a file is deleted
exports.updateStorageUsageOnDelete = onObjectDeleted(async (event) => {
    // v2 uses event.data instead of just 'object'
    const file = event.data;
    const fileSize = parseInt(file.size || '0'); // Size in bytes
    const filePath = file.name;

    // Ignore directories or files without size
    if (!filePath || fileSize === 0 || filePath.endsWith('/')) {
        console.log(`Ignoring non-file or zero-byte object deletion: ${filePath}`);
        return null;
    }

    // --- Extract User ID (Same logic as upload) ---
    let userId = null;
    const parts = filePath.split('/');

    if (filePath.startsWith('profile_photos/')) {
        userId = parts[1];
    } else if (filePath.startsWith('task_attachments/')) {
        if (parts[1] !== 'shared') {
            userId = parts[1];
        } else {
             // *** WORKAROUND (Still required for deletes) ***
            // When a file is deleted, its metadata is gone.
            // We cannot know who owned it, so we can't decrement their storage.
            console.log(`Skipping storage usage update for deleted shared file: ${filePath}.`);
            return null;
        }
    }

    if (!userId) {
        console.log(`Could not determine userId for deleted file: ${filePath}`);
        return null;
    }

    // --- Update Firestore ---
    const userRef = admin.firestore().collection('users').doc(userId);
    try {
        // Atomically decrement the storage usage (increment by negative value)
        await userRef.set({
            storageUsed: admin.firestore.FieldValue.increment(-fileSize)
        }, { merge: true });
        console.log(`Decremented storage for user ${userId} by ${fileSize} bytes.`);
        return null;
    } catch (error) {
        // If user doc doesn't exist (e.g., account deleted), just log it and exit gracefully.
        if (error.code === 5) { // Firestore NOT_FOUND error code
             console.log(`User document ${userId} not found. Skipping storage update on delete.`);
             return null;
        }
        console.error(`Failed to update storage usage for user ${userId} on delete:`, error);
        return null;
    }
});

// --- FUNCTION 13: Admin Update User Name (NEW) ---
exports.adminUpdateUserName = onCall(async (request) => {
  // 1. Security Check: Verify the caller is an admin.
  const adminUid = request.auth?.uid;
  if (!adminUid) {
    throw new HttpsError(
      'unauthenticated',
      'You must be logged in to perform this action.'
    );
  }

  // Check Firestore role just in case custom claims aren't set
  if (request.auth.token.role !== 'admin') {
    const adminDoc = await admin.firestore().collection('users').doc(adminUid).get();
    if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
        throw new HttpsError(
            'permission-denied',
            'You must be an admin to perform this action.'
        );
    }
  }

  // 2. Get the target user's ID and new name.
  const { userId, newName } = request.data;
  if (!userId || !newName || newName.trim() === "") {
    throw new HttpsError(
        'invalid-argument',
        'Please provide a valid user ID and a non-empty name.'
    );
  }

  try {
    // 3. Update BOTH Firebase Auth and Firestore
    
    // Update Firebase Authentication display name
    await admin.auth().updateUser(userId, { displayName: newName });

    // Update Firestore display name
    await admin.firestore().collection('users').doc(userId).update({
        displayName: newName
    });

    // 4. Return a success message.
    return { success: true, message: `Successfully updated name for user ${userId}.` };

  } catch (error) {
    console.error("Error updating user name:", error);
    throw new HttpsError(
        'internal',
        'An unexpected error occurred while updating the name.'
    );
  }
});