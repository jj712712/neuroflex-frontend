// src/pages/ViewProfilePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth'; // Import getAuth
import { doc, getFirestore, getDoc } from 'firebase/firestore'; // Import Firestore functions
import '../styles/ViewProfilePage.css';
import DefaultAvatar from '../assets/Check.jpg'; // Make sure you have a default avatar image

const ViewProfilePage = () => {
    const [userData, setUserData] = useState(null);
    const navigate = useNavigate();
    const auth = getAuth(); // Get the Firebase Auth instance

    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser; // Get the current authenticated user

            if (!user) {
                // Handle case where no user is logged in (e.g., redirect to login)
                console.log("No user logged in, cannot fetch profile.");
                setUserData({}); // Stop loading, show empty or error state
                return;
            }

            try {
                // Fetch additional user data from Firestore
                const userDocRef = doc(getFirestore(), 'users', user.uid);
                const docSnap = await getDoc(userDocRef);

                let data = {
                    personalInformation: {
                        fullName: user.displayName || 'N/A', // Prioritize Auth displayName
                        email: user.email || 'N/A', // Prioritize Auth email
                        profilePictureUrl: user.photoURL || DefaultAvatar, // Get photoURL from Firebase Auth
                        // Default joined date - consider storing this in Firestore upon user creation
                        joinedDate: 'N/A' // This needs to be fetched from Firestore or stored globally
                    }
                };

                if (docSnap.exists()) {
                    const firestoreData = docSnap.data();
                    data.personalInformation = {
                        ...data.personalInformation,
                        phoneNumber: firestoreData.phoneNumber || 'N/A',
                        dateOfBirth: firestoreData.dateOfBirth || 'N/A',
                        gender: firestoreData.gender || 'N/A',
                        country: firestoreData.country || 'N/A',
                        city: firestoreData.city || 'N/A',
                        address: firestoreData.address || 'N/A',
                        joinedDate: firestoreData.joinedDate || 'N/A' // Make sure you save joinedDate in Firestore on user creation
                    };
                }

                setUserData(data);
            } catch (error) {
                console.error('Error fetching user data for View Profile:', error);
                setUserData({});
            }
        };

        fetchUserData();
    }, [auth]); // Depend on auth to re-run if user changes (e.g., login/logout)

    if (!userData) {
        return <div className="profile-loading">Loading patient details...</div>;
    }

    const personalInfo = userData.personalInformation || {};

    return (
        <div className="view-profile-page-container">
            <div className="profile-header">
                <img
                    src={personalInfo.profilePictureUrl}
                    alt="Profile"
                    className="profile-picture"
                />
                <h2 className="profile-name">{personalInfo.fullName || 'Patient Name'}</h2>
                <p className="member-since">Member Since: {personalInfo.joinedDate || 'N/A'}</p>
                <button className="edit-profile-button" onClick={() => navigate('/manage-profile')}>
                    Edit Profile
                </button>
            </div>

            <h1 className="view-profile-title">Patient Details</h1>

            <section className="profile-details-section">
                <h3 className="section-subtitle">Basic Information</h3>
                <div className="profile-detail-grid">
                    <div className="profile-detail-item">
                        <span className="label">Full Name:</span>
                        <span className="value">{personalInfo.fullName || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item">
                        <span className="label">Gender:</span>
                        <span className="value">{personalInfo.gender || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item">
                        <span className="label">Date of Birth:</span>
                        <span className="value">{personalInfo.dateOfBirth || 'N/A'}</span>
                    </div>
                </div>

                <h3 className="section-subtitle">Contact Details</h3>
                <div className="profile-detail-grid">
                    <div className="profile-detail-item">
                        <span className="label">Email:</span>
                        <span className="value">{personalInfo.email || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item">
                        <span className="label">Phone Number:</span>
                        <span className="value">{personalInfo.phoneNumber || 'N/A'}</span>
                    </div>
                </div>

                <h3 className="section-subtitle">Location Information</h3>
                <div className="profile-detail-grid">
                    <div className="profile-detail-item">
                        <span className="label">Country:</span>
                        <span className="value">{personalInfo.country || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item">
                        <span className="label">City:</span>
                        <span className="value">{personalInfo.city || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item">
                        <span className="label">Address:</span>
                        <span className="value">{personalInfo.address || 'N/A'}</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ViewProfilePage;