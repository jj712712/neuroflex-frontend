// src/components/PatientSessionDetails.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import './PatientSessionDetails.css';

const PatientSessionDetails = () => {
    const { patientId } = useParams();
    const [patient, setPatient] = useState(null);
    const [assessments, setAssessments] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentTherapistUid, setCurrentTherapistUid] = useState(null);

    // Helper to format 24hr time to AM/PM for display
    const formatTimeForDisplay = (time24hr) => {
        if (!time24hr) return 'N/A';
        const [hour, minute] = time24hr.split(':').map(Number);
        const date = new Date();
        date.setHours(hour, minute, 0, 0);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true, hourCycle: 'h12' });
    };

    // Authenticate and get current therapist UID
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                getDoc(userDocRef).then(docSnap => {
                    if (docSnap.exists() && docSnap.data().role === 'therapist') {
                        setCurrentTherapistUid(user.uid);
                    } else {
                        setError("Access Denied: Only therapists can view this page.");
                        setLoading(false);
                    }
                }).catch(err => {
                    console.error("Error fetching user role:", err);
                    setError("Failed to verify user role.");
                    setLoading(false);
                });
            } else {
                setError("Please log in as a therapist to view patient details.");
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [db]);

    const fetchData = useCallback(async () => {
        if (!currentTherapistUid || !patientId) {
            setLoading(false);
            return;
        }

        try {
            // 1. Fetch Patient Profile
            const patientDocRef = doc(db, 'users', patientId);
            const patientSnap = await getDoc(patientDocRef);
            if (patientSnap.exists()) {
                setPatient({ id: patientSnap.id, ...patientSnap.data() });
            } else {
                setError("Patient profile not found.");
                setLoading(false);
                return;
            }

            // 2. Fetch Patient's Self-Assessments
            const assessmentsRef = collection(db, 'users', patientId, 'assessments');
            const qAssessments = query(assessmentsRef, orderBy('createdAt', 'desc')); // Assuming 'createdAt' for timestamp
            const assessmentsSnap = await getDocs(qAssessments);
            setAssessments(assessmentsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().createdAt?.toDate() // Use 'createdAt' from your data
            })));

            // 3. Fetch Bookings related to this patient and therapist
            const bookingsRef = collection(db, 'bookings');
            const qBookings = query(
                bookingsRef,
                where('patientId', '==', patientId),
                where('therapistId', '==', currentTherapistUid),
                orderBy('bookingTimestamp', 'desc')
            );
            const bookingsSnap = await getDocs(qBookings);
            const fetchedBookings = bookingsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                slotDate: doc.data().slotDate ? new Date(doc.data().slotDate + 'T00:00:00') : null,
                bookingTimestamp: doc.data().bookingTimestamp?.toDate()
            }));
            setBookings(fetchedBookings);

        } catch (err) {
            console.error("Error fetching patient session details:", err);
            setError("Failed to load patient session details. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [patientId, currentTherapistUid, db]);

    useEffect(() => {
        if (currentTherapistUid && patientId) {
            fetchData();
        }
    }, [currentTherapistUid, patientId, fetchData]);

    if (loading) {
        return <div className="patient-session-details-container">Loading patient session details...</div>;
    }

    if (error) {
        return <div className="patient-session-details-container error-message">{error}</div>;
    }

    if (!patient) {
        return <div className="patient-session-details-container">Patient not found or unauthorized access.</div>;
    }

    return (
        <div className="patient-session-details-container">
            <div className="patient-header">
                {patient.profilePhotoUrl ? (
                    <img src={patient.profilePhotoUrl} alt={`${patient.fullName || patient.name}'s profile`} className="patient-photo-lg" />
                ) : (
                    <div className="patient-photo-lg-placeholder">
                        <img src={process.env.PUBLIC_URL + '/default-avatar.png'} alt="Default Avatar" />
                    </div>
                )}
                <h1>{patient.fullName || patient.name || 'Patient Name'}</h1>
                <p className="patient-email">{patient.email}</p>
            </div>

            <div className="details-section">
                <h2>Self-Assessment Results</h2>
                {assessments.length > 0 ? (
                    <div className="assessments-grid">
                        {assessments.map(assessment => (
                            <div key={assessment.id} className="assessment-card">
                                {/* Use primaryConcern for the assessment type/title */}
                                <h3>{assessment.primaryConcern || 'Unnamed Assessment'}</h3>
                                {/* Use performanceLevel for the score */}
                                <p><strong>Performance Level:</strong> {assessment.performanceLevel || 'N/A'}</p>
                                {/* Use createdAt for the date */}
                                <p><strong>Date:</strong> {assessment.timestamp ? assessment.timestamp.toLocaleDateString() : 'N/A'}</p>
                                <p className="assessment-details">
                                    <strong>Recommendations:</strong>
                                    {/* Display recommendations array as a list or joined string */}
                                    {assessment.recommendations && assessment.recommendations.length > 0 ? (
                                        <ul>
                                            {assessment.recommendations.map((rec, idx) => (
                                                <li key={idx}>{rec}</li>
                                            ))}
                                        </ul>
                                    ) : 'N/A'}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="no-data-message">No self-assessment results found for this patient. (N/A)</p>
                )}
            </div>

            <div className="details-section">
                <h2>Session History</h2>
                {bookings.length > 0 ? (
                    <div className="sessions-list">
                        {bookings.map(booking => {
                            return (
                                <div key={booking.id} className="session-card">
                                    <h3>Session on {booking.slotDate ? booking.slotDate.toLocaleDateString() : 'N/A'} at {formatTimeForDisplay(booking.slotTime)}</h3>
                                    <p><strong>Status:</strong> <span className={`status ${booking.status}`}>{booking.status}</span></p>
                                    <p><strong>Problem Area:</strong> {booking.problemArea || 'N/A'}</p>
                                    <p><strong>Reason for Booking:</strong> {booking.reasonForBooking || 'N/A'}</p>
                                    <p><strong>Booking Date:</strong> {booking.bookingTimestamp ? booking.bookingTimestamp.toLocaleDateString() : 'N/A'}</p>

                                    <p className="no-data-message">EEG session data is not integrated yet. (N/A)</p>
                                    {/* Assuming therapistNotes and patientFeedback might be stored on the booking directly if no separate EEG session */}
                                    <p><strong>Therapist Notes:</strong> {booking.therapistNotes || 'No notes available for this session.'}</p>
                                    <p><strong>Patient Feedback:</strong> {booking.patientFeedback || 'No feedback available for this session.'}</p>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="no-data-message">No session history found for this patient with you.</p>
                )}
            </div>
        </div>
    );
};

export default PatientSessionDetails;
