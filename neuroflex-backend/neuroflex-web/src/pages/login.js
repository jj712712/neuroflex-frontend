import React, { useState } from "react";
import "../styles/login.css"; // Ensure this is correct
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  // Add other Firebase auth methods if needed (e.g., Google Sign-in)
} from "firebase/auth";
import { auth } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaGoogle } from "react-icons/fa"; // Consider more icons

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // No need to manually store userId in localStorage if not strictly needed
      // Firebase auth persists the user session.
      navigate("/dashboard"); // Redirect on successful login
    } catch (err) {
      // Improve error handling for better UX
      let errorMessage = "An error occurred during login.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Too many login attempts. Please try again later.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email to reset your password.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Check your inbox.");
    } catch (err) {
      setError("Failed to send reset email. Please try again.");
    }
  };

  // Add other auth methods (e.g., Google Sign-in)
  // const handleGoogleSignIn = async () => { ... };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <h2 className="login-form-title">Welcome Back!</h2> {/* More welcoming */}

        {error && <p className="login-form-error-message">{error}</p>}
        {message && <p className="login-form-success-message">{message}</p>}

        <form onSubmit={handleLogin}>
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

          <button
            type="submit"
            className="login-form-submit-button"
            disabled={loading}
          >
            {loading ? "Logging In..." : "Log In"}
          </button>
        </form>

        <button
          className="login-social-button"
          // onClick={handleGoogleSignIn} // Implement this
          type="button" // Important for buttons outside a form!
        >
          <FaGoogle className="login-social-icon" />
          Continue with Google
        </button>

        <button
  type="button"
  onClick={handleForgotPassword}
  className="login-form-forgot-password"
>
  Forgot Password?
</button>

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