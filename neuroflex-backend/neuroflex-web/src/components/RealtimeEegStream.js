import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../authContext';
import './RealtimeEegStream.css'; // Import CSS

const RealtimeEegStream = ({ sessionId }) => {
  const [eegData, setEegData] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser || !sessionId) return;

    const interval = setInterval(() => {
      // Simulate receiving EEG data (replace with actual device data)
      const newData = Array.from({ length: 8 }, () => Math.random());

      // Send data to Firestore with timestamp as document ID
      const liveEegDocRef = doc(db, 'sessions', sessionId, 'liveEegData', `${Date.now()}`);
      setDoc(liveEegDocRef, {
        timestamp: serverTimestamp(),
        channels: newData,
        userId: currentUser.uid,
      }).catch(error => console.error("Error sending EEG data: ", error));

      setEegData(prevData => [...prevData, { timestamp: Date.now(), channels: newData }]);

    }, 100);

    return () => clearInterval(interval);
  }, [sessionId, currentUser]);

  return (
    <div className="realtime-eeg-container">
      <h2>Real-time EEG Data (Simulated)</h2>
      <div className="eeg-display">
        {eegData.slice(-10).map((item, index) => (
          <div key={index} className="eeg-data-item">
            <span className="timestamp">{new Date(item.timestamp).toLocaleTimeString()}</span>
            <pre className="channels">{JSON.stringify(item.channels, null, 2)}</pre>
          </div>
        ))}
      </div>
      {/* In a real app, you'd visualize this data */}
    </div>
  );
};

export default RealtimeEegStream;