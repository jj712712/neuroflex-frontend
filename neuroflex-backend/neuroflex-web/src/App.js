import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Welcome from "./pages/Welcome";
import Login from "./pages/login";
import Signup from "./pages/Signup";
import EEGConnection from "./pages/EEGConnection";
import LiveEEG from "./pages/LiveEEG";
import Performance from "./pages/Performance";
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
import ManageProfile from './components/ManageProfile';
import ViewProfilePage from './pages/ViewProfilePage';
import StartNewSession from './components/StartNewSession';
import TherapistPatientsList from './components/TherapistPatientsList';
import TherapistProfileView from './pages/TherapistProfileView';
import SessionHistory from './components/SessionHistory';
import SessionDetail from './components/SessionDetail';
import MyBookings from './pages/MyBookings'; // Ensure this import is present
import PatientSessionDetails from './components/PatientSessionDetails'; // Import the new component
import TherapistSessionOverview from './components/TherapistSessionOverview'; // Import the new component


import './App.css';

const App = () => {
  return (
    <Router>
      {/* Navbar and Footer are outside the content-wrapper and Routes, which is fine for consistent layout */}
      <Navbar />
      <div className="content-wrapper"> {/* Optional: For applying layout styles */}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Welcome />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />

          {/* Authentication Routes (Redirect if logged in) */}
          {/* These routes use AuthRoute to redirect authenticated users away from login/signup */}
          <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
          <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />

          {/* Protected Routes (Require Login) - These routes require any authenticated user */}
          <Route path="/eeg-connection" element={<PrivateRoute><EEGConnection /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ViewProfilePage /></PrivateRoute>} />
          <Route path="/self-assessment" element={<PrivateRoute><SelfAssmnt /></PrivateRoute>} />
          <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
          <Route path="/therapist-selection" element={<PrivateRoute><TherapistSelection /></PrivateRoute>} />
          <Route path="/find-therapist" element={<PrivateRoute><FindTherapist /></PrivateRoute>} />
          <Route path="/manage-profile" element={<PrivateRoute><ManageProfile /></PrivateRoute>} />
          <Route path="/start-new-session" element={<PrivateRoute><StartNewSession /></PrivateRoute>} />
          <Route path="/therapist-profile/:therapistId" element={<PrivateRoute><TherapistProfileView /></PrivateRoute>} />
          <Route path="/my-bookings" element={<PrivateRoute><MyBookings /></PrivateRoute>} /> {/* NEW: My Bookings Page */}

          {/* NEW: Session History and Session Details Routes */}
          <Route path="/session-history" element={<PrivateRoute><SessionHistory /></PrivateRoute>} />
          <Route path="/session-details/:id" element={<PrivateRoute><SessionDetail /></PrivateRoute>} />

          {/* Role-Specific Protected Routes - These routes require a specific role (e.g., 'patient' or 'therapist') */}
          <Route path="/user-dashboard" element={<PrivateRoute requiredRole="patient"><UserDashboard /></PrivateRoute>} />
          <Route path="/therapist-dashboard" element={<PrivateRoute requiredRole="therapist"><TherapistDashboard /></PrivateRoute>} />
          <Route path="/therapist/profile/manage" element={<PrivateRoute requiredRole="therapist"><TherapistManageProfile /></PrivateRoute>} />
          <Route path="/therapist/patients" element={<PrivateRoute requiredRole="therapist"><TherapistPatientsList /></PrivateRoute>} />
          <Route path="/therapist/patient-session-details/:patientId" element={<PrivateRoute requiredRole="therapist"><PatientSessionDetails /></PrivateRoute>} />
          <Route path="/therapist/session-overview" element={<PrivateRoute requiredRole="therapist"><TherapistSessionOverview /></PrivateRoute>} />


        </Routes>
      </div>
      <Footer /> {/* Footer component placed outside of Routes */}
    </Router>
  );
};

export default App;