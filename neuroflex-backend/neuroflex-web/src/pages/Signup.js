import React, { useState } from "react";
import "../styles/signup.css";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase"; // Import your Firebase auth and db instances
import { doc, setDoc } from "firebase/firestore"; // For storing user data in Firestore
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaUserCog } from "react-icons/fa"; // Import a therapist icon

const Signup = () => {
  const [role, setRole] = useState(""); // 'patient' or 'therapist'
  const [patientName, setPatientName] = useState("");
  const [therapistName, setTherapistName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [specialization, setSpecialization] = useState(""); // For therapists
  const [license, setLicense] = useState(""); // For therapists
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

      // Update user's display name in Firebase Auth
      await updateProfile(user, {
        displayName: name,
      });

      // Store additional user information (role, name, etc.) in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        role: role,
        name: name,
        email: email,
        ...(role === 'therapist' && { specialization: specialization, license: license }), // Conditionally add therapist fields
      });

      localStorage.setItem('authToken', user.accessToken); // Store auth token (optional, but good practice)
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
              <FaUser className="role-icon" /> Patient/User
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

        {role === "patient" && (
          <form onSubmit={handlePatientSignup}>
            <h3 className="signup-form-subtitle">Patient Information</h3>
            <div className="signup-form-group">
              <label htmlFor="patientName" className="signup-form-label">
                Name
              </label>
              <div className="signup-form-input-wrapper">
                <FaUser className="signup-form-input-icon" />
                <input
                  type="text"
                  id="patientName"
                  className="signup-form-input"
                  placeholder="Your Name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                />
              </div>
            </div>
            {/* Email and Password fields (common for both roles) */}
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
                  placeholder="Enter your email"
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
                  placeholder="Enter your password"
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
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="signup-form-submit-button"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Sign Up as Patient"}
            </button>
          </form>
        )}

        {role === "therapist" && (
          <form onSubmit={handleTherapistSignup}>
            <h3 className="signup-form-subtitle">Therapist Information</h3>
            <div className="signup-form-group">
              <label htmlFor="therapistName" className="signup-form-label">
                Name
              </label>
              <div className="signup-form-input-wrapper">
                <FaUser className="signup-form-input-icon" />
                <input
                  type="text"
                  id="therapistName"
                  className="signup-form-input"
                  placeholder="Your Name"
                  value={therapistName}
                  onChange={(e) => setTherapistName(e.target.value)}
                  required
                />
              </div>
            </div>
            {/* Email and Password fields (common for both roles) */}
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
                  placeholder="Enter your email"
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
                  placeholder="Enter your password"
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
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
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
                  placeholder="Your Specialization"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="signup-form-group">
              <label htmlFor="license" className="signup-form-label">
                License Number (Optional)
              </label>
              <div className="signup-form-input-wrapper">
                <FaUserCog className="signup-form-input-icon" />
                <input
                  type="text"
                  id="license"
                  className="signup-form-input"
                  placeholder="Your License Number"
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              className="signup-form-submit-button"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Sign Up as Therapist"}
            </button>
          </form>
        )}

        <p className="signup-form-login-link">
          Already have an account?{" "}
          <Link to="/login" className="signup-form-login-link-a">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;