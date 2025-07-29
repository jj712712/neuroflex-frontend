// src/pages/Login.js
import React, { useState } from "react";
import "../styles/login.css";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { auth, db } from "../firebaseConfig"; // Import db (Firestore)
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaGoogle } from "react-icons/fa";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotPasswordActive, setForgotPasswordActive] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Logged in user UID:", user.uid);

      // --- Determine user role from Firestore and redirect ---
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const userRole = userData.role; // Get the role stored during signup

        if (userRole === "therapist") {
          console.log("User is a therapist. Redirecting to /therapist-dashboard.");
          navigate("/therapist-dashboard");
        } else if (userRole === "patient") {
          console.log("User is a patient. Redirecting to /user-dashboard.");
          navigate("/user-dashboard");
        } else {
          // Fallback for unexpected or missing role
          setError("User role not defined. Please contact support.");
          await auth.signOut(); // Sign out if role is ambiguous
        }
      } else {
        // This case should ideally not happen if signup always creates a 'users' document
        setError("User profile data not found in Firestore. Please contact support.");
        await auth.signOut(); // Sign out if no profile document exists
      }
      // ---------------------------------------------------

    } catch (err) {
      let errorMessage = "An error occurred during login.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Too many login attempts. Please try again later.";
      } else if (err.code === "auth/user-disabled") {
        errorMessage = "Your account has been disabled. Please contact support.";
      }
      setError(errorMessage);
      console.error("Login error:", err.code, err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setForgotPasswordActive(true);
    if (!email) {
      setError("Please enter your email to reset your password.");
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Check your inbox.");
      setError("");
    } catch (err) {
      let errorMessage = "Failed to send reset email. Please try again.";
      if (err.code === "auth/user-not-found") {
        errorMessage = "No user found with that email address.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      }
      setError(errorMessage);
      setMessage("");
      console.error("Password reset error:", err.code, err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitButtonText = forgotPasswordActive ? "Send Reset Email" : (loading ? "Logging In..." : "Log In");
  const submitButtonAction = forgotPasswordActive ? handleForgotPassword : handleLogin;

  return (
    <div className={`login-container ${forgotPasswordActive ? 'forgot-password-active' : ''}`}>
      <div className="login-form-container">
        <h2 className="login-form-title">Welcome Back!</h2>

        {error && <p className="login-form-error-message">{error}</p>}
        {message && <p className="login-form-success-message">{message}</p>}

        <form onSubmit={submitButtonAction}>
          <div className="login-form-group">
            <label htmlFor="email" className="login-form-label">
              Email
            </label>
            <div className="login-form-input-wrapper">
              <FaUser className="login-form-input-icon" />
              <input
                type="email"
                id="email"
                className="login-form-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {!forgotPasswordActive && (
            <div className="login-form-group">
              <label htmlFor="password" className="login-form-label">
                Password
              </label>
              <div className="login-form-input-wrapper">
                <FaLock className="login-form-input-icon" />
                <input
                  type="password"
                  id="password"
                  className="login-form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="login-form-submit-button"
            disabled={loading}
          >
            {submitButtonText}
          </button>
        </form>

        {!forgotPasswordActive && (
          <>
            <button
              className="login-social-button"
              type="button"
            >
              <FaGoogle className="login-social-icon" />
              Continue with Google
            </button>

            <div className="login-form-forgot-password-container">
              <button
                type="button"
                onClick={() => {
                  setForgotPasswordActive(true);
                  setError('');
                  setMessage('');
                }}
                className="login-form-forgot-password"
              >
                Forgot Password?
              </button>
            </div>
          </>
        )}

        {forgotPasswordActive && (
          <div className="login-form-back-to-login">
            <button
              type="button"
              onClick={() => {
                setForgotPasswordActive(false);
                setError('');
                setMessage('');
                setPassword('');
              }}
              className="login-form-forgot-password"
            >
              Back to Login
            </button>
          </div>
        )}

        <div className="login-separator">Or</div>

        <p className="login-signup-link">
          Don't have an account?{" "}
          <Link to="/signup" className="login-signup-link-a">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;