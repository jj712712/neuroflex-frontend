// src/components/UserDashboard.js
import React from 'react';
import './UserDashboard.css'; // Import the updated CSS
import { Link } from 'react-router-dom'; // Import the Link component

const UserDashboard = () => {
  // const user = {
  //   name: localStorage.getItem('displayName') || 'User',
  //   profilePic: '/images/default_user.png', // Replace with actual path or user's profile pic URL
  // };

  return (
    <div className="user-dashboard-container">
      <header className="dashboard-header">
        <div className="user-info">
          {/* <img src={user.profilePic} alt="Profile" className="profile-pic" /> */}
          {/* <span className="user-name">{user.name}</span> */}
        </div>
        {/* You could add more header elements here if needed */}
      </header>
      <div className="dashboard-content">
        <h1>Patient    Dashboard</h1>
        <p className="welcome-message">Welcome to your personalized NeuroFlex experience!</p>
        <div className="dashboard-actions">
          <Link to="/self-assessment" className="dashboard-button primary">
            Take Initial Assessment
          </Link>
          <Link to="/find-therapist" className="dashboard-button secondary">
      Find a Therapist
    </Link>
          <Link to="/session-history" className="dashboard-button tertiary">
            View Session History
          </Link>
          <Link to="/manage-profile" className="dashboard-button info">
            Manage Profile
          </Link>
          {/* Add other action buttons as Link components */}
          <Link to="/start-new-session" className="dashboard-button success">
            Start New Session
          </Link>
          <button className="dashboard-button warning" onClick={() => console.log('View Progress Reports clicked')}>
            View Progress Reports
          </button>
        </div>
      </div>
      
    </div>
  );
};

export default UserDashboard;