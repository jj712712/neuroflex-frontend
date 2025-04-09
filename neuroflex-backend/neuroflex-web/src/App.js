
import React from "react";
 import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
 import { auth } from './firebase';
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
 import PrivateRoute from "./components/PrivateRoute"; // Ensure this points to the new PrivateRoute
 import SelfAssmnt from "./components/SelfAssmnt";
 import UserDashboard from "./components/UserDashboard";
 import TherapistDashboard from "./components/TherapistDashboard";
 import Onboarding from "./components/Onboarding";
 import TherapistSelection from "./components/TherapistSelection";

 const App = () => { 
  const isAuthenticated = () => !!localStorage.getItem('authToken');
   const getUserRole = () => localStorage.getItem('userRole');

   const AuthRoute = ({ element }) => {
    if (!auth.currentUser) {
      return element;
    } else {
      const userRole = localStorage.getItem('userRole');
      if (userRole === 'therapist') {
        return <Navigate to="/therapist-dashboard" replace />;
      } else {
        return <Navigate to="/user-dashboard" replace />;
      }
    }
  };

   return (
     <Router>
       <Navbar />
       <Routes>
         <Route path="/" element={<Welcome />} />
         <Route path="/signup" element={<AuthRoute element={<Signup />} />} />
         <Route path="/login" element={<AuthRoute element={<Login />} />} />
         <Route path="/eeg-connection" element={<PrivateRoute><EEGConnection /></PrivateRoute>} />
         <Route path="/live-eeg" element={<PrivateRoute><LiveEEG /></PrivateRoute>} />
         <Route path="/performance" element={<PrivateRoute><Performance /></PrivateRoute>} />
         <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
         <Route path="/services" element={<PrivateRoute><Services /></PrivateRoute>} />
         <Route path="/contact" element={<PrivateRoute><Contact /></PrivateRoute>} />
         <Route path="/how-it-works" element={<PrivateRoute><HowItWorks /></PrivateRoute>} />
         <Route path="/self-assessment" element={<PrivateRoute><SelfAssmnt /></PrivateRoute>} />
         <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
         <Route path="/user-dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
         <Route path="/therapist-dashboard" element={<PrivateRoute><TherapistDashboard /></PrivateRoute>} />
         <Route path="/therapist-selection" element={<PrivateRoute><TherapistSelection /></PrivateRoute>} />
         <Route path="/" element={<Navigate to="/login" />} />
       </Routes>
     </Router>
   );
 };

 export default App;