// src/components/SessionDetail.js
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const SessionDetail = () => {
  const { id } = useParams(); // Get the session ID from the URL
  const navigate = useNavigate();

  // In a real application, you would fetch the specific session data here
  // using the 'id' from Firebase. For now, it's a placeholder.

  return (
    <div className="session-detail-container">
      <h1>Session Details</h1>
      <p>Displaying details for Session ID: **{id}**</p>
      <p>This page will fetch and show all stored data for this specific session,
         including full AI summary, detailed metrics, etc.</p>
      {/* Add your detailed session display logic here */}
      <button onClick={() => navigate('/session-history')}>
        Back to Session History
      </button>
    </div>
  );
};

export default SessionDetail;