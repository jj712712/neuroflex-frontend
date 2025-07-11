// src/components/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom'; // Make sure 'Navigate' is correctly imported
import { auth } from '../firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth'; // Recommended way to track auth state

const PrivateRoute = ({ children }) => {
 // Use useAuthState hook to get the authentication state
 const [user, loading, error] = useAuthState(auth);

 if (loading) {
  // Optionally render a loading indicator while checking auth state
  return <div>Loading...</div>;
 }

 if (error) {
  console.error("Error checking authentication:", error);
  return <Navigate to="/login" />; // Redirect on error as well
 }

 // If user is authenticated, render the children
 return user ? children : <Navigate to="/login" />;
};

export default PrivateRoute;