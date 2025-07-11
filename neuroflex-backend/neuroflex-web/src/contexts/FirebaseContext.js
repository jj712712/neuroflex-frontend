// src/contexts/FirebaseContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
// IMPORTANT: Import auth and db from your central firebaseConfig.js
import { auth, db } from '../firebaseConfig'; // Correct path assumed


const FirebaseContext = createContext(null);

// Custom hook to consume the Firebase context
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

// Firebase Provider component
export const FirebaseProvider = ({ children }) => {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [firebaseError, setFirebaseError] = useState(null);

  useEffect(() => {
    // Check if auth and db objects are available (they should be, from firebaseConfig.js)
    if (!auth || !db) {
      setFirebaseError("Firebase services (auth/db) not available. Check src/firebaseConfig.js exports.");
      setIsFirebaseReady(false);
      return;
    }

    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        setIsFirebaseReady(true);
        setFirebaseError(null); // Clear any previous errors if auth succeeds
        console.log("FirebaseContext: User authenticated. UID:", user.uid);
      } else {
        setCurrentUserId(null);
        setIsFirebaseReady(false); // Not ready until an authenticated user session is established
        console.log("FirebaseContext: No user authenticated yet. Waiting for initial sign-in.");
        // The initial signInAnonymously/signInWithCustomToken is handled in firebaseConfig.js,
        // so this listener will update once that completes.
      }
    });

    return () => unsubscribe(); // Clean up the listener on unmount
  }, []); // Empty dependency array means this effect runs once on mount

  const value = {
    db,
    auth,
    currentUserId,
    isFirebaseReady,
    firebaseError,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};
