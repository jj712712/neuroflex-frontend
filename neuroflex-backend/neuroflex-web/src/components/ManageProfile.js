// src/pages/ManageProfile.js
import React, { useState, useEffect } from 'react';
import { getAuth, updateProfile, updateEmail, reauthenticateWithCredential, EmailAuthProvider, updatePassword, deleteUser } from 'firebase/auth';
import { doc, getFirestore, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Import Firebase Storage functions
import './ManageProfile.css'; // Ensure this CSS file is present and linked

const ManageProfile = () => {
    const auth = getAuth();
    const db = getFirestore();
    const storage = getStorage(); // Initialize Firebase Storage
    const user = auth.currentUser;

    // State for Basic Personal Information
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender, setGender] = useState('');
    const [address, setAddress] = useState('');
    const [profilePictureFile, setProfilePictureFile] = useState(null); // New state for selected file
    const [profilePictureUrl, setProfilePictureUrl] = useState(''); // New state for current profile pic URL

    // State for Notification Settings
    const [receiveEmailNotifications, setReceiveEmailNotifications] = useState(true);
    const [productUpdatesNewsletters, setProductUpdatesNewsletters] = useState(true);

    // State for Privacy Settings (commented out in your provided code, keeping for completeness if you enable them)
    const [allowDataSharing, setAllowDataSharing] = useState(false);

    // State for Account Security (Change Password)
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    // State for UI Feedback
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showReauthModal, setShowReauthModal] = useState(false);
    const [reauthPassword, setReauthPassword] = useState('');
    const [reauthPurpose, setReauthPurpose] = useState(''); // 'email' or 'delete'

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setEmail(user.email || '');
            setProfilePictureUrl(user.photoURL || ''); // Get current photo URL from Firebase Auth

            // Fetch additional user data from Firestore
            const userDocRef = doc(db, 'users', user.uid);
            getDoc(userDocRef)
                .then((docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setPhoneNumber(data.phoneNumber || '');
                        setDateOfBirth(data.dateOfBirth || '');
                        setGender(data.gender || '');
                        setAddress(data.address || '');
                        setReceiveEmailNotifications(data.receiveEmailNotifications ?? true);
                        setProductUpdatesNewsletters(data.productUpdatesNewsletters ?? true);
                        setAllowDataSharing(data.allowDataSharing ?? false);
                        // Ensure profilePictureUrl from Firestore is prioritized if it's stored there
                        // or if you prefer Firestore to be the source of truth for the image URL.
                        // For now, Firebase Auth's photoURL is often simpler.
                        // setProfilePictureUrl(data.profilePictureUrl || user.photoURL || '');
                    }
                })
                .catch((err) => {
                    console.error("Error fetching user data from Firestore:", err);
                    setError("Failed to load profile data. Please try again.");
                });
        }
    }, [user, db]);

    const handleReauthentication = async () => {
        setError('');
        setSuccess('');
        setIsSaving(true);

        try {
            const credential = EmailAuthProvider.credential(user.email, reauthPassword);
            await reauthenticateWithCredential(user, credential);
            setShowReauthModal(false); // Close modal on successful reauth
            setReauthPassword(''); // Clear password field

            // Proceed with the original action after reauthentication
            if (reauthPurpose === 'email') {
                try {
                    await updateEmail(user, email);
                    const userDocRef = doc(db, 'users', user.uid);
                    await updateDoc(userDocRef, { email: email });
                    setSuccess('Email update initiated! Please check your NEW email inbox (and spam folder) for a verification link to complete the change.');
                } catch (emailUpdateErr) {
                    console.error('Error updating email after reauth:', emailUpdateErr);
                    if (emailUpdateErr.code === 'auth/invalid-email') {
                        setError('The new email address provided is not valid.');
                    } else if (emailUpdateErr.code === 'auth/email-already-in-use') {
                        setError('The new email address is already in use by another account.');
                    } else {
                        setError(`Failed to update email: ${emailUpdateErr.message}. Please try again.`);
                    }
                }
            } else if (reauthPurpose === 'delete') {
                await deleteDoc(doc(db, 'users', user.uid));
                await deleteUser(user);
                setSuccess('Account deleted successfully. Redirecting...');
                // navigate('/'); // You'd typically redirect here
            }
        } catch (err) {
            console.error('Reauthentication error:', err);
            if (err.code === 'auth/wrong-password') {
                setError('Incorrect password for reauthentication.');
            } else if (err.code === 'auth/user-disabled') {
                setError('Your account has been disabled. Please contact support.');
            } else {
                setError(`Reauthentication failed: ${err.message}`);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleProfilePictureChange = (e) => {
        if (e.target.files[0]) {
            setProfilePictureFile(e.target.files[0]);
            // Optional: display a preview immediately
            const reader = new FileReader();
            reader.onload = (event) => {
                setProfilePictureUrl(event.target.result); // Show local preview
            };
            reader.readAsDataURL(e.target.files[0]);
        } else {
            setProfilePictureFile(null);
            setProfilePictureUrl(user.photoURL || ''); // Reset to current if no file selected
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSaving(true);

        if (!user) {
            setError('No user is logged in.');
            setIsSaving(false);
            return;
        }

        const authUpdates = {};
        let emailChanged = false;
        let profilePictureChanged = false;

        if (displayName !== user.displayName) {
            authUpdates.displayName = displayName;
        }

        if (email !== user.email) {
            emailChanged = true;
        }

        if (profilePictureFile) {
            profilePictureChanged = true;
        }

        const firestoreUpdates = {};
        if (phoneNumber !== (user.phoneNumber || '')) {
            firestoreUpdates.phoneNumber = phoneNumber;
        }
        if (dateOfBirth !== (user.dateOfBirth || '')) {
            firestoreUpdates.dateOfBirth = dateOfBirth;
        }
        if (gender !== (user.gender || '')) {
            firestoreUpdates.gender = gender;
        }
        if (address !== (user.address || '')) {
            firestoreUpdates.address = address;
        }

        let updateAuthPromise = Promise.resolve();
        let updateFirestorePromise = Promise.resolve();
        let emailUpdateInProgress = false;

        try {
            // 1. Handle Profile Picture Upload
            if (profilePictureChanged) {
                const storageRef = ref(storage, `profile_pictures/${user.uid}/${profilePictureFile.name}`);
                await uploadBytes(storageRef, profilePictureFile);
                const downloadURL = await getDownloadURL(storageRef);
                authUpdates.photoURL = downloadURL;
                // You might also want to save this URL in Firestore if that's your primary data source for some reason
                // firestoreUpdates.profilePictureUrl = downloadURL;
                setProfilePictureUrl(downloadURL); // Update local state for immediate display
            }

            // 2. Handle Firebase Auth profile updates (displayName, photoURL)
            if (Object.keys(authUpdates).length > 0) {
                updateAuthPromise = updateProfile(user, authUpdates);
            }

            // 3. Handle email update (requires reauthentication if needed)
            if (emailChanged) {
                emailUpdateInProgress = true;
                try {
                    await updateEmail(user, email);
                    setSuccess('Email update initiated! Please check your NEW email inbox (and spam folder) for a verification link to complete the change.');
                } catch (err) {
                    if (err.code === 'auth/requires-recent-login') {
                        setError('Email change requires recent login. Please re-enter your password.');
                        setShowReauthModal(true);
                        setReauthPurpose('email');
                        setIsSaving(false);
                        return;
                    } else if (err.code === 'auth/invalid-email') {
                        setError('The new email address is not valid.');
                    } else if (err.code === 'auth/email-already-in-use') {
                        setError('The new email address is already in use by another account.');
                    } else {
                        setError(`Failed to update email: ${err.message}`);
                    }
                    setIsSaving(false);
                    return;
                }
            }

            // 4. Update Firestore document for additional fields
            if (Object.keys(firestoreUpdates).length > 0) {
                const userDocRef = doc(db, 'users', user.uid);
                updateFirestorePromise = updateDoc(userDocRef, firestoreUpdates);
            }

            // Wait for all non-email-related updates to complete
            await Promise.all([updateAuthPromise, updateFirestorePromise]);

            if (!emailUpdateInProgress && (Object.keys(authUpdates).length > 0 || Object.keys(firestoreUpdates).length > 0)) {
                setSuccess('Profile updated successfully!');
            }

            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setProfilePictureFile(null); // Clear the file input after successful upload

        } catch (err) {
            console.error('Error updating profile:', err);
            setError(`Failed to update profile: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSaving(true);

        if (!user) {
            setError('No user is logged in.');
            setIsSaving(false);
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setError('New password and confirmation do not match.');
            setIsSaving(false);
            return;
        }

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long.');
            setIsSaving(false);
            return;
        }

        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            setSuccess('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (err) {
            console.error('Error changing password:', err);
            if (err.code === 'auth/wrong-password') {
                setError('Incorrect current password.');
            } else if (err.code === 'auth/requires-recent-login') {
                setError('This operation is sensitive and requires recent authentication. Please log out and log back in, then try again.');
            } else if (err.code === 'auth/weak-password') {
                setError('The new password is too weak. Please use a stronger password.');
            } else {
                setError(`Failed to change password: ${err.message}`);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleNotificationSettingsUpdate = async () => {
        setError('');
        setSuccess('');
        setIsSaving(true);
        if (!user) {
            setError('No user is logged in.');
            setIsSaving(false);
            return;
        }
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                receiveEmailNotifications,
                productUpdatesNewsletters,
            });
            setSuccess('Notification settings updated successfully!');
        } catch (err) {
            console.error('Error updating notification settings:', err);
            setError(`Failed to update notification settings: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    // Placeholder for handlePrivacySettingsUpdate and handleDownloadData if you re-enable them
    const handlePrivacySettingsUpdate = async () => {
        setError('');
        setSuccess('');
        setIsSaving(true);
        if (!user) {
            setError('No user is logged in.');
            setIsSaving(false);
            return;
        }
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                allowDataSharing,
            });
            setSuccess('Privacy settings updated successfully!');
        } catch (err) {
            console.error('Error updating privacy settings:', err);
            setError(`Failed to update privacy settings: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownloadData = () => {
        setError('');
        setSuccess('');
        setSuccess('Your data download is being prepared. Please check your email or wait for the download to start.');
        console.log("Simulating data download for user:", user.uid);
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.")) {
            return;
        }
        setError('');
        setSuccess('');
        setIsSaving(true);

        if (!user) {
            setError('No user is logged in.');
            setIsSaving(false);
            return;
        }

        try {
            setError('Account deletion requires recent authentication. Please re-enter your password.');
            setShowReauthModal(true);
            setReauthPurpose('delete');
        } catch (err) {
            console.error('Error initiating account deletion:', err);
            setError(`Failed to initiate account deletion: ${err.message}`);
            setIsSaving(false);
        }
    };

    if (!user) {
        return (
            <div className="profile-page-wrapper">
                <div className="profile-container">
                    <p className="loading-message">Please log in to view and manage your profile.</p>
                </div>
            </div>
        );
    }

    const sections = [
        {
            title: "Personal Information",
            description: "Update your name, contact details, and other personal data.",
            content: (
                <form onSubmit={handleProfileUpdate} className="profile-form">
                    <div className="form-group profile-picture-upload">
                        <label className="form-label">Profile Picture:</label>
                        <div className="profile-picture-preview-container">
                            <img
                                src={profilePictureUrl || 'https://via.placeholder.com/150/d3d3d3/ffffff?text=No+Image'}
                                alt="Profile Preview"
                                className="profile-picture-preview"
                            />
                            <input
                                type="file"
                                id="profilePicture"
                                className="file-input"
                                accept="image/*"
                                onChange={handleProfilePictureChange}
                                aria-label="Upload Profile Picture"
                            />
                            <label htmlFor="profilePicture" className="custom-file-upload">
                                Choose File
                            </label>
                            {profilePictureFile && <span className="file-name">{profilePictureFile.name}</span>}
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="displayName" className="form-label">Name:</label>
                        <input
                            type="text"
                            id="displayName"
                            className="form-input"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            aria-label="Display Name"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">Email:</label>
                        <input
                            type="email"
                            id="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            aria-label="Email Address"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="phoneNumber" className="form-label">Phone Number:</label>
                        <input
                            type="tel"
                            id="phoneNumber"
                            className="form-input"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="e.g., +1234567890"
                            aria-label="Phone Number"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="dateOfBirth" className="form-label">Date of Birth:</label>
                        <input
                            type="date"
                            id="dateOfBirth"
                            className="form-input"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            aria-label="Date of Birth"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="gender" className="form-label">Gender:</label>
                        <select
                            id="gender"
                            className="form-input"
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            aria-label="Gender"
                        >
                            <option value="">Select...</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="non-binary">Non-binary</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="address" className="form-label">Address:</label>
                        <textarea
                            id="address"
                            className="form-input textarea-no-resize"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            rows="3"
                            placeholder="Your full address"
                            aria-label="Full Address"
                        ></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? 'Saving Profile...' : 'Update Profile'}
                    </button>
                </form>
            ),
            className: "personal-info-section"
        },
        {
            title: "Change Password",
            description: "Update your password to keep your account secure.",
            content: (
                <form onSubmit={handleChangePassword} className="profile-form">
                    <div className="form-group">
                        <label htmlFor="currentPassword" className="form-label">Current Password:</label>
                        <input
                            type="password"
                            id="currentPassword"
                            className="form-input"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            aria-label="Current Password"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="newPassword" className="form-label">New Password:</label>
                        <input
                            type="password"
                            id="newPassword"
                            className="form-input"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            aria-label="New Password"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmNewPassword" className="form-label">Confirm New Password:</label>
                        <input
                            type="password"
                            id="confirmNewPassword"
                            className="form-input"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            required
                            aria-label="Confirm New Password"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? 'Changing Password...' : 'Change Password'}
                    </button>
                </form>
            ),
            className: "security-section"
        },
        {
            title: "Notification Settings",
            description: "Control what kind of notifications you receive.",
            content: (
                <div className="profile-form">
                    <div className="checkbox-group">
                        <input
                            type="checkbox"
                            id="receiveEmailNotifications"
                            className="checkbox-custom"
                            checked={receiveEmailNotifications}
                            onChange={(e) => setReceiveEmailNotifications(e.target.checked)}
                        />
                        <label htmlFor="receiveEmailNotifications" className="checkbox-label">Receive Email Notifications</label>
                    </div>
                    <div className="checkbox-group">
                        <input
                            type="checkbox"
                            id="productUpdatesNewsletters"
                            className="checkbox-custom"
                            checked={productUpdatesNewsletters}
                            onChange={(e) => setProductUpdatesNewsletters(e.target.checked)}
                        />
                        <label htmlFor="productUpdatesNewsletters" className="checkbox-label">Product Updates & Newsletters</label>
                    </div>
                    <button onClick={handleNotificationSettingsUpdate} className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? 'Saving Settings...' : 'Save Notification Settings'}
                    </button>
                </div>
            ),
            className: "notification-settings-section"
        },
        // {
        //     title: "Privacy Settings",
        //     description: "Manage how your data is used and shared.",
        //     content: (
        //         <div className="profile-form">
        //             <div className="checkbox-group">
        //                 <input
        //                     type="checkbox"
        //                     id="allowDataSharing"
        //                     className="checkbox-custom"
        //                     checked={allowDataSharing}
        //                     onChange={(e) => setAllowDataSharing(e.target.checked)}
        //                 />
        //                 <label htmlFor="allowDataSharing" className="checkbox-label">Allow Data Sharing for Analytics</label>
        //             </div>
        //             <button onClick={handlePrivacySettingsUpdate} className="btn btn-primary" disabled={isSaving}>
        //                 {isSaving ? 'Saving Settings...' : 'Save Privacy Settings'}
        //             </button>
        //             <div className="action-group" style={{ marginTop: '30px' }}>
        //                 <p className="section-description">
        //                     You can request a copy of all your data. This will include information associated with your account.
        //                 </p>
        //                 <button onClick={handleDownloadData} className="btn btn-tertiary">
        //                     Download Your Data
        //                 </button>
        //             </div>
        //         </div>
        //     ),
        //     className: "privacy-settings-section"
        // },
        // {
        //     title: "Account Management",
        //     description: "Actions that are irreversible and require careful consideration.",
        //     content: (
        //         <div className="profile-form">
        //             <div className="action-group action-group-border-top">
        //                 <h4 className="section-title" style={{ borderBottom: 'none', marginBottom: '10px' }}>Delete Account</h4>
        //                 <p className="section-description">
        //                     Permanently delete your account and all associated data. This action cannot be undone.
        //                 </p>
        //                 <button onClick={handleDeleteAccount} className="btn btn-danger" disabled={isSaving}>
        //                     {isSaving ? 'Deleting Account...' : 'Delete My Account'}
        //                 </button>
        //             </div>
        //         </div>
        //     ),
        //     className: "account-management-section"
        // }
    ];

    return (
        <div className="profile-page-wrapper">
            <div className="profile-container">
                <h2 className="page-title">Manage Your Profile</h2>
                <p className="page-intro">Update your personal information and account settings here.</p>

                {error && (
                    <div className="feedback-message error-message">
                        <p>Error!</p>
                        <p>{error}</p>
                    </div>
                )}
                {success && (
                    <div className="feedback-message success-message">
                        <p>{success}</p>
                    </div>
                )}

                {/* Reauthentication Modal */}
                {showReauthModal && (
                    <div className="reauth-modal-overlay">
                        <div className="reauth-modal-content">
                            <h3>Re-enter Password to Confirm</h3>
                            <p>For security, please confirm your password to proceed with this sensitive action ({reauthPurpose === 'email' ? 'email change' : 'account deletion'}).</p>
                            <input
                                type="password"
                                placeholder="Current Password"
                                value={reauthPassword}
                                onChange={(e) => setReauthPassword(e.target.value)}
                                className="form-input"
                                required
                                aria-label="Current Password for Reauthentication"
                            />
                            <div className="modal-actions">
                                <button onClick={() => { setShowReauthModal(false); setError(''); }} className="btn btn-secondary">Cancel</button>
                                <button onClick={handleReauthentication} className="btn btn-primary" disabled={isSaving}>
                                    {isSaving ? 'Confirming...' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {sections.map((section, index) => (
                    <div
                        key={index}
                        className={`profile-section ${section.className}`}
                        style={{ animationDelay: `${0.1 * index}s` }}
                    >
                        <h3 className="section-title">{section.title}</h3>
                        {section.description && <p className="section-description">{section.description}</p>}
                        {section.content}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ManageProfile;