// src/components/TherapistSessionOverview.js
import React, { useState, useEffect, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './TherapistSessionOverview.css';

// Reusable Modal Component
const CustomModal = ({ title, message, children, onCancel }) => {
    return (
        <div className="custom-modal-overlay">
            <div className="custom-modal-content">
                <h3>{title}</h3>
                {message && <p>{message}</p>}
                {children} {/* This is where the list content will go */}
                <div className="modal-actions">
                    <button className="cancel-button" onClick={onCancel}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const TherapistSessionOverview = () => {
    const auth = getAuth();
    const db = getFirestore();
    const [therapistUid, setTherapistUid] = useState(null);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dailyOverview, setDailyOverview] = useState({
        sessionsToday: 0,
        totalUpcoming: 0,
        totalCompleted: 0,
        totalPending: 0,
        totalAccepted: 0,
        totalCancelled: 0,
        totalPatients: 0,
    });

    // NEW STATES FOR SUMMARY MODAL
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState(''); // For introductory message
    // State to hold ALL categorized session lists (object)
    const [allCategorizedSessions, setAllCategorizedSessions] = useState(null);
    // State to hold the SPECIFIC list currently displayed in the modal (array)
    const [currentModalList, setCurrentModalList] = useState([]);

    // Helper to format 24hr time to AM/PM for display
    const formatTimeForDisplay = (time24hr) => {
        if (!time24hr) return 'N/A';
        const [hour, minute] = time24hr.split(':').map(Number);
        const date = new Date();
        date.setHours(hour, minute, 0, 0);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true, hourCycle: 'h12' });
    };

    // Helper to get initials for placeholder
    const getInitials = (fullName) => {
        if (!fullName) return '';
        const names = fullName.split(' ').filter(n => n); // Split by space and remove empty strings
        if (names.length === 0) return '';
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };


    // Authenticate and get current therapist UID
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                getDoc(userDocRef).then(docSnap => {
                    if (docSnap.exists() && docSnap.data().role === 'therapist') {
                        setTherapistUid(user.uid);
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
                setError("Please log in as a therapist to view this page.");
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [db, auth]);

    const fetchPatientsAndSessionData = useCallback(async (uid) => {
        setLoading(true);
        setError(null);

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today

        try {
            const bookingsRef = collection(db, 'bookings');
            const qBookings = query(bookingsRef, where('therapistId', '==', uid));
            const bookingsSnap = await getDocs(qBookings);

            const patientDataMap = new Map();
            let overviewSessionsToday = 0;
            let overviewTotalUpcoming = 0;
            let overviewTotalCompleted = 0;
            let overviewTotalPending = 0;
            let overviewTotalAccepted = 0;
            let overviewTotalCancelled = 0;
            let overviewTotalPatients = new Set();

            // Arrays to store sessions for modal content
            const sessionsTodayList = [];
            const upcomingSessionsList = [];
            const completedSessionsList = [];
            const pendingSessionsList = [];
            const acceptedSessionsList = [];
            const cancelledSessionsList = [];


            for (const bookingDoc of bookingsSnap.docs) {
                const booking = bookingDoc.data();
                const patientId = booking.patientId;
                overviewTotalPatients.add(patientId);

                if (!patientDataMap.has(patientId)) {
                    const patientDocRef = doc(db, 'users', patientId);
                    const patientDocSnap = await getDoc(patientDocRef);
                    let patientDetails = {
                        id: patientId,
                        fullName: booking.patientName || 'Unknown Patient',
                        profilePhotoUrl: null,
                        totalSessions: 0,
                        upcomingSessions: 0,
                        completedSessions: 0,
                        pendingSessions: 0,
                        acceptedSessions: 0,
                        cancelledSessions: 0,
                    };
                    if (patientDocSnap.exists()) {
                        patientDetails.fullName = patientDocSnap.data().fullName || patientDocSnap.data().name || 'Unknown Patient';
                        patientDetails.profilePhotoUrl = patientDocSnap.data().profilePhotoUrl || null;
                    } else {
                        patientDetails.fullName = booking.patientName || 'Unknown Patient (User Missing)';
                    }
                    patientDataMap.set(patientId, patientDetails);
                }

                const patient = patientDataMap.get(patientId);
                patient.totalSessions++;

                const sessionDate = new Date(booking.slotDate + 'T00:00:00');
                const sessionDateTime = new Date(booking.slotDate + 'T' + booking.slotTime);

                // Prepare booking data for modal display
                const bookingForModal = {
                    id: bookingDoc.id,
                    patientName: patient.fullName,
                    date: sessionDate.toLocaleDateString(),
                    time: formatTimeForDisplay(booking.slotTime),
                    status: booking.status,
                };

                switch (booking.status) {
                    case 'pending':
                        patient.pendingSessions++;
                        overviewTotalPending++;
                        pendingSessionsList.push(bookingForModal);
                        if (sessionDateTime >= new Date()) {
                            patient.upcomingSessions++;
                            overviewTotalUpcoming++;
                            upcomingSessionsList.push(bookingForModal);
                        }
                        if (sessionDate.getTime() === today.getTime()) {
                            overviewSessionsToday++;
                            sessionsTodayList.push(bookingForModal);
                        }
                        break;
                    case 'accepted':
                        patient.acceptedSessions++;
                        overviewTotalAccepted++;
                        acceptedSessionsList.push(bookingForModal);
                        if (sessionDateTime >= new Date()) {
                            patient.upcomingSessions++;
                            overviewTotalUpcoming++;
                            upcomingSessionsList.push(bookingForModal);
                        }
                        if (sessionDate.getTime() === today.getTime()) {
                            overviewSessionsToday++;
                            sessionsTodayList.push(bookingForModal);
                        }
                        break;
                    case 'completed':
                        patient.completedSessions++;
                        overviewTotalCompleted++;
                        completedSessionsList.push(bookingForModal);
                        break;
                    case 'cancelled':
                        patient.cancelledSessions++;
                        overviewTotalCancelled++;
                        cancelledSessionsList.push(bookingForModal);
                        break;
                    default:
                        break;
                }
            }

            setPatients(Array.from(patientDataMap.values()));
            setDailyOverview({
                sessionsToday: overviewSessionsToday,
                totalUpcoming: overviewTotalUpcoming,
                totalCompleted: overviewTotalCompleted,
                totalPending: overviewTotalPending,
                totalAccepted: overviewTotalAccepted,
                totalCancelled: overviewTotalCancelled,
                totalPatients: overviewTotalPatients.size,
            });

            setAllCategorizedSessions({
                sessionsToday: sessionsTodayList,
                totalUpcoming: upcomingSessionsList,
                totalCompleted: completedSessionsList,
                totalPending: pendingSessionsList,
                totalAccepted: acceptedSessionsList,
                totalCancelled: cancelledSessionsList,
                totalPatients: Array.from(overviewTotalPatients).map(id => patientDataMap.get(id)),
            });

        } catch (err) {
            console.error("Error fetching patients and session data:", err);
            setError("Failed to load patient overview. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [db]);

    useEffect(() => {
        if (therapistUid) {
            fetchPatientsAndSessionData(therapistUid);
        }
    }, [therapistUid, fetchPatientsAndSessionData]);

    // Handle click on summary items
    const handleSummaryItemClick = (type) => {
        if (!allCategorizedSessions) return; // Ensure data is loaded

        let title = '';
        let content = [];
        let message = ''; // Initialize message

        switch (type) {
            case 'sessionsToday':
                title = "Today's Sessions";
                message = "Here are the sessions scheduled for today:";
                content = allCategorizedSessions.sessionsToday;
                break;
            case 'totalPatients':
                title = "All Patients Overview";
                message = "Here is a summary of all your patients and their session counts:";
                content = allCategorizedSessions.totalPatients.map(p => ({
                    patientName: p.fullName,
                    totalSessions: p.totalSessions,
                    upcomingSessions: p.upcomingSessions,
                    completedSessions: p.completedSessions,
                    id: p.id,
                }));
                break;
            case 'totalUpcoming':
                title = "Upcoming Sessions";
                message = "Here are all your upcoming sessions:";
                content = allCategorizedSessions.totalUpcoming;
                break;
            case 'totalCompleted':
                title = "Completed Sessions";
                message = "Here are all your completed sessions:";
                content = allCategorizedSessions.totalCompleted;
                break;
            case 'totalPending':
                title = "Pending Sessions";
                message = "Here are all your sessions awaiting acceptance:";
                content = allCategorizedSessions.totalPending;
                break;
            case 'totalAccepted':
                title = "Accepted Sessions";
                message = "Here are all your accepted sessions:";
                content = allCategorizedSessions.totalAccepted;
                break;
            case 'totalCancelled':
                title = "Cancelled Sessions";
                message = "Here are all your cancelled sessions:";
                content = allCategorizedSessions.totalCancelled;
                break;
            default:
                break;
        }
        setModalTitle(title);
        setModalMessage(message); // Set the introductory message
        setCurrentModalList(content); // Set the specific list for the modal
        setShowSummaryModal(true);
    };

    if (loading) {
        return <div className="therapist-session-overview-container">Loading patient session overview...</div>;
    }

    if (error) {
        return <div className="therapist-session-overview-container error-message">{error}</div>;
    }

    return (
        <div className="therapist-session-overview-container">
            <h1>Patient Session Overview</h1>

            {/* Daily/Overall Summary Container */}
            <div className="daily-summary-card">
                <h2>Today's & Overall Session Summary</h2>
                <div className="summary-grid">
                    <div className="summary-item" onClick={() => handleSummaryItemClick('sessionsToday')}>
                        <p>Sessions Today:</p>
                        <strong>{dailyOverview.sessionsToday}</strong>
                    </div>
                    <div className="summary-item" onClick={() => handleSummaryItemClick('totalPatients')}>
                        <p>Total Patients:</p>
                        <strong>{dailyOverview.totalPatients}</strong>
                    </div>
                    <div className="summary-item" onClick={() => handleSummaryItemClick('totalUpcoming')}>
                        <p>Total Upcoming:</p>
                        <strong>{dailyOverview.totalUpcoming}</strong>
                    </div>
                    <div className="summary-item" onClick={() => handleSummaryItemClick('totalCompleted')}>
                        <p>Total Completed:</p>
                        <strong>{dailyOverview.totalCompleted}</strong>
                    </div>
                    <div className="summary-item" onClick={() => handleSummaryItemClick('totalPending')}>
                        <p>Total Pending:</p>
                        <strong>{dailyOverview.totalPending}</strong>
                    </div>
                    <div className="summary-item" onClick={() => handleSummaryItemClick('totalAccepted')}>
                        <p>Total Accepted:</p>
                        <strong>{dailyOverview.totalAccepted}</strong>
                    </div>
                    <div className="summary-item" onClick={() => handleSummaryItemClick('totalCancelled')}>
                        <p>Total Cancelled:</p>
                        <strong>{dailyOverview.totalCancelled}</strong>
                    </div>
                </div>
            </div>

            {patients.length === 0 ? (
                <p className="no-patients-message">You currently have no patients with recorded sessions.</p>
            ) : (
                <div className="patient-cards-grid">
                    {patients.map(patient => (
                        <div key={patient.id} className="patient-overview-card">
                            {/* NEW WRAPPER DIV for photo and name */}
                            <div className="patient-overview-header-content">
                                {patient.profilePhotoUrl ? (
                                    <img src={patient.profilePhotoUrl} alt={`${patient.fullName}'s profile`} className="patient-overview-photo" />
                                ) : (
                                    <div className="patient-overview-photo-placeholder">
                                        {/* Display the first initial of the patient's name */}
                                        {patient.fullName ? getInitials(patient.fullName) : 'N/A'}
                                    </div>
                                )}
                                <h3>{patient.fullName}</h3>
                            </div> {/* END OF NEW WRAPPER DIV */}

                            <div className="session-counts-detail">
                                <p>Total Sessions: <strong>{patient.totalSessions}</strong></p>
                                <p>Pending: <strong>{patient.pendingSessions}</strong></p>
                                <p>Accepted: <strong>{patient.acceptedSessions}</strong></p>
                                <p>Upcoming: <strong>{patient.upcomingSessions}</strong></p>
                                <p>Completed: <strong>{patient.completedSessions}</strong></p>
                                <p>Cancelled: <strong>{patient.cancelledSessions}</strong></p>
                            </div>
                            <Link to={`/therapist/patient-session-details/${patient.id}`} className="view-details-button">
                                View Session Details
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary Details Modal */}
            {showSummaryModal && (
                <CustomModal title={modalTitle} message={modalMessage} onCancel={() => setShowSummaryModal(false)}>
                    {currentModalList.length > 0 ? (
                        <ul className="summary-modal-list">
                            {currentModalList.map((item, index) => (
                                <li key={index} className="summary-modal-list-item">
                                    {/* Display patient name prominently */}
                                    <strong>{item.patientName}</strong>
                                    {/* Conditionally display session details based on content type */}
                                    {item.date && item.time && (
                                        <span> - {item.date} at {item.time}</span>
                                    )}
                                    {item.status && (
                                        <span className={`status ${item.status}`}>Status: {item.status}</span>
                                    )}
                                    {/* For Total Patients list, show their session summary */}
                                    {item.totalSessions !== undefined && (
                                        <div className="patient-summary-counts">
                                            <span>Patient's Total Sessions: {item.totalSessions}</span>
                                            <span>Patient's Upcoming Sessions: {item.upcomingSessions}</span>
                                            <span>Patient's Completed Sessions: {item.completedSessions}</span>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No details found for this category.</p>
                    )}
                </CustomModal>
            )}
        </div>
    );
};

export default TherapistSessionOverview;
