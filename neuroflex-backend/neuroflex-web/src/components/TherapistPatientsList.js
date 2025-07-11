// src/components/TherapistPatientsList.js
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig'; // Ensure this path is correct
import './TherapistPatientsList.css'; // Your existing CSS file

const TherapistPatientsList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [therapistId, setTherapistId] = useState(null);

  // Helper function to format dates for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    // Firebase Timestamps have a toDate() method. If it's a string, parse it.
    let date;
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else {
      return 'N/A';
    }

    if (isNaN(date.getTime())) { // Check for invalid date
      return 'N/A';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setTherapistId(user.uid);
        console.log("Logged-in Therapist UID:", user.uid); // For debugging
      } else {
        setError("You must be logged in to view your patients.");
        setLoading(false);
        console.log("No therapist logged in."); // For debugging
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!therapistId) {
      return;
    }

    setLoading(true);
    setError(null);

    const patientsCollectionRef = collection(db, 'patients');
    const q = query(
      patientsCollectionRef,
      where('therapistId', '==', therapistId),
      orderBy('fullName', 'asc') // Order patients alphabetically by name
    );

    const unsubscribeFirestore = onSnapshot(q,
      (snapshot) => {
        const patientsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPatients(patientsData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching patients: ", err);
        setError("Failed to load patients. Please try again. " + err.message); // Provide more detailed error
        setLoading(false);
      }
    );

    return () => unsubscribeFirestore();
  }, [therapistId]);

  if (loading) {
    return (
      <div className="patients-list-container">
        <p className="loading-message">Loading patients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="patients-list-container">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="patients-list-container">
      <h2>My Patients</h2>
      {patients.length === 0 ? (
        <p className="no-patients-message">You currently have no patients assigned to you.</p>
      ) : (
        <ul className="patients-list">
          {patients.map((patient) => (
            <li key={patient.id} className="patient-card">
              <div className="patient-info">
                {/* Profile Picture */}
                {patient.profilePhotoUrl ? (
                  <img src={patient.profilePhotoUrl} alt={`${patient.fullName}'s profile`} className="patient-profile-pic" />
                ) : (
                  <div className="patient-profile-pic-placeholder">
                    {patient.fullName ? patient.fullName.charAt(0).toUpperCase() : '?'}
                  </div>
                )}
                <div className="patient-details">
                  <h3>{patient.fullName}</h3>
                  <p>Email: {patient.email}</p>
                  {patient.gender && <p>Gender: {patient.gender}</p>}
                  {patient.dateOfBirth && <p>DOB: {patient.dateOfBirth}</p>}
                </div>
              </div>

              {/* Assessment and Session Overview */}
              <div className="patient-overview">
                <div className="overview-item">
                  <strong>Self-Assessment:</strong>{' '}
                  <span className={`assessment-status ${patient.selfAssessmentCompleted ? 'completed' : 'pending'}`}>
                    {patient.selfAssessmentCompleted ? 'Completed' : 'Pending'}
                  </span>
                </div>
                {patient.primaryConcern && (
                  <div className="overview-item">
                    <strong>Primary Concern:</strong> {patient.primaryConcern}
                  </div>
                )}
                <div className="overview-item">
                  <strong>Last Session:</strong> {formatDate(patient.lastSessionDate)}
                </div>
                <div className="overview-item">
                  <strong>Next Session:</strong> {formatDate(patient.nextSessionDate)}
                </div>
                {patient.notesSnippet && (
                    <div className="overview-item">
                        <strong>Latest Note:</strong> {patient.notesSnippet}
                    </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="patient-actions">
                <button className="view-profile-button" onClick={() => console.log(`Viewing profile for ${patient.fullName}`)}>View Profile</button>
                <button className="message-button" onClick={() => console.log(`Messaging ${patient.fullName}`)}>Message</button>
                {/* Add a "Start Session" button if a session is scheduled for now/soon */}
                {/* <button className="start-session-button" disabled={!patient.nextSessionDate || new Date(patient.nextSessionDate).getTime() > Date.now() + 60 * 60 * 1000}>Start Session</button> */}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TherapistPatientsList;