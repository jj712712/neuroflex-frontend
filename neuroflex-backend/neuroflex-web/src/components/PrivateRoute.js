// src/components/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom'; // Removed 'Route' import
import { auth } from '../firebase';

const PrivateRoute = ({ children }) => {
    const isAuthenticated = auth.currentUser;

    return isAuthenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute;