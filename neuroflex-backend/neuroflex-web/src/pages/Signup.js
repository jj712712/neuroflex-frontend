// Signup.jsx (Modified)
import React, { useState } from "react";
import "../styles/signup.css";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaUserCog, FaPhone, FaCalendarAlt, FaVenusMars, FaMapMarkerAlt } from "react-icons/fa"; // New icons

const Signup = () => {
    const [role, setRole] = useState("");
    const [patientName, setPatientName] = useState("");
    const [therapistName, setTherapistName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [specialization, setSpecialization] = useState("");
    const [license, setLicense] = useState("");

    // *** NEW STATE VARIABLES FOR ADDITIONAL PROFILE DATA ***
    const [phoneNumber, setPhoneNumber] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [gender, setGender] = useState("");
    const [address, setAddress] = useState("");
    // Default notification/privacy settings (can be set during signup or managed later)
    const [receiveEmailNotifications, setReceiveEmailNotifications] = useState(true);
    const [productUpdatesNewsletters, setProductUpdatesNewsletters] = useState(true);
    const [allowDataSharing, setAllowDataSharing] = useState(false);


    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handlePatientSignup = async (e) => {
        e.preventDefault();
        handleFirebaseSignup("patient", patientName);
    };

    const handleTherapistSignup = async (e) => {
        e.preventDefault();
        handleFirebaseSignup("therapist", therapistName, specialization, license);
    };

    const handleFirebaseSignup = async (role, name, specialization = "", license = "") => {
        setError("");
        setLoading(true);

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, {
                displayName: name,
            });

            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, {
                role: role,
                name: name, // Storing name again in Firestore for easier querying if needed
                email: email, // Storing email in Firestore
                phoneNumber: phoneNumber, // *** ADDED ***
                dateOfBirth: dateOfBirth, // *** ADDED ***
                gender: gender, // *** ADDED ***
                address: address, // *** ADDED ***
                receiveEmailNotifications: receiveEmailNotifications, // *** ADDED default/signup preference ***
                productUpdatesNewsletters: productUpdatesNewsletters, // *** ADDED default/signup preference ***
                allowDataSharing: allowDataSharing, // *** ADDED default/signup preference ***
                ...(role === 'therapist' && { specialization: specialization, license: license }),
                createdAt: new Date(), // Add a timestamp
            });

            localStorage.setItem('authToken', user.accessToken);
            localStorage.setItem('userRole', role);
            localStorage.setItem('displayName', name);
            if (role === 'therapist') {
                localStorage.setItem('specialization', specialization);
            }

            navigate(role === "therapist" ? "/therapist-dashboard" : "/user-dashboard");
        } catch (err) {
            let errorMessage = "Failed to create an account. Please try again.";
            if (err.code === "auth/email-already-in-use") {
                errorMessage = "This email address is already in use.";
            } else if (err.code === "auth/invalid-email") {
                errorMessage = "Invalid email address.";
            } else if (err.code === "auth/weak-password") {
                errorMessage = "Password should be at least 6 characters.";
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const switchRole = (event) => {
        event.preventDefault();
        setRole(role === "patient" ? "therapist" : "patient");
        setPatientName("");
        setTherapistName("");
        setEmail(""); // Clear email, password, etc., on role switch for fresh input
        setPassword("");
        setConfirmPassword("");
        setSpecialization("");
        setLicense("");
        setPhoneNumber(""); // Clear additional fields too
        setDateOfBirth("");
        setGender("");
        setAddress("");
        setError("");
    };

    return (
        <div className="signup-container">
            <div className="signup-form-container">
                <h2 className="signup-form-title">Create Account</h2>
                {error && <p className="signup-form-error-message">{error}</p>}

                {!role && (
                    <div className="role-selection">
                        <h3>I am signing up as a:</h3>
                        <button
                            type="button"
                            className="role-button patient-button"
                            onClick={() => setRole("patient")}
                        >
                            <FaUser className="role-icon" /> Patient
                        </button>
                        <button
                            type="button"
                            className="role-button therapist-button"
                            onClick={() => setRole("therapist")}
                        >
                            <FaUserCog className="role-icon" /> Therapist
                        </button>
                    </div>
                )}

                {role && ( // Render form if a role is selected
                    <form onSubmit={role === "patient" ? handlePatientSignup : handleTherapistSignup}>
                        <h3 className="signup-form-subtitle">
                            {role === "patient" ? "Patient Information" : "Therapist Information"}
                        </h3>
                        <div className="signup-form-group">
                            <label htmlFor="name" className="signup-form-label">
                                Name
                            </label>
                            <div className="signup-form-input-wrapper">
                                <FaUser className="signup-form-input-icon" />
                                <input
                                    type="text"
                                    id="name"
                                    className="signup-form-input"
                                    placeholder="Your Name"
                                    value={role === "patient" ? patientName : therapistName}
                                    onChange={(e) => role === "patient" ? setPatientName(e.target.value) : setTherapistName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Common fields for both roles (Email and Password) */}
                        <div className="signup-form-group">
                            <label htmlFor="email" className="signup-form-label">
                                Email
                            </label>
                            <div className="signup-form-input-wrapper">
                                <FaUser className="signup-form-input-icon" />
                                <input
                                    type="email"
                                    id="email"
                                    className="signup-form-input"
                                    placeholder="Your Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="signup-form-group">
                            <label htmlFor="password" className="signup-form-label">
                                Password
                            </label>
                            <div className="signup-form-input-wrapper">
                                <FaLock className="signup-form-input-icon" />
                                <input
                                    type="password"
                                    id="password"
                                    className="signup-form-input"
                                    placeholder="Password (min 6 characters)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="signup-form-group">
                            <label htmlFor="confirmPassword" className="signup-form-label">
                                Confirm Password
                            </label>
                            <div className="signup-form-input-wrapper">
                                <FaLock className="signup-form-input-icon" />
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    className="signup-form-input"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* *** NEW: Additional personal fields for all users (can be conditional if only for patients/therapists) *** */}
                        <div className="signup-form-group">
                            <label htmlFor="phoneNumber" className="signup-form-label">
                                Phone Number
                            </label>
                            <div className="signup-form-input-wrapper">
                                <FaPhone className="signup-form-input-icon" />
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    className="signup-form-input"
                                    placeholder="e.g., +1234567890"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="signup-form-group">
                            <label htmlFor="dateOfBirth" className="signup-form-label">
                                Date of Birth
                            </label>
                            <div className="signup-form-input-wrapper">
                                <FaCalendarAlt className="signup-form-input-icon" />
                                <input
                                    type="date"
                                    id="dateOfBirth"
                                    className="signup-form-input"
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="signup-form-group">
                            <label htmlFor="gender" className="signup-form-label">
                                Gender
                            </label>
                            <div className="signup-form-input-wrapper">
                                <FaVenusMars className="signup-form-input-icon" />
                                <select
                                    id="gender"
                                    className="signup-form-input"
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                >
                                    <option value="">Select...</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="non-binary">Non-binary</option>
                                    <option value="prefer-not-to-say">Prefer not to say</option>
                                </select>
                            </div>
                        </div>

                        <div className="signup-form-group">
                            <label htmlFor="address" className="signup-form-label">
                                Address
                            </label>
                            <div className="signup-form-input-wrapper">
                                <FaMapMarkerAlt className="signup-form-input-icon" />
                                <textarea
                                    id="address"
                                    className="signup-form-input"
                                    placeholder="Your Full Address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    rows="3"
                                ></textarea>
                            </div>
                        </div>
                        {/* END NEW ADDITIONAL PERSONAL FIELDS */}


                        {role === "therapist" && (
                            <>
                                <h3 className="signup-form-subtitle">Therapist Details</h3>
                                <div className="signup-form-group">
                                    <label htmlFor="specialization" className="signup-form-label">
                                        Specialization
                                    </label>
                                    <div className="signup-form-input-wrapper">
                                        <FaUserCog className="signup-form-input-icon" />
                                        <input
                                            type="text"
                                            id="specialization"
                                            className="signup-form-input"
                                            placeholder="e.g., Cognitive Behavioral Therapy"
                                            value={specialization}
                                            onChange={(e) => setSpecialization(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="signup-form-group">
                                    <label htmlFor="license" className="signup-form-label">
                                        License Number
                                    </label>
                                    <div className="signup-form-input-wrapper">
                                        <FaLock className="signup-form-input-icon" />
                                        <input
                                            type="text"
                                            id="license"
                                            className="signup-form-input"
                                            placeholder="Your Professional License Number"
                                            value={license}
                                            onChange={(e) => setLicense(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            className="signup-form-button"
                            disabled={loading}
                        >
                            {loading ? "Signing Up..." : "Sign Up"}
                        </button>
                        <p className="signup-form-footer">
                            Already have an account? <Link to="/login">Log In</Link>
                        </p>
                        <button
                            type="button"
                            className="switch-role-button"
                            onClick={switchRole}
                        >
                            Switch to {role === "patient" ? "Therapist" : "Patient"} Signup
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Signup;