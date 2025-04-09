// src/components/TherapistDashboard.js
import React from 'react';
import './Dashboard.css'; // Or TherapistDashboard.css

const TherapistDashboard = () => {
  // Assuming you have therapist data fetched after login
  const therapist = {
    name: localStorage.getItem('displayName') || 'Therapist', // Example
    profilePic: '/images/default_therapist.png', // Default image
    specialization: localStorage.getItem('specialization') || 'Specialist', // Example
  };

  return (
    <div className="dashboard-container">
      <div className="profile-header">
        <img src={therapist.profilePic} alt="Profile" className="profile-pic" />
        <h1>Welcome, Dr. {therapist.name}!</h1>
        <p>Specialization: {therapist.specialization}</p>
      </div>
      <div className="dashboard-content">
        <h3>Therapist Dashboard</h3>
        <p>This is your therapist portal. You can manage your patients and sessions here:</p>
        <ul>
          <li><a href="/#">View Patient List</a></li>
          <li><a href="/#">Manage Sessions</a></li>
          <li><a href="/#">Review Reports</a></li>
          {/* Add other therapist-specific links */}
          <li><a href="/#">Manage Availability</a></li>
          <li><a href="/#">Edit Profile</a></li>
        </ul>
      </div>
    </div>
  );
};

export default TherapistDashboard;