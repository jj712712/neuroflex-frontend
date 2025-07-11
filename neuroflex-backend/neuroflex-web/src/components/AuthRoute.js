// src/components/AuthRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';

const AuthRoute = ({ children }) => {
 const isAuthenticated = !!auth.currentUser;
 const userRole = localStorage.getItem('userRole');

 if (!isAuthenticated) {
  return children; // Render the Login or Signup component
 } else {
  if (userRole === 'therapist') {
   return <Navigate to="/therapist-dashboard" replace />;
  } else {
   return <Navigate to="/user-dashboard" replace />;
  }
 }
};

export default AuthRoute;