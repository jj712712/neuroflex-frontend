import React from "react";
 import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
 import Navbar from "./components/Navbar";
 import Welcome from "./pages/Welcome";
 import Login from "./pages/login";
 import Signup from "./pages/Signup";
 import EEGConnection from "./pages/EEGConnection";
 import LiveEEG from "./pages/LiveEEG";
 import Performance from "./pages/Performance";
 import Profile from "./pages/Profile";
 import Contact from "./pages/Contact";
 import Services from "./pages/Services";
 import HowItWorks from "./pages/HowItWorks";
 import PrivateRoute from "./components/PrivateRoute";
 import SelfAssmnt from "./components/SelfAssmnt";
 import UserDashboard from "./components/UserDashboard";
 import TherapistDashboard from "./components/TherapistDashboard";
 import Onboarding from "./components/Onboarding";
 import TherapistSelection from "./components/TherapistSelection";
 import AuthRoute from "./components/AuthRoute"; // Ensure this component exists and is correctly implemented

 const App = () => {
  return (
   <Router>
    <Navbar />
    <Routes>
     {/* Public Routes */}
     <Route path="/" element={<Welcome />} />
     <Route path="/how-it-works" element={<HowItWorks />} />
     <Route path="/services" element={<Services />} /> {/* Assuming Services is also public */}
     <Route path="/contact" element={<Contact />} /> {/* Assuming Contact is also public */}

     {/* Authentication Routes (Redirect if logged in) */}
     <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
     <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />

     {/* Protected Routes (Require Login) */}
     <Route path="/eeg-connection" element={<PrivateRoute><EEGConnection /></PrivateRoute>} />
     <Route path="/live-eeg" element={<PrivateRoute><LiveEEG /></PrivateRoute>} />
     <Route path="/performance" element={<PrivateRoute><Performance /></PrivateRoute>} />
     <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
     <Route path="/self-assessment" element={<PrivateRoute><SelfAssmnt /></PrivateRoute>} />
     <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
     <Route path="/user-dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
     <Route path="/therapist-dashboard" element={<PrivateRoute><TherapistDashboard /></PrivateRoute>} />
     <Route path="/therapist-selection" element={<PrivateRoute><TherapistSelection /></PrivateRoute>} />
    </Routes>
   </Router>
  );
 };

 export default App;