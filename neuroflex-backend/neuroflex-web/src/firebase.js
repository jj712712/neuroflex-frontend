// Import Firebase SDK
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase configuration (Replace with your actual Firebase credentials)
const firebaseConfig = {
    apiKey: "AIzaSyB9WUxUzpigfadpCnzG0HHLk9OCXnfdxFM",
  authDomain: "neuroflex-d55ab.firebaseapp.com",
  projectId: "neuroflex-d55ab",
  storageBucket: "neuroflex-d55ab.firebasestorage.app",
  messagingSenderId: "258876588783",
  appId: "1:258876588783:web:b91fcb33e1552ea5dd511a",
  measurementId: "G-J5H3TDX5SF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);          // Firebase Authentication
export const db = getFirestore(app);       // Firestore Database
export const storage = getStorage(app);    // Firebase Storage
export default app;
