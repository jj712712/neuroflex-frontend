// src/components/AuthRoute.js
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig'; // Ensure db is imported
import { doc, getDoc } from 'firebase/firestore';

const AuthRoute = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                setIsAuthenticated(true);
                // Fetch role from Firestore (or localStorage if already loaded by AppRoutes)
                const storedRole = localStorage.getItem('userRole');
                if (storedRole) {
                    setUserRole(storedRole);
                } else {
                    try {
                        const userDocRef = doc(db, 'users', user.uid);
                        const userDocSnap = await getDoc(userDocRef);
                        if (userDocSnap.exists()) {
                            const role = userDocSnap.data().role;
                            setUserRole(role);
                            localStorage.setItem('userRole', role);
                        } else {
                            console.warn("User document not found for AuthRoute, assuming no role.");
                            setUserRole(null); // No role found, treat as unprivileged
                        }
                    } catch (error) {
                        console.error("Error fetching user role in AuthRoute:", error);
                        setUserRole(null);
                    }
                }
            } else {
                setIsAuthenticated(false);
                setUserRole(null);
                localStorage.removeItem('userRole'); // Ensure role is cleared on logout
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div>Loading authentication status...</div>; // Or a spinner
    }

    if (!isAuthenticated) {
        return children; // User is NOT authenticated, allow access to login/signup
    } else {
        // User IS authenticated, redirect based on role
        if (userRole === 'therapist') {
            return <Navigate to="/therapist-dashboard" replace />;
        } else if (userRole === 'patient') {
            return <Navigate to="/user-dashboard" replace />;
        } else {
            // If role is not defined or unknown, redirect to a default authenticated page
            return <Navigate to="/" replace />; // Or a generic dashboard
        }
    }
};

export default AuthRoute;