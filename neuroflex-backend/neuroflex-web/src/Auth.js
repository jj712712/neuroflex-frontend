import { auth } from "./firebaseConfig";
 import { signInWithEmailAndPassword } from "firebase/auth";
 import { useState } from "react";
 import { useNavigate, Link } from "react-router-dom"; // Import Link here

 export const logout = async (navigate) => { // Export the logout function
  try {
   await auth.signOut();
   localStorage.removeItem('authToken');
   localStorage.removeItem('userRole');
   localStorage.removeItem('displayName');
   localStorage.removeItem('specialization');
   navigate('/login');
  } catch (error) {
   console.error("Error signing out:", error);
   // Optionally display an error message to the user
  }
 };

 function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(""); // State for error messages
  const navigate = useNavigate(); // Get the navigate function

  const handleLogin = async () => {
   setLoginError(""); // Clear any previous errors
   try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // After successful login, you might want to:
    // 1. Store user information in local storage (if needed)
    // 2. Redirect the user to a specific page (e.g., dashboard)

    // Example of storing user ID in local storage:
    localStorage.setItem('userId', user.uid);

    // Example of redirecting based on user role (you'll need to fetch this from Firestore or have it stored)
    const userRole = localStorage.getItem('userRole'); // Replace with your actual role retrieval logic
    if (userRole === 'therapist') {
     navigate("/therapist-dashboard");
    } else {
     navigate("/user-dashboard");
    }

    console.log("Login successful:", user); // Optional: Log user info
   } catch (error) {
    console.error("Login error:", error.message);
    setLoginError(error.message); // Display the error message to the user
   }
  };

  return (
   <div>
    <h2>Login</h2>
    {loginError && <p style={{ color: 'red' }}>{loginError}</p>} {/* Display login error */}
    <input
     type="email"
     value={email}
     onChange={(e) => setEmail(e.target.value)}
     placeholder="Email"
    />
    <input
     type="password"
     value={password}
     onChange={(e) => setPassword(e.target.value)}
     placeholder="Password"
    />
    <button onClick={handleLogin} disabled={!email || !password}>Login</button> {/* Disable button if fields are empty */}
    <p>
     Don't have an account? <Link to="/signup">Sign Up</Link> {/* Add a link to the signup page */}
    </p>
   </div>
  );
 }

 export default Auth;