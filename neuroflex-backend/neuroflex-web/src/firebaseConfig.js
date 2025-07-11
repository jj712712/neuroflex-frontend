// // Import Firebase SDK 
// // firebaseConfig.js
// import { initializeApp } from "firebase/app";
// import { getAuth } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";
// import { getStorage } from "firebase/storage";

// // Your Firebase configuration (Replace with your actual Firebase credentials)
// const firebaseConfig = {
//     apiKey: "AIzaSyB9WUxUzpigfadpCnzG0HHLk9OCXnfdxFM",
//   authDomain: "neuroflex-d55ab.firebaseapp.com",
//   projectId: "neuroflex-d55ab",
//   storageBucket: "neuroflex-d55ab.firebasestorage.app",
//   messagingSenderId: "258876588783",
//   appId: "1:258876588783:web:b91fcb33e1552ea5dd511a",
//   measurementId: "G-J5H3TDX5SF"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);

// // Export Firebase services
// export const auth = getAuth(app);          // Firebase Authentication
// export const db = getFirestore(app);       // Firestore Database
// export const storage = getStorage(app);    // Firebase Storage
// export default app;



// src/firebaseConfig.js
// src/firebaseConfig.js - The ONLY place where Firebase App is initialized.
import { initializeApp, getApps, getApp } from "firebase/app"; // Import getApps and getApp for checking
import { getAuth, signInAnonymously, signInWithCustomToken } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase configuration (as provided by you previously)
const firebaseConfig = {
    apiKey: "AIzaSyB9WUxUzpigfadpCnzG0HHLk9OCXnfdxFM",
    authDomain: "neuroflex-d55ab.firebaseapp.com",
    projectId: "neuroflex-d55ab",
    storageBucket: "neuroflex-d55ab.firebasestorage.app",
    messagingSenderId: "258876588783",
    appId: "1:258876588783:web:b91fcb33e1552ea5dd511a",
    measurementId: "G-J5H3TDX5SF"
};

// Initialize Firebase App only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Handle initial authentication for Canvas environment or anonymous sign-in
// This ensures Firebase is authenticated when the app loads in Canvas.
// It runs only when firebaseConfig.js is initially imported.

/* eslint-disable no-undef */ // Temporarily disable no-undef for this block
if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
    signInWithCustomToken(auth, __initial_auth_token)
        .then(() => console.log("Firebase: Signed in with Canvas custom token."))
        .catch(error => console.error("Firebase: Custom token sign-in error:", error));
} else {
    signInAnonymously(auth)
        .then(() => console.log("Firebase: Signed in anonymously."))
        .catch(error => console.error("Firebase: Anonymous sign-in error:", error));
}
/* eslint-enable no-undef */ // Re-enable no-undef

export default app;

