// src/components/SessionHistory.js
import React, { useEffect, useState } from 'react';
import { useFirebase } from '../contexts/FirebaseContext'; // Import Firebase context
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom'; // For navigation
import './SessionHistory.css'; // Create this CSS file next

const SessionHistory = () => {
  const { db, currentUserId, isFirebaseReady } = useFirebase();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessions = async () => {
      if (!isFirebaseReady || !currentUserId) {
        setLoading(false);
        // If Firebase isn't ready or no user, it's not an error, just waiting
        if (!currentUserId && isFirebaseReady) {
            setError("Please log in to view your session history.");
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const q = query(
          collection(db, 'eegSessions'),
          where('userId', '==', currentUserId),
          orderBy('timestamp', 'desc') // Order by most recent sessions first
        );
        const querySnapshot = await getDocs(q);
        const fetchedSessions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSessions(fetchedSessions);
      } catch (err) {
        console.error("Error fetching sessions:", err);
        setError("Failed to load session history. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [isFirebaseReady, currentUserId, db]); // Dependencies for useEffect

  if (loading) {
    return (
      <div className="session-history-container">
        <p>Loading session history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="session-history-container error">
        <p>{error}</p>
        <p>Ensure you are logged in and have an internet connection.</p>
      </div>
    );
  }

  return (
    <div className="session-history-container">
      <header className="session-history-header">
        <h1>Your Session History</h1>
      </header>
      <div className="session-list">
        {sessions.length === 0 ? (
          <p className="no-sessions-message">No sessions recorded yet. Start a new session!</p>
        ) : (
          sessions.map(session => (
            <div key={session.id} className="session-card" onClick={() => navigate(`/session-details/${session.id}`)}>
              <h2>Session on {new Date(session.timestamp.toDate()).toLocaleDateString()}</h2>
              <p>Duration: {Math.round(session.durationMinutes || 0)} minutes</p>
              <p>Overall Sentiment: {session.sentimentScore !== undefined ? session.sentimentScore.toFixed(2) : 'N/A'}</p>
              <p className="summary-preview">{session.aiSummary || 'No summary available.'}</p>
              {/* Add more session details as needed */}
            </div>
          ))
        )}
      </div>
      <button className="back-to-dashboard-button" onClick={() => navigate('/user-dashboard')}>
        Back to Dashboard
      </button>
    </div>
  );
};

export default SessionHistory;