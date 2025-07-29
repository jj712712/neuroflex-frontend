// src/components/TherapistDashboard.js
import React from 'react';
import { Link } from 'react-router-dom';
import './TherapistDashboard.css';

const TherapistDashboard = () => {
  const therapist = {
    // These are commented out as they are examples; actual data should come from state/props
    // name: localStorage.getItem('displayName') || 'Therapist',
    // profilePic: '/images/default_therapist.png',
    // specialization: localStorage.getItem('specialization') || 'Specialist',
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <h3>Therapist Dashboard</h3>
        <p>This is your therapist portal. You can manage your patients and sessions here:</p>
        <ul>
          {/* I. Patient Management & Interaction */}
          <li>
            <Link to="/therapist/patients">View Patients List</Link>
            {/* Function: Leads to a list of all patients assigned to or managed by the therapist.
                From here, therapists can view individual patient profiles and their session history. */}
          </li>
          <li>
            <Link to="/#">Manage Sessions</Link>
            {/* Function: For managing upcoming video or audio calls. The "Start Session" button might appear dynamically for scheduled sessions. */}
          </li>
          <li>
            <Link to="/#">New Message</Link>
            {/* Function: Allows the therapist to initiate a new message to a specific patient or a group. */}
          </li>

          {/* II. Scheduling & Availability */}
          <li>
            <Link to="/#">View Schedule</Link>
            {/* Function: Displays their daily, weekly, or monthly appointments. */}
          </li>
          <li>
            {/* Updated Link: The "Patient Session" button now leads to the TherapistPatientsList
                This is a more intuitive flow, as therapists will select a specific patient
                from the list to view their detailed session history. */}
            <Link to="/therapist/patients">Patient Session History</Link>
          </li>

          {/* III. Profile & Practice Management */}
          <li>
            <Link to="/therapist/profile/manage">Manage Profile</Link>
            {/* Function: Allows updating their bio, specializations, qualifications, profile picture, languages, etc., which are visible to potential patients. */}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TherapistDashboard;
