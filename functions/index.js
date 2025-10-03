const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// This is our main email processing function.
exports.emailToTaskWebhook = functions.https.onRequest(async (req, res) => {
  // We only accept POST requests from Pipedream.
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

    try {
    // 1. Extract the relevant data directly from the request body.
    const toAddress = req.body.headers.to.text;
    const taskTitle = req.body.headers.subject;
    const taskDescription = req.body.text || "No content.";

    // FIX: The 'from' object is inside 'headers'.
    const fromAddress = req.body.headers.from.value[0].address;

    if (!fromAddress) {
      console.error("Could not find a 'from' address in the email.");
      res.status(400).send("Bad Request: Sender address not found.");
      return;
    }
    
    // Find the user in Firestore by their email address.
    const usersRef = admin.firestore().collection("users");
    const querySnapshot = await usersRef.where('email', '==', fromAddress.toLowerCase()).get();

    if (querySnapshot.empty) {
        console.error("User not found for email:", fromAddress);
        res.status(404).send("User not found.");
        return;
    }
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;

    // 3. Create a new task in that user's 'tasks' subcollection in Firestore.
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