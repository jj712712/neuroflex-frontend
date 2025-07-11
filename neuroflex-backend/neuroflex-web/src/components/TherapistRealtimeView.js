import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import './TherapistRealtimeView.css'; // Import CSS

const TherapistRealtimeView = ({ sessionId }) => {
  const [liveData, setLiveData] = useState([]);

  useEffect(() => {
    if (!sessionId) return;

    const liveEegRef = collection(db, 'sessions', sessionId, 'liveEegData');
    const q = query(liveEegRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newData = [];
      snapshot.forEach((doc) => {
        newData.push({ id: doc.id, ...doc.data() });
      });
      setLiveData(newData);
    }, (error) => {
      console.error("Error listening for real-time EEG data: ", error);
    });

    return () => unsubscribe();
  }, [sessionId]);

  return (
    <div className="therapist-realtime-container">
      <h2>Real-time EEG Data for Session: {sessionId}</h2>
      <div className="eeg-display">
        {liveData.slice(-20).map((item) => (
          <div key={item.id} className="eeg-data-item">
            <span className="timestamp">{new Date(item.timestamp.toDate()).toLocaleTimeString()}</span>
            <pre className="channels">{JSON.stringify(item.channels, null, 2)}</pre>
          </div>
        ))}
      </div>
      {/* Here, the therapist would see a visualization of the live data */}
    </div>
  );
};

export default TherapistRealtimeView;