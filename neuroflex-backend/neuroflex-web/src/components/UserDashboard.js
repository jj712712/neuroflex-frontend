// src/components/UserDashboard.js
import React from 'react';
import './Dashboard.css'; // You can have a common or separate CSS

const UserDashboard = () => {
  // Assuming you have user data fetched after login (e.g., from local storage or context)
  const user = {
    name: localStorage.getItem('displayName') || 'User', // Example: get name from local storage
    profilePic: '/images/default_user.png', // Default image
  };

  return (
    <div className="dashboard-container">
      <div className="profile-header">
        <img src={user.profilePic} alt="Profile" className="profile-pic" />
        <h1>Welcome, {user.name}!</h1>
      </div>
      <div className="dashboard-content">
        <h3>User Dashboard</h3>
        <p>This is your personalized dashboard. You can access various features here:</p>
        <ul>
          <li><a href="/self-assessment">Take Initial Assessment</a></li>
          <li><a href="/therapist-selection">Find a Therapist</a></li>
          {/* Add other user-specific links */}
          <li><a href="/#">View Session History</a></li>
          <li><a href="/#">Manage Profile</a></li>
        </ul>
      </div>
    </div>
  );
};

export default UserDashboard;