// src/pages/MyBookings.js
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig'; // Assuming firebaseConfig is correctly set up
import './MyBookings.css'; // We will create this CSS file

const MyBookings = () => {
    const [patientUid, setPatientUid] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                setPatientUid(user.uid);
            } else {
                setPatientUid(null);
                setLoading(false); // No user, no bookings to load
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!patientUid) {
            // If no patient is logged in, clear bookings and set loading to false
            setBookings([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        // Set up a real-time listener for the patient's bookings
        const bookingsRef = collection(db, 'bookings');
        const q = query(bookingsRef, where('patientId', '==', patientUid));

        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
            const fetchedBookings = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Convert Firestore Timestamp to JavaScript Date object for easier display
                bookingTimestamp: doc.data().bookingTimestamp?.toDate(),
            }));
            // Sort bookings by slotDate and slotTime
            fetchedBookings.sort((a, b) => {
                const dateA = new Date(`${a.slotDate}T${a.slotTime}`);
                const dateB = new Date(`${b.slotDate}T${b.slotTime}`);
                return dateA - dateB;
            });
            setBookings(fetchedBookings);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching patient bookings:", err);
            setError("Failed to load your bookings. Please try again.");
            setLoading(false);
        });

        // Clean up the listener when the component unmounts or patientUid changes
        return () => unsubscribeSnapshot();
    }, [patientUid]);

    if (loading) {
        return <div className="my-bookings-container loading">Loading your bookings...</div>;
    }

    if (error) {
        return <div className="my-bookings-container error">{error}</div>;
    }

    if (!patientUid) {
        return <div className="my-bookings-container no-auth">Please log in to view your booked sessions.</div>;
    }

    const pendingBookings = bookings.filter(b => b.status === 'pending');
    const acceptedBookings = bookings.filter(b => b.status === 'accepted');
    const completedBookings = bookings.filter(b => b.status === 'completed'); // Assuming a 'completed' status for past sessions
    const cancelledRejectedBookings = bookings.filter(b => b.status === 'cancelled' || b.status === 'rejected');

    return (
        <div className="my-bookings-container">
            <h2>My Booked Sessions</h2>

            {bookings.length === 0 && (
                <div className="no-bookings-message">
                    <p>You haven't booked any sessions yet. Find a therapist and book your first session!</p>
                </div>
            )}

            {pendingBookings.length > 0 && (
                <div className="booking-section pending-section">
                    <h3>Pending Requests ({pendingBookings.length})</h3>
                    {pendingBookings.map(booking => (
                        <div key={booking.id} className="booking-card pending">
                            <p><strong>Therapist:</strong> {booking.therapistName}</p>
                            <p><strong>Date:</strong> {new Date(booking.slotDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p><strong>Time:</strong> {booking.slotTime}</p>
                            <p><strong>Status:</strong> <span className="status-pending">Pending Approval</span></p>
                            <p className="booking-note">Awaiting therapist confirmation.</p>
                        </div>
                    ))}
                </div>
            )}

            {acceptedBookings.length > 0 && (
                <div className="booking-section accepted-section">
                    <h3>Confirmed Sessions ({acceptedBookings.length})</h3>
                    {acceptedBookings.map(booking => (
                        <div key={booking.id} className="booking-card accepted">
                            <p><strong>Therapist:</strong> {booking.therapistName}</p>
                            <p><strong>Date:</strong> {new Date(booking.slotDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p><strong>Time:</strong> {booking.slotTime}</p>
                            <p><strong>Status:</strong> <span className="status-accepted">Confirmed!</span></p>
                            {booking.clinicalLocation && (
                                <p><strong>Location:</strong> {booking.clinicalLocation.address}, {booking.clinicalLocation.city}</p>
                            )}
                            <p className="booking-note">Your session is booked. Please arrive on time.</p>
                        </div>
                    ))}
                </div>
            )}

            {completedBookings.length > 0 && (
                <div className="booking-section completed-section">
                    <h3>Past Sessions ({completedBookings.length})</h3>
                    {completedBookings.map(booking => (
                        <div key={booking.id} className="booking-card completed">
                            <p><strong>Therapist:</strong> {booking.therapistName}</p>
                            <p><strong>Date:</strong> {new Date(booking.slotDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p><strong>Time:</strong> {booking.slotTime}</p>
                            <p><strong>Status:</strong> <span className="status-completed">Completed</span></p>
                            <p className="booking-note">Hope your session was helpful!</p>
                        </div>
                    ))}
                </div>
            )}

            {cancelledRejectedBookings.length > 0 && (
                <div className="booking-section cancelled-section">
                    <h3>Cancelled/Rejected Sessions ({cancelledRejectedBookings.length})</h3>
                    {cancelledRejectedBookings.map(booking => (
                        <div key={booking.id} className="booking-card cancelled">
                            <p><strong>Therapist:</strong> {booking.therapistName}</p>
                            <p><strong>Date:</strong> {new Date(booking.slotDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p><strong>Time:</strong> {booking.slotTime}</p>
                            <p><strong>Status:</strong> <span className="status-cancelled-rejected">{booking.status === 'cancelled' ? 'Cancelled' : 'Rejected'}</span></p>
                            <p className="booking-note">This session was {booking.status}. Please book another.</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyBookings;
