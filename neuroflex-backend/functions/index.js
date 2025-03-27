const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();
const db = admin.firestore();
const app = express();
app.use(cors());
app.use(express.json());

// API: Register New User
app.post("/register", async (req, res) => {
    const { email, password, role } = req.body;
    try {
        const userRecord = await admin.auth().createUser({
            email,
            password,
        });
        await db.collection("users").doc(userRecord.uid).set({ email, role });
        res.status(201).send("User registered successfully");
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// API: Get EEG Session Data
app.get("/sessions/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
        const snapshot = await db.collection("sessions").where("userId", "==", userId).get();
        const sessions = snapshot.docs.map(doc => doc.data());
        res.status(200).json(sessions);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

exports.api = functions.https.onRequest(app);
