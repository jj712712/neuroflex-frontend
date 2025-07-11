// App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Welcome from "./pages/Welcome";
import Login from "./pages/login";
import Signup from "./pages/Signup";
import EEGConnection from "./pages/EEGConnection";
import LiveEEG from "./pages/LiveEEG";
import Performance from "./pages/Performance";
// import Profile from "./pages/Profile"; // <<< REMOVE or rename this if it's the old one
import Contact from "./pages/Contact";
import Services from "./pages/Services";
import HowItWorks from "./pages/HowItWorks";
import PrivateRoute from "./components/PrivateRoute";
import SelfAssmnt from "./components/SelfAssmnt";
import UserDashboard from "./components/UserDashboard";
import TherapistDashboard from "./components/TherapistDashboard";
import TherapistManageProfile from './pages/TherapistManageProfile';
import Onboarding from "./components/Onboarding";
import TherapistSelection from "./components/TherapistSelection";
import AuthRoute from "./components/AuthRoute";
import Footer from './components/Footer';
import FindTherapist from './components/FindTherapist';
import ManageProfile from './components/ManageProfile'; // This is for editing
import ViewProfilePage from './pages/ViewProfilePage'; // NEW: This is for viewing patient details
import StartNewSession from './components/StartNewSession';
import TherapistPatientsList from './components/TherapistPatientsList';
import './App.css';

const App = () => {
  return (
    <Router>
      <Navbar />
      <div className="content-wrapper"> {/* Optional: For applying layout styles */}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Welcome />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />

          {/* Authentication Routes (Redirect if logged in) */}
          <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
          <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />

          {/* Protected Routes (Require Login) */}
          <Route path="/eeg-connection" element={<PrivateRoute><EEGConnection /></PrivateRoute>} />
          <Route path="/live-eeg" element={<PrivateRoute><LiveEEG /></PrivateRoute>} />
          <Route path="/performance" element={<PrivateRoute><Performance /></PrivateRoute>} />

          {/* NEW: Route for viewing patient details (read-only) */}
          <Route path="/profile" element={<PrivateRoute><ViewProfilePage /></PrivateRoute>} />

          <Route path="/self-assessment" element={<PrivateRoute><SelfAssmnt /></PrivateRoute>} />
          <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
          <Route path="/user-dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
          <Route path="/therapist-dashboard" element={<PrivateRoute><TherapistDashboard /></PrivateRoute>} />
          <Route path="/therapist-selection" element={<PrivateRoute><TherapistSelection /></PrivateRoute>} />
          <Route path="/find-therapist" element={<PrivateRoute><FindTherapist /></PrivateRoute>} />
          <Route path="/therapist/profile/manage" element={<TherapistManageProfile />} />
          <Route path="/therapist/patients" element={<TherapistPatientsList />} /> 

          {/* Existing: Route for managing/editing profile */}
          <Route path="/manage-profile" element={<PrivateRoute><ManageProfile /></PrivateRoute>} />

          <Route path="/start-new-session" element={<PrivateRoute><StartNewSession /></PrivateRoute>} />
        </Routes>
      </div>
      <Footer /> {/* Footer component placed outside of Routes */}
    </Router>
  );
};

export default App;