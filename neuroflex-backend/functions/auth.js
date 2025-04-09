const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();

router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body; // role: "User" or "Therapist"

  try {
    const userRecord = await admin.auth().createUser({ email, password });
    
    await db.collection("users").doc(userRecord.uid).set({
      name,
      email,
      role,
      therapistId: null,  // Assigned later if the user chooses a therapist
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ message: "User registered successfully!", uid: userRecord.uid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      const userDoc = await db.collection("users").doc(userRecord.uid).get();
  
      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }
  
      res.status(200).json({ message: "Login successful!", role: userDoc.data().role, uid: userRecord.uid });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  module.exports = router;
  