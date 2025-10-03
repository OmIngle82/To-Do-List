// Use the new v2 syntax for Cloud Functions
const {onRequest} = require("firebase-functions/v2/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");

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