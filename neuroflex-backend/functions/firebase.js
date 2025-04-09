const admin = require("firebase-admin");
const functions = require("firebase-functions");

// Load Firebase credentials
const serviceAccount = require("./serviceAccountKey.json"); // Download this from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://console.firebase.google.com/project/neuroflex-d55ab", // Replace with your Firebase project URL
});

const db = admin.firestore();

module.exports = { admin, db, functions };
