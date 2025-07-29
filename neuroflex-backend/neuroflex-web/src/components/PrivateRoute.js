// src/components/PrivateRoute.js
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig'; // Ensure 'db' is imported
import { doc, getDoc } from 'firebase/firestore'; // Ensure doc, getDoc are imported
import { useAuthState } from 'react-firebase-hooks/auth'; // Recommended way to track auth state

const PrivateRoute = ({ children, requiredRole = 'any' }) => {
    // Use useAuthState hook to get the authentication state
    // user: The authenticated user object (or null)
    // loading: True while Firebase is checking auth state
    // error: Any error during auth state check
    const [user, loadingAuth, errorAuth] = useAuthState(auth);

    // State to manage loading of user role data
    const [loadingRole, setLoadingRole] = useState(true);
    // State to store the user's actual role
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        // This effect runs when user or loadingAuth changes
        if (!loadingAuth) { // Only proceed if Firebase auth state has been determined
            if (user) {
                // User is logged in, now fetch their role
                const fetchUserRole = async () => {
                    setLoadingRole(true); // Start loading role
                    try {
                        const userDocRef = doc(db, 'users', user.uid);
                        const userDocSnap = await getDoc(userDocRef);

                        if (userDocSnap.exists()) {
                            const role = userDocSnap.data().role;
                            setUserRole(role);
                            // Store role in localStorage for quick access by other components
                            localStorage.setItem('userRole', role);
                        } else {
                            console.warn("User document not found for PrivateRoute. User might be authenticated but lacks a role in Firestore.");
                            setUserRole(null); // User exists but no role found
                            localStorage.removeItem('userRole'); // Clear potentially old role
                        }
                    } catch (err) {
                        console.error("Error fetching user role in PrivateRoute:", err);
                        setUserRole(null); // Error fetching role
                        localStorage.removeItem('userRole');
                    } finally {
                        setLoadingRole(false); // Role loading finished
                    }
                };
                fetchUserRole();
            } else {
                // No user logged in, so no role to fetch
                setUserRole(null);
                localStorage.removeItem('userRole');
                setLoadingRole(false); // No role to load, so finished
            }
        }
    }, [user, loadingAuth]); // Dependencies: re-run when user or loadingAuth changes

    // --- Loading States ---
    if (loadingAuth || loadingRole) {
        // Show a loading indicator while checking auth state or fetching role
        return <div className="private-route-loading">Loading permissions...</div>;
    }

    // --- Error Handling ---
    if (errorAuth) {
        console.error("Authentication error in PrivateRoute:", errorAuth);
        return <Navigate to="/login" replace />; // Redirect to login on auth error
    }

    // --- Authorization Logic ---
    if (!user) {
        // No user is authenticated, redirect to login
        return <Navigate to="/login" replace />;
    }

    // User is authenticated, now check if their role matches the required role
    const isAuthorized = (requiredRole === 'any' || userRole === requiredRole);

    if (!isAuthorized) {
        console.warn(`Access denied: User role '${userRole}' does not match required role '${requiredRole}'.`);
        // If not authorized, redirect to a more appropriate place
        // For example, if a therapist tries to access patient dashboard, send them to therapist dashboard
        if (userRole === 'therapist') {
            return <Navigate to="/therapist-dashboard" replace />;
        } else if (userRole === 'patient') {
            return <Navigate to="/user-dashboard" replace />;
        } else {
            // Default redirect if role is unknown or not handled
            return <Navigate to="/" replace />; // Or a generic unauthorized page
        }
    }

    // User is authenticated and authorized, render the children
    return children;
};

export default PrivateRoute;