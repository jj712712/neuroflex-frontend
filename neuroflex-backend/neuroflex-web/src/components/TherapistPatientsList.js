// src/components/TherapistPatientsList.js
import React, { useState, useEffect, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Link } from 'react-router-dom'; // Import Link for navigation
import './TherapistPatientsList.css';
import ChatInterface from './ChatInterface';

// Reusable Modal Component
const CustomModal = ({ title, message, onConfirm, onCancel, showConfirmButton, confirmText, loading, children, hideActions }) => {
    return (
        <div className="custom-modal-overlay">
            <div className="custom-modal-content">
                <h3>{title}</h3>
                {message && <p>{message}</p>}
                {children}
                {!hideActions && (
                    <div className="modal-actions">
                        {showConfirmButton && (
                            <button className="confirm-button" onClick={onConfirm} disabled={loading}>
                                {loading ? 'Processing...' : confirmText}
                            </button>
                        )}
                        <button className="cancel-button" onClick={onCancel} disabled={loading}>
                            {showConfirmButton ? 'Cancel' : 'OK'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const TherapistPatientsList = () => {
    const auth = getAuth();
    const db = getFirestore();
    const [therapistUid, setTherapistUid] = useState(null);
    const [therapistName, setTherapistName] = useState('');
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showActionModal, setShowActionModal] = useState(false);
    const [currentBookingToAction, setCurrentBookingToAction] = useState(null);
    const [actionType, setActionType] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [modalLoading, setModalLoading] = useState(false);

    const [showPatientProfileModal, setShowPatientProfileModal] = useState(false);
    const [selectedPatientProfile, setSelectedPatientProfile] = useState(null);
    const [patientProfileLoading, setPatientProfileLoading] = useState(true);
    const [patientProfileError, setPatientProfileError] = useState(null);

    const [showChatModal, setShowChatModal] = useState(false);
    const [currentChatInfo, setCurrentChatInfo] = useState(null);


    const formatTimeForDisplay = (time24hr) => {
        if (!time24hr) return 'N/A';
        const [hour, minute] = time24hr.split(':').map(Number);
        const date = new Date();
        date.setHours(hour, minute, 0, 0);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true, hourCycle: 'h12' });
    };

    const fetchTherapistBookings = useCallback(async (uid) => {
        setLoading(true);
        setError(null);
        try {
            const bookingsRef = collection(db, 'bookings');
            const q = query(bookingsRef, where('therapistId', '==', uid));
            const querySnapshot = await getDocs(q);
            let fetchedBookings = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                slotDate: new Date(doc.data().slotDate + 'T00:00:00')
            }));

            const patientIds = [...new Set(fetchedBookings.map(booking => booking.patientId))];
            const patientProfiles = {};
            if (patientIds.length > 0) {
                for (const patientId of patientIds) {
                    const patientDocRef = doc(db, 'users', patientId);
                    const patientDocSnap = await getDoc(patientDocRef);
                    if (patientDocSnap.exists()) {
                        patientProfiles[patientId] = patientDocSnap.data();
                    } else {
                        patientProfiles[patientId] = {
                            fullName: 'Unknown Patient',
                            email: 'N/A',
                            phoneNumber: 'N/A',
                            gender: 'N/A',
                            dateOfBirth: 'N/A',
                            address: 'N/A',
                            profilePhotoUrl: null
                        };
                    }
                }
            }

            fetchedBookings = fetchedBookings.map(booking => ({
                ...booking,
                patientDetails: patientProfiles[booking.patientId] || {
                    fullName: booking.patientName || 'Unknown Patient',
                    email: booking.patientEmail || 'N/A',
                    phoneNumber: booking.patientPhone || 'N/A',
                    gender: booking.patientGender || 'N/A',
                    dateOfBirth: booking.patientDateOfBirth || 'N/A',
                    address: booking.patientAddress || 'N/A',
                    profilePhotoUrl: null
                }
            }));

            fetchedBookings.sort((a, b) => {
                const statusOrder = { 'pending': 1, 'accepted': 2, 'completed': 3, 'rejected': 4, 'cancelled': 5 };
                if (statusOrder[a.status] !== statusOrder[b.status]) {
                    return statusOrder[a.status] - statusOrder[b.status];
                }
                if (a.status === 'pending' || a.status === 'accepted') {
                    const dateTimeA = new Date(a.slotDate);
                    const [hourA, minuteA] = a.slotTime.split(':').map(Number);
                    dateTimeA.setHours(hourA, minuteA);

                    const dateTimeB = new Date(b.slotDate);
                    const [hourB, minuteB] = b.slotTime.split(':').map(Number);
                    dateTimeB.setHours(hourB, minuteB);
                    return dateTimeA.getTime() - dateTimeB.getTime();
                }
                return 0;
            });

            setBookings(fetchedBookings);
        } catch (err) {
            console.error("Error fetching therapist bookings:", err);
            setError("Failed to load bookings. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [db]);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                setTherapistUid(user.uid);
                const userDocRef = doc(db, 'users', user.uid);
                getDoc(userDocRef).then(docSnap => {
                    if (docSnap.exists() && docSnap.data().role === 'therapist') {
                        setTherapistName(docSnap.data().fullName || docSnap.data().name || 'Your Name');
                        fetchTherapistBookings(user.uid);
                    } else {
                        setError("Access Denied: You are not authorized to view this page.");
                        setLoading(false);
                    }
                }).catch(err => {
                    console.error("Error fetching user role:", err);
                    setError("Failed to verify user role.");
                    setLoading(false);
                });
            } else {
                setTherapistUid(null);
                setTherapistName('');
                setBookings([]);
                setLoading(false);
                setError("Please log in to view your dashboard.");
            }
        });

        return () => unsubscribe();
    }, [auth, db, fetchTherapistBookings]);

    const openActionModal = (booking, action) => {
        setCurrentBookingToAction(booking);
        setActionType(action);
        let message = '';
        switch (action) {
            case 'accepted':
                message = `Are you sure you want to ACCEPT the session with ${booking.patientDetails.fullName || booking.patientName} on ${booking.slotDate.toLocaleDateString()} at ${formatTimeForDisplay(booking.slotTime)}?`;
                break;
            case 'rejected':
                message = `Are you sure you want to REJECT the session with ${booking.patientDetails.fullName || booking.patientName} on ${booking.slotDate.toLocaleDateString()} at ${formatTimeForDisplay(booking.slotTime)}? This action cannot be undone.`;
                break;
            case 'completed':
                message = `Are you sure you want to mark the session with ${booking.patientDetails.fullName || booking.patientName} on ${booking.slotDate.toLocaleDateString()} at ${formatTimeForDisplay(booking.slotTime)} as COMPLETED?`;
                break;
            case 'cancelled':
                message = `Are you sure you want to CANCEL the session with ${booking.patientDetails.fullName || booking.patientName} on ${booking.slotDate.toLocaleDateString()} at ${formatTimeForDisplay(booking.slotTime)}? This will notify the patient.`;
                break;
            default:
                message = 'Are you sure you want to perform this action?';
        }
        setModalMessage(message);
        setShowActionModal(true);
    };

    const confirmBookingAction = async () => {
        if (!currentBookingToAction || !actionType) return;

        setModalLoading(true);
        try {
            const bookingRef = doc(db, 'bookings', currentBookingToAction.id);
            await updateDoc(bookingRef, { status: actionType });

            if (therapistUid) {
                await fetchTherapistBookings(therapistUid);
            }
            setShowActionModal(false);
            setCurrentBookingToAction(null);
            setActionType('');
            setModalLoading(false);
        } catch (err) {
            console.error(`Error ${actionType}ing booking:`, err);
            setModalMessage(`Failed to ${actionType} booking: ${err.message}. Please try again.`);
            setModalLoading(false);
        }
    };

    const closeActionModal = () => {
        setShowActionModal(false);
        setCurrentBookingToAction(null);
        setActionType('');
        setModalMessage('');
    };

    const openPatientProfile = useCallback(async (booking) => {
        setPatientProfileLoading(true);
        setPatientProfileError(null);
        setSelectedPatientProfile(null);
        setShowPatientProfileModal(true);

        try {
            const patientDocRef = doc(db, 'users', booking.patientId);
            const patientDocSnap = await getDoc(patientDocRef);
            if (patientDocSnap.exists()) {
                const patientProfileData = patientDocSnap.data();
                setSelectedPatientProfile({
                    id: patientDocSnap.id,
                    fullName: patientProfileData.name || patientProfileData.fullName || 'N/A',
                    email: patientProfileData.email || 'N/A',
                    phoneNumber: patientProfileData.phoneNumber || 'N/A',
                    gender: patientProfileData.gender || 'N/A',
                    dateOfBirth: patientProfileData.dateOfBirth || 'N/A',
                    address: patientProfileData.address || 'N/A',
                    profilePhotoUrl: patientProfileData.profilePhotoUrl || null,

                    reasonForBooking: booking.reasonForBooking || 'N/A',
                    problemArea: booking.problemArea || 'N/A',
                    bookedDate: booking.slotDate.toLocaleDateString(),
                    bookedTime: formatTimeForDisplay(booking.slotTime),
                    bookingStatus: booking.status
                });
            } else {
                setPatientProfileError("Patient profile not found in users collection. Displaying limited booking details.");
                setSelectedPatientProfile({
                    fullName: booking.patientName || 'Unknown Patient',
                    email: booking.patientEmail || 'N/A',
                    phoneNumber: booking.patientPhone || 'N/A',
                    gender: booking.patientGender || 'N/A',
                    dateOfBirth: booking.patientDateOfBirth || 'N/A',
                    address: booking.patientAddress || 'N/A',
                    reasonForBooking: booking.reasonForBooking || 'N/A',
                    problemArea: booking.problemArea || 'N/A',
                    bookedDate: booking.slotDate.toLocaleDateString(),
                    bookedTime: formatTimeForDisplay(booking.slotTime),
                    bookingStatus: booking.status,
                    profilePhotoUrl: null
                });
            }
        } catch (err) {
            console.error("Error fetching patient profile:", err);
            setPatientProfileError("Failed to load patient profile. Please try again.");
            setSelectedPatientProfile({
                fullName: booking.patientName || 'Unknown Patient',
                email: booking.patientEmail || 'N/A',
                phoneNumber: booking.patientPhone || 'N/A',
                gender: booking.patientGender || 'N/A',
                dateOfBirth: booking.patientDateOfBirth || 'N/A',
                address: booking.patientAddress || 'N/A',
                reasonForBooking: booking.reasonForBooking || 'N/A',
                problemArea: booking.problemArea || 'N/A',
                bookedDate: booking.slotDate.toLocaleDateString(),
                bookedTime: formatTimeForDisplay(booking.slotTime),
                bookingStatus: booking.status,
                profilePhotoUrl: null
            });
        } finally {
            setPatientProfileLoading(false);
        }
    }, [db]);

    const closePatientProfileModal = () => {
        setShowPatientProfileModal(false);
        setSelectedPatientProfile(null);
        setPatientProfileError(null);
    };

    const openChatModal = useCallback((patientId, patientName) => {
        if (!therapistUid || !therapistName) {
            setError("Therapist information not available to start chat.");
            return;
        }
        setCurrentChatInfo({
            patientId: patientId,
            patientName: patientName,
        });
        setShowChatModal(true);
    }, [therapistUid, therapistName]);

    const closeChatModal = () => {
        setShowChatModal(false);
        setCurrentChatInfo(null);
    };


    const groupedBookings = bookings.reduce((acc, booking) => {
        const status = booking.status;
        if (!acc[status]) {
            acc[status] = [];
        }
        acc[status].push(booking);
        return acc;
    }, {});

    const now = new Date();

    if (loading) {
        return <div className="therapist-patients-container">Loading patient bookings...</div>;
    }

    if (error) {
        return <div className="therapist-patients-container error-message">{error}</div>;
    }

    return (
        <div className="therapist-patients-container">
            <h1>Your Patient Bookings</h1>

            {Object.keys(groupedBookings).length === 0 && (
                <p className="no-bookings-message">You currently have no patient bookings.</p>
            )}

            {/* Pending Bookings */}
            {groupedBookings.pending && groupedBookings.pending.length > 0 && (
                <div className="booking-section pending-bookings">
                    <h2>Pending Requests</h2>
                    <div className="bookings-grid">
                        {groupedBookings.pending.map(booking => {
                            const bookingDateTime = new Date(booking.slotDate);
                            const [hour, minute] = booking.slotTime.split(':').map(Number);
                            bookingDateTime.setHours(hour, minute);
                            const isPast = bookingDateTime < now;

                            return (
                                <div key={booking.id} className={`booking-card ${isPast ? 'past-booking' : ''}`}>
                                    <p><strong>Patient:</strong> {booking.patientDetails.fullName || booking.patientName}</p>
                                    <p><strong>Email:</strong> {booking.patientDetails.email || 'N/A'}</p>
                                    <p><strong>Phone:</strong> {booking.patientDetails.phoneNumber || 'N/A'}</p>
                                    <p><strong>Date:</strong> {booking.slotDate.toLocaleDateString()}</p>
                                    <p><strong>Time:</strong> {formatTimeForDisplay(booking.slotTime)}</p>
                                    <p><strong>Problem Area:</strong> {booking.problemArea || 'N/A'}</p>
                                    <p><strong>Reason:</strong> {booking.reasonForBooking || 'N/A'}</p>
                                    <p className={`status ${booking.status}`}>Status: {booking.status}</p>
                                    <div className="booking-actions">
                                        {!isPast && (
                                            <>
                                                <button className="action-button accept" onClick={() => openActionModal(booking, 'accepted')}>Accept</button>
                                                <button className="action-button reject" onClick={() => openActionModal(booking, 'rejected')}>Reject</button>
                                            </>
                                        )}
                                        <button className="action-button view-profile" onClick={() => openPatientProfile(booking)}>View Profile</button>
                                        <button
                                            className="action-button chat-button"
                                            onClick={() => openChatModal(booking.patientId, booking.patientDetails.fullName || booking.patientName)}
                                        >
                                            Chat
                                        </button>
                                        {/* NEW: View Session History Button */}
                                        <Link
                                            to={`/therapist/patient-session-details/${booking.patientId}`}
                                            className="action-button view-session-history-button"
                                        >
                                            Session History
                                        </Link>
                                        {isPast && <span className="past-due-label">Past Due</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Accepted/Upcoming Bookings */}
            {groupedBookings.accepted && groupedBookings.accepted.length > 0 && (
                <div className="booking-section accepted-bookings">
                    <h2>Upcoming Sessions</h2>
                    <div className="bookings-grid">
                        {groupedBookings.accepted.map(booking => {
                            const bookingDateTime = new Date(booking.slotDate);
                            const [hour, minute] = booking.slotTime.split(':').map(Number);
                            bookingDateTime.setHours(hour, minute);
                            const isPast = bookingDateTime < now;

                            return (
                                <div key={booking.id} className={`booking-card ${isPast ? 'past-booking' : ''}`}>
                                    <p><strong>Patient:</strong> {booking.patientDetails.fullName || booking.patientName}</p>
                                    <p><strong>Email:</strong> {booking.patientDetails.email || 'N/A'}</p>
                                    <p><strong>Phone:</strong> {booking.patientDetails.phoneNumber || 'N/A'}</p>
                                    <p><strong>Date:</strong> {booking.slotDate.toLocaleDateString()}</p>
                                    <p><strong>Time:</strong> {formatTimeForDisplay(booking.slotTime)}</p>
                                    <p><strong>Problem Area:</strong> {booking.problemArea || 'N/A'}</p>
                                    <p><strong>Reason:</strong> {booking.reasonForBooking || 'N/A'}</p>
                                    <p className={`status ${booking.status}`}>Status: {booking.status}</p>
                                    <div className="booking-actions">
                                        {isPast ? (
                                            <button className="action-button complete" onClick={() => openActionModal(booking, 'completed')}>Mark Completed</button>
                                        ) : (
                                            <button className="action-button cancel" onClick={() => openActionModal(booking, 'cancelled')}>Cancel Session</button>
                                        )}
                                        <button className="action-button view-profile" onClick={() => openPatientProfile(booking)}>View Profile</button>
                                        <button
                                            className="action-button chat-button"
                                            onClick={() => openChatModal(booking.patientId, booking.patientDetails.fullName || booking.patientName)}
                                        >
                                            Chat
                                        </button>
                                        {/* NEW: View Session History Button */}
                                        <Link
                                            to={`/therapist/patient-session-details/${booking.patientId}`}
                                            className="action-button view-session-history-button"
                                        >
                                            Session History
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Completed Bookings */}
            {groupedBookings.completed && groupedBookings.completed.length > 0 && (
                <div className="booking-section completed-bookings">
                    <h2>Completed Sessions</h2>
                    <div className="bookings-grid">
                        {groupedBookings.completed.map(booking => (
                            <div key={booking.id} className="booking-card completed">
                                <p><strong>Patient:</strong> {booking.patientDetails.fullName || booking.patientName}</p>
                                <p><strong>Email:</strong> {booking.patientDetails.email || 'N/A'}</p>
                                <p><strong>Phone:</strong> {booking.patientDetails.phoneNumber || 'N/A'}</p>
                                <p><strong>Date:</strong> {booking.slotDate.toLocaleDateString()}</p>
                                <p><strong>Time:</strong> {formatTimeForDisplay(booking.slotTime)}</p>
                                <p><strong>Problem Area:</strong> {booking.problemArea || 'N/A'}</p>
                                <p><strong>Reason:</strong> {booking.reasonForBooking || 'N/A'}</p>
                                <p className={`status ${booking.status}`}>Status: {booking.status}</p>
                                <div className="booking-actions">
                                    <button className="action-button view-profile" onClick={() => openPatientProfile(booking)}>View Profile</button>
                                    <button
                                        className="action-button chat-button"
                                        onClick={() => openChatModal(booking.patientId, booking.patientDetails.fullName || booking.patientName)}
                                    >
                                        Chat
                                    </button>
                                    {/* NEW: View Session History Button */}
                                    <Link
                                        to={`/therapist/patient-session-details/${booking.patientId}`}
                                        className="action-button view-session-history-button"
                                    >
                                        Session History
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Rejected Bookings */}
            {groupedBookings.rejected && groupedBookings.rejected.length > 0 && (
                <div className="booking-section rejected-bookings">
                    <h2>Rejected Requests</h2>
                    <div className="bookings-grid">
                        {groupedBookings.rejected.map(booking => (
                            <div key={booking.id} className="booking-card rejected">
                                <p><strong>Patient:</strong> {booking.patientDetails.fullName || booking.patientName}</p>
                                <p><strong>Email:</strong> {booking.patientDetails.email || 'N/A'}</p>
                                <p><strong>Phone:</strong> {booking.patientDetails.phoneNumber || 'N/A'}</p>
                                <p><strong>Date:</strong> {booking.slotDate.toLocaleDateString()}</p>
                                <p><strong>Time:</strong> {formatTimeForDisplay(booking.slotTime)}</p>
                                <p><strong>Problem Area:</strong> {booking.problemArea || 'N/A'}</p>
                                <p><strong>Reason:</strong> {booking.reasonForBooking || 'N/A'}</p>
                                <p className={`status ${booking.status}`}>Status: {booking.status}</p>
                                <div className="booking-actions">
                                    <button className="action-button view-profile" onClick={() => openPatientProfile(booking)}>View Profile</button>
                                    <button
                                        className="action-button chat-button"
                                        onClick={() => openChatModal(booking.patientId, booking.patientDetails.fullName || booking.patientName)}
                                    >
                                        Chat
                                    </button>
                                    {/* NEW: View Session History Button */}
                                    <Link
                                        to={`/therapist/patient-session-details/${booking.patientId}`}
                                        className="action-button view-session-history-button"
                                    >
                                        Session History
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Cancelled Bookings */}
            {groupedBookings.cancelled && groupedBookings.cancelled.length > 0 && (
                <div className="booking-section cancelled-bookings">
                    <h2>Cancelled Sessions</h2>
                    <div className="bookings-grid">
                        {groupedBookings.cancelled.map(booking => (
                            <div key={booking.id} className="booking-card cancelled">
                                <p><strong>Patient:</strong> {booking.patientDetails.fullName || booking.patientName}</p>
                                <p><strong>Email:</strong> {booking.patientDetails.email || 'N/A'}</p>
                                <p><strong>Phone:</strong> {booking.patientDetails.phoneNumber || 'N/A'}</p>
                                <p><strong>Date:</strong> {booking.slotDate.toLocaleDateString()}</p>
                                <p><strong>Time:</strong> {formatTimeForDisplay(booking.slotTime)}</p>
                                <p><strong>Problem Area:</strong> {booking.problemArea || 'N/A'}</p>
                                <p><strong>Reason:</strong> {booking.reasonForBooking || 'N/A'}</p>
                                <p className={`status ${booking.status}`}>Status: {booking.status}</p>
                                <div className="booking-actions">
                                    <button className="action-button view-profile" onClick={() => openPatientProfile(booking)}>View Profile</button>
                                    <button
                                        className="action-button chat-button"
                                        onClick={() => openChatModal(booking.patientId, booking.patientDetails.fullName || booking.patientName)}
                                    >
                                        Chat
                                    </button>
                                    {/* NEW: View Session History Button */}
                                    <Link
                                        to={`/therapist/patient-session-details/${booking.patientId}`}
                                        className="action-button view-session-history-button"
                                    >
                                        Session History
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {showActionModal && (
                <CustomModal
                    title={`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Booking`}
                    message={modalMessage}
                    onConfirm={confirmBookingAction}
                    onCancel={closeActionModal}
                    showConfirmButton={true}
                    confirmText={actionType.charAt(0).toUpperCase() + actionType.slice(1)}
                    loading={modalLoading}
                />
            )}

            {/* Patient Profile View Modal */}
            {showPatientProfileModal && (
                <CustomModal
                    title="Patient Profile"
                    onCancel={closePatientProfileModal}
                    showConfirmButton={false}
                >
                    {patientProfileLoading ? (
                        <p>Loading patient profile...</p>
                    ) : patientProfileError ? (
                        <p className="error-message">{patientProfileError}</p>
                    ) : selectedPatientProfile ? (
                        <div className="patient-profile-details-modal">
                            {selectedPatientProfile.profilePhotoUrl ? (
                                <img src={selectedPatientProfile.profilePhotoUrl} alt={`${selectedPatientProfile.fullName}'s profile`} className="patient-profile-modal-photo" />
                            ) : (
                                <div className="patient-profile-modal-photo-placeholder">
                                    <img src={process.env.PUBLIC_URL + '/default-avatar.png'} alt="Default Avatar" />
                                </div>
                            )}
                            <h4>{selectedPatientProfile.fullName || 'N/A'}</h4>
                            <p><strong>Email:</strong> {selectedPatientProfile.email || 'N/A'}</p>
                            <p><strong>Phone:</strong> {selectedPatientProfile.phoneNumber || 'N/A'}</p>
                            <p><strong>Gender:</strong> {selectedPatientProfile.gender || 'N/A'}</p>
                            <p><strong>Date of Birth:</strong> {selectedPatientProfile.dateOfBirth ? new Date(selectedPatientProfile.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                            <p><strong>Address:</strong> {selectedPatientProfile.address || 'N/A'}</p>
                            <hr className="modal-divider" />
                            <h5>Booking Details:</h5>
                            <p><strong>Booked Date:</strong> {selectedPatientProfile.bookedDate || 'N/A'}</p>
                            <p><strong>Booked Time:</strong> {selectedPatientProfile.bookedTime || 'N/A'}</p>
                            <p><strong>Booking Status:</strong> {selectedPatientProfile.bookingStatus || 'N/A'}</p>
                            <p><strong>Problem Area:</strong> {selectedPatientProfile.problemArea || 'N/A'}</p>
                            <p><strong>Reason for Booking:</strong> {selectedPatientProfile.reasonForBooking || 'N/A'}</p>
                        </div>
                    ) : (
                        <p>No patient data available.</p>
                    )}
                </CustomModal>
            )}

            {/* Chat Modal */}
            {showChatModal && currentChatInfo && (
                <CustomModal
                    title=""
                    onCancel={closeChatModal}
                    showConfirmButton={false}
                    hideActions={true}
                >
                    <ChatInterface
                        currentUserId={therapistUid}
                        currentUserName={therapistName}
                        otherUserId={currentChatInfo.patientId}
                        otherUserName={currentChatInfo.patientName}
                        isCurrentUserTherapist={true}
                        onClose={closeChatModal}
                    />
                </CustomModal>
            )}
        </div>
    );
};

export default TherapistPatientsList;
