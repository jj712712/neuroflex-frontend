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

    // Helper to get initials for placeholder
    const getInitials = (fullName) => {
        if (!fullName) return '';
        const names = fullName.split(' ').filter(n => n); // Split by space and remove empty strings
        if (names.length === 0) return '';
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };


    if (loading) {
        return <div className="patient-session-details-container">Loading patient session details...</div>;
    }

    if (error) {
        return <div className="patient-session-details-container error-message">{error}</div>;
    }

    if (!patient) {
        return <div className="patient-session-details-container">Patient not found or unauthorized access.</div>;
    }

    const patientDisplayName = patient.fullName || patient.name || 'Patient Name';
    const patientInitials = getInitials(patientDisplayName);

    return (
        <div className="patient-session-details-container">
            <div className="patient-header">
                {patient.profilePhotoUrl ? (
                    <img src={patient.profilePhotoUrl} alt={`${patientDisplayName}'s profile`} className="patient-photo-lg" />
                ) : (
                    <div className="patient-photo-lg-placeholder">
                        <span>{patientInitials}</span>
                    </div>
                )}
                <h1>{patientDisplayName}</h1>
                {/* Removed: <p className="patient-email">{patient.email}</p> */}
            </div>

            <div className="details-section">
                <h2>Self-Assessment Results</h2>
                {assessments.length > 0 ? (
                    <div className="assessments-grid">
                        {assessments.map(assessment => (
                            <div key={assessment.id} className="assessment-card">
                                <h3>{assessment.primaryConcern || 'Unnamed Assessment'}</h3>
                                <p><strong>Performance Level:</strong> {assessment.performanceLevel || 'N/A'}</p>
                                <p><strong>Date:</strong> {assessment.timestamp ? assessment.timestamp.toLocaleDateString() : 'N/A'}</p>
                                <div className="assessment-details"> {/* Changed p to div for better styling control */}
                                    <strong>Recommendations:</strong>
                                    {assessment.recommendations && assessment.recommendations.length > 0 ? (
                                        <ul>
                                            {assessment.recommendations.map((rec, idx) => (
                                                <li key={idx}>{rec}</li>
                                            ))}
                                        </ul>
                                    ) : <p>N/A</p>}
                                </div>
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
                                    <p className="session-detail-item"><strong>Problem Area:</strong> <span className="detail-value">{booking.problemArea || 'N/A'}</span></p>
                                    <p className="session-detail-item"><strong>Reason for Booking:</strong> <span className="detail-value">{booking.reasonForBooking || 'N/A'}</span></p>
                                    <p><strong>Booking Date:</strong> {booking.bookingTimestamp ? booking.bookingTimestamp.toLocaleDateString() : 'N/A'}</p>

                                    {/* Removed: <p className="no-data-message">EEG session data is not integrated yet. (N/A)</p> */}

                                    <p className="session-detail-item"><strong>Therapist Notes:</strong> <span className="detail-value">{booking.therapistNotes || 'No notes available for this session.'}</span></p>
                                    <p className="session-detail-item"><strong>Patient Feedback:</strong> <span className="detail-value">{booking.patientFeedback || 'No feedback available for this session.'}</span></p>
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
