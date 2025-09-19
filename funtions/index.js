const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// This is a scheduled function that runs every 15 minutes.
exports.sendTaskReminders = functions.pubsub.schedule("every 15 minutes").onRun(async (context) => {
    const now = new Date();
    // Set a window for reminders 
    const reminderWindowEnd = new Date(now.getTime() + 15 * 60 * 1000);

    const db = admin.firestore();
    const usersSnapshot = await db.collection("users").get();

    const promises = [];

    for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();
        // Check if the user has an FCM token to receive notifications
        if (user.fcmToken) {
            const tasksSnapshot = await db.collection("users").doc(userDoc.id).collection("tasks").get();

            for (const taskDoc of tasksSnapshot.docs) {
                const task = taskDoc.data();
                if (task.deadline && task.status !== "completed") {
                    const deadline = task.deadline.toDate();

                    // Check if the task is due within our reminder window
                    if (deadline > now && deadline <= reminderWindowEnd) {
                        const payload = {
                            notification: {
                                title: "Task Reminder!",
                                body: `Your task "${task.text}" is due soon.`,
                            },
                            token: user.fcmToken,
                        };
                        
                        // Send the notification
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
