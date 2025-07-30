// src/components/TherapistProfileView.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'; // Added serverTimestamp
import { auth, db } from '../firebaseConfig';
import './TherapistProfileView.css';

// Define daysOfWeek outside the component to make it a stable reference
const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Reusable Modal Component
const CustomModal = ({ title, message, onConfirm, onCancel, showConfirmButton, confirmText, loading, children, hideActions }) => {
    return (
        <div className="custom-modal-overlay">
            <div className="custom-modal-content">
                <h3>{title}</h3>
                {message && <p>{message}</p>}
                {children} {/* Render children for custom content */}
                {!hideActions && ( // Conditionally hide actions
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

const TherapistProfileView = () => {
    const { therapistId } = useParams();
    const [therapist, setTherapist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [patientUid, setPatientUid] = useState(null);
    const [patientData, setPatientData] = useState(null); // Data fetched from 'users' collection

    // New states for booking mechanism
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day
        return today;
    });
    const [selectedSlot, setSelectedSlot] = useState(null); // Stores {date, day, time, formattedDate}
    const [therapistBookings, setTherapistBookings] = useState([]);
    const [patientExistingBooking, setPatientExistingBooking] = useState(null); // 'pending' | 'accepted' | null (any active booking with this therapist)

    // Modals/Popups
    const [showPatientDetailsFormModal, setShowPatientDetailsFormModal] = useState(false); // For patient details form
    const [showBookingConfirmationModal, setShowBookingConfirmationModal] = useState(false);
    const [showSlotTakenPopup, setShowSlotTakenPopup] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [showMyExistingBookingPopup, setShowMyExistingBookingPopup] = useState(false);
    const [myExistingBookingMessage, setMyExistingBookingMessage] = useState("");

    // Form states for patient details and reason for booking
    const [bookingForm, setBookingForm] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        gender: '',
        dateOfBirth: '',
        address: '',
        problemArea: '',
        reasonForBooking: ''
    });
    const [formErrors, setFormErrors] = useState({}); // For form validation errors

    // Helper function to get initials for placeholder
    const getInitials = useCallback((fullName) => {
        if (!fullName) return '';
        const names = fullName.split(' ').filter(n => n); // Split by space and remove empty strings
        if (names.length === 0) return '';
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    }, []);

    // Helper function to generate time slots (24-hour format internally for logic)
    const generateTimeSlots24Hr = useCallback((startTime, endTime, durationMinutes) => {
        const slots = [];
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        let currentSlotTime = new Date();
        currentSlotTime.setHours(startHour, startMinute, 0, 0);

        const endDateTime = new Date();
        endDateTime.setHours(endHour, endMinute, 0, 0);

        while (currentSlotTime.getTime() < endDateTime.getTime()) {
            const hour = String(currentSlotTime.getHours()).padStart(2, '0');
            const minute = String(currentSlotTime.getMinutes()).padStart(2, '0');
            slots.push(`${hour}:${minute}`);
            currentSlotTime.setMinutes(currentSlotTime.getMinutes() + durationMinutes);
        }
        return slots;
    }, []); // No dependencies, as it's a pure function

    // Helper to format 24hr time to AM/PM for display
    const formatTimeForDisplay = useCallback((time24hr) => {
        if (!time24hr) return 'N/A';
        const [hour, minute] = time24hr.split(':').map(Number);
        const date = new Date();
        date.setHours(hour, minute, 0, 0);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true, hourCycle: 'h12' });
    }, []); // No dependencies, pure function

    // --- Effects for Data Fetching ---
    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user) {
                setPatientUid(user.uid);
                try {
                    const patientDocRef = doc(db, 'users', user.uid);
                    const patientDocSnap = await getDoc(patientDocRef);
                    if (patientDocSnap.exists()) {
                        const data = patientDocSnap.data();
                        setPatientData({ id: patientDocSnap.id, ...data });
                        // Pre-fill bookingForm with patientData
                        setBookingForm(prevForm => ({
                            ...prevForm,
                            fullName: data.name || '', // Assuming 'name' in user profile
                            email: data.email || '',
                            phoneNumber: data.phoneNumber || '',
                            gender: data.gender || '',
                            dateOfBirth: data.dateOfBirth || '', // Assuming 'YYYY-MM-DD' string
                            address: data.address || ''
                        }));
                    } else {
                        console.warn("Patient user profile not found in 'users' collection.");
                    }
                } catch (err) {
                    console.error("Error fetching patient profile:", err);
                    setError("Error fetching your profile data.");
                }
            } else {
                setPatientUid(null);
                setPatientData(null);
                console.log("No patient logged in.");
            }
            setLoading(false); // Set loading to false after auth state is determined and patient data fetched
        });

        return () => unsubscribeAuth();
    }, []); // 'auth' and 'db' are stable references, no need to include in dependencies

    const fetchTherapistProfile = useCallback(async () => {
        if (!therapistId) {
            setError("No therapist ID provided.");
            setLoading(false);
            return;
        }
        try {
            const docRef = doc(db, 'users', therapistId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setTherapist({ id: docSnap.id, ...docSnap.data() });
            } else {
                setError("Therapist not found.");
            }
        } catch (err) {
            console.error("Error fetching therapist profile:", err);
            setError("Failed to load therapist profile. Please try again.");
        }
    }, [therapistId]); // 'db' is stable

    const fetchTherapistBookingsAndPatientStatus = useCallback(async () => {
        if (!therapistId) { // patientUid might not be available yet, but therapistId is essential
            return;
        }
        try {
            const bookingsRef = collection(db, 'bookings');
            const qTherapistBookings = query(bookingsRef, where('therapistId', '==', therapistId));
            const querySnapshot = await getDocs(qTherapistBookings);
            const bookingsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTherapistBookings(bookingsData);

            // Check if the current patient has ANY active booking with this therapist
            if (patientUid) {
                const patientAnyActiveBookingQuery = query(
                    bookingsRef,
                    where('therapistId', '==', therapistId),
                    where('patientId', '==', patientUid),
                    where('status', 'in', ['pending', 'accepted'])
                );
                const patientAnyActiveBookingSnap = await getDocs(patientAnyActiveBookingQuery);
                if (patientAnyActiveBookingSnap.docs.length > 0) {
                    setPatientExistingBooking(patientAnyActiveBookingSnap.docs[0].data().status);
                } else {
                    setPatientExistingBooking(null);
                }
            } else {
                setPatientExistingBooking(null); // No patient logged in, so no existing booking
            }
        } catch (err) {
            console.error("Error fetching bookings:", err);
        }
    }, [therapistId, patientUid]); // 'db' is stable

    useEffect(() => {
        fetchTherapistProfile();
    }, [fetchTherapistProfile]);

    useEffect(() => {
        // Only fetch bookings if therapistId is available. patientUid can be null (not logged in)
        if (therapistId) {
            fetchTherapistBookingsAndPatientStatus();
        } else {
            setPatientExistingBooking(null);
            setTherapistBookings([]);
        }
    }, [therapistId, patientUid, fetchTherapistBookingsAndPatientStatus]); // Added patientUid to trigger re-fetch when patient logs in/out

    const availableDates = useMemo(() => {
        const dates = [];
        const now = new Date();
        now.setSeconds(0, 0);

        if (therapist?.availabilitySchedule) {
            for (let i = 0; i < 30; i++) { // Look 30 days into the future
                const date = new Date(now);
                date.setDate(now.getDate() + i);
                date.setHours(0, 0, 0, 0);

                const dayOfWeekName = daysOfWeek[date.getDay()];
                const dayAvailability = therapist.availabilitySchedule.find(
                    day => day.day === dayOfWeekName && day.available
                );

                if (dayAvailability) {
                    const allDaySlots = generateTimeSlots24Hr(dayAvailability.startTime, dayAvailability.endTime, parseInt(therapist.sessionDuration || '50', 10));

                    const hasFutureSlots = allDaySlots.some(slot24hr => {
                        const [slotHour, slotMinute] = slot24hr.split(':').map(Number);
                        const slotDateTime = new Date(date);
                        slotDateTime.setHours(slotHour, slotMinute, 0, 0);
                        return slotDateTime.getTime() > now.getTime();
                    });

                    if (hasFutureSlots) {
                        dates.push(date);
                    }
                }
            }
        }
        return dates;
    }, [therapist?.availabilitySchedule, therapist?.sessionDuration, generateTimeSlots24Hr]);

    useEffect(() => {
        if (therapist && availableDates.length > 0) {
            // Ensure selectedDate is one of the available future dates
            const isSelectedDateAvailableAndFuture = availableDates.some(d => d.toDateString() === selectedDate.toDateString());

            if (!isSelectedDateAvailableAndFuture) {
                // If current selectedDate is not available or is in the past, set to the first available future date
                setSelectedDate(availableDates[0]);
            }
        } else if (therapist && availableDates.length === 0) {
            // If no available dates, set selectedDate to today (or null if preferred)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            setSelectedDate(today);
        }
    }, [availableDates, selectedDate, therapist]);

    // --- Event Handlers ---
    const handleDateSelect = (event) => {
        const selectedDateString = event.target.value;
        const [year, month, day] = selectedDateString.split('-').map(Number);
        const newDate = new Date(year, month - 1, day);
        newDate.setHours(0, 0, 0, 0);
        setSelectedDate(newDate);
        setShowMyExistingBookingPopup(false); // Close any existing conflict messages on date change
    };

    const handleSlotClick = (day, time24hr) => {
        // Reset all conflict/info popups before new checks
        setShowMyExistingBookingPopup(false);
        setShowSlotTakenPopup(false);

        console.log("handleSlotClick triggered for slot:", time24hr);
        console.log("Current patientUid:", patientUid);
        console.log("Current patientExistingBooking:", patientExistingBooking);
        console.log("Current therapistBookings:", therapistBookings);


        if (!patientUid) {
            // This message is already handled by a dedicated prompt on the page: "Please log in to view and book available sessions."
            // No need for a modal here.
            console.log("User not logged in. Exiting handleSlotClick.");
            return; // Exit if not logged in
        }

        const formattedDate = selectedDate.toISOString().split('T')[0];

        // 1. Check if the current patient already has ANY active booking with this therapist.
        // This is the highest priority check.
        if (patientExistingBooking) {
            console.log("Conflict: Patient already has an active booking with this therapist.");
            setMyExistingBookingMessage(
                `It looks like you already have a ${patientExistingBooking} session with this therapist. ` +
                `To ensure the best experience, we allow only one active session at a time. ` +
                `Please check your 'My Bookings' page for details or wait for your current session to conclude.`
            );
            setShowMyExistingBookingPopup(true); // Show the general conflict popup
            return; // STOP: Do not proceed to show the form
        }

        // 2. Check if THIS SPECIFIC SLOT is already pending/accepted by the CURRENT PATIENT.
        const mySpecificSlotBooking = therapistBookings.find(booking =>
            booking.slotDate === formattedDate &&
            booking.slotTime === time24hr &&
            booking.patientId === patientUid &&
            ['pending', 'accepted'].includes(booking.status)
        );

        if (mySpecificSlotBooking) {
            console.log("Conflict: Patient already has a request for this specific slot.");
            setMyExistingBookingMessage(
                `You already have a ${mySpecificSlotBooking.status} request for this specific time slot. ` +
                `Please review your 'My Bookings' page for more information.`
            );
            setShowMyExistingBookingPopup(true); // Show the specific slot conflict popup
            return; // STOP: Do not proceed to show the form
        }

        // 3. Check if this specific slot is already booked by ANYONE ELSE (pending/accepted).
        const isAlreadyBookedByOthers = therapistBookings.some(booking =>
            booking.slotDate === formattedDate &&
            booking.slotTime === time24hr &&
            booking.patientId !== patientUid &&
            ['pending', 'accepted'].includes(booking.status)
        );

        if (isAlreadyBookedByOthers) {
            console.log("Conflict: Slot is already taken by another patient.");
            setShowSlotTakenPopup(true); // Show the "slot taken by others" popup
            return; // STOP: Do not proceed to show the form
        }

        // If all checks pass, it's safe to proceed: store the selected slot and show the patient details form modal
        console.log("No conflicts detected. Proceeding to show patient details form.");
        setSelectedSlot({
            date: selectedDate,
            day: day,
            time: time24hr,
            formattedDate: formattedDate
        });
        // Reset form errors and pre-fill with patientData
        setFormErrors({});
        setBookingForm(prevForm => ({
            ...prevForm,
            fullName: patientData?.name || '',
            email: patientData?.email || '',
            phoneNumber: patientData?.phoneNumber || '',
            gender: patientData?.gender || '',
            dateOfBirth: patientData?.dateOfBirth || '', // Ensure it's in YYYY-MM-DD format if stored differently
            address: patientData?.address || '',
            problemArea: '', // Always start with an empty problem area for new booking
            reasonForBooking: '' // Always start with an empty reason for new booking
        }));
        setShowPatientDetailsFormModal(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setBookingForm(prevForm => ({
            ...prevForm,
            [name]: value
        }));
        // Clear error for this field as user types
        if (formErrors[name]) {
            setFormErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validateForm = useCallback(() => { // Wrapped in useCallback
        const errors = {};
        if (!bookingForm.fullName.trim()) errors.fullName = 'Full Name is required.';
        if (!bookingForm.email.trim()) {
            errors.email = 'Email is required.';
        } else if (!/\S+@\S+\.\S+/.test(bookingForm.email)) {
            errors.email = 'Email is invalid.';
        }
        if (!bookingForm.phoneNumber.trim()) errors.phoneNumber = 'Phone number is required.';
        if (!bookingForm.gender.trim()) errors.gender = 'Gender is required.';
        if (!bookingForm.dateOfBirth.trim()) errors.dateOfBirth = 'Date of Birth is required.';
        if (!bookingForm.address.trim()) errors.address = 'Address is required.';
        if (!bookingForm.problemArea.trim()) errors.problemArea = 'Problem area is required.';
        if (!bookingForm.reasonForBooking.trim()) errors.reasonForBooking = 'Reason for booking is required.';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [bookingForm]); // Dependency on bookingForm

    // Handle patient details form submission
    const handlePatientDetailsSubmit = useCallback(() => { // Wrapped in useCallback
        if (!validateForm()) {
            return;
        }
        setShowPatientDetailsFormModal(false); // Close details form
        setShowBookingConfirmationModal(true); // Open confirmation modal
    }, [validateForm]); // Dependency on validateForm

    const handleConfirmBooking = async () => {
        // Essential checks just before final submission. These should generally pass if the flow is followed.
        if (!selectedSlot || !therapist || !patientData || !patientUid) {
            setMyExistingBookingMessage("Missing information for booking. Please try again.");
            setShowMyExistingBookingPopup(true);
            setLoading(false);
            return;
        }

        // Final form validation, in case user bypassed client-side validation (e.g., via browser dev tools)
        if (!validateForm()) {
            setMyExistingBookingMessage("Please complete all required fields in the booking form.");
            setShowMyExistingBookingPopup(true);
            return;
        }

        setLoading(true);

        try {
            const formattedDate = selectedSlot.formattedDate;
            const slotTime24hr = selectedSlot.time;

            // Re-check for any active booking by the current patient with this therapist
            // This is a crucial double-check for race conditions (e.g., user booking another session on a different tab)
            const patientAnyActiveBookingQuery = query(
                collection(db, 'bookings'),
                where('therapistId', '==', therapistId),
                where('patientId', '==', patientUid),
                where('status', 'in', ['pending', 'accepted'])
            );
            const patientAnyActiveBookingSnap = await getDocs(patientAnyActiveBookingQuery);
            if (patientAnyActiveBookingSnap.docs.length > 0) {
                setMyExistingBookingMessage(
                    `It looks like you already have a ${patientAnyActiveBookingSnap.docs[0].data().status} session with this therapist. ` +
                    `To ensure the best experience, we allow only one active session at a time. ` +
                    `Please check your 'My Bookings' page for details or wait for your current session to conclude.`
                );
                setShowMyExistingBookingPopup(true);
                setShowBookingConfirmationModal(false); // Close confirmation if this conflict is found
                setLoading(false);
                return;
            }

            // Also re-check if any other patient booked this slot in the meantime
            const isAlreadyBookedByOthersAtConfirmation = therapistBookings.some(booking =>
                booking.slotDate === formattedDate &&
                booking.slotTime === slotTime24hr &&
                booking.patientId !== patientUid &&
                ['pending', 'accepted'].includes(booking.status)
            );

            if (isAlreadyBookedByOthersAtConfirmation) {
                setShowBookingConfirmationModal(false); // Close confirmation if this slot is taken
                setLoading(false);
                setShowSlotTakenPopup(true); // Show "slot taken" popup
                return;
            }

            const bookingData = {
                therapistId: therapist.id,
                therapistName: therapist.fullName || 'Unknown Therapist',
                patientId: patientUid,
                // Use data from the bookingForm for patient details
                patientName: bookingForm.fullName,
                patientEmail: bookingForm.email,
                patientPhone: bookingForm.phoneNumber,
                patientGender: bookingForm.gender,
                patientDateOfBirth: bookingForm.dateOfBirth,
                patientAddress: bookingForm.address,
                problemArea: bookingForm.problemArea,
                reasonForBooking: bookingForm.reasonForBooking.trim(),
                slotDate: formattedDate,
                slotTime: slotTime24hr,
                status: 'pending',
                bookingTimestamp: serverTimestamp(), // Changed to serverTimestamp()
                clinicalLocation: therapist.clinicalLocation || null,
            };

            await addDoc(collection(db, 'bookings'), bookingData);

            setShowBookingConfirmationModal(false);
            setBookingForm({ // Reset form for a clean state for future bookings
                fullName: '', email: '', phoneNumber: '', gender: '', dateOfBirth: '', address: '', problemArea: '', reasonForBooking: ''
            });
            setShowSuccessPopup(true);
            // Re-fetch bookings to update the UI immediately with the new booking status
            await fetchTherapistBookingsAndPatientStatus();

        } catch (err) {
            console.error("Error booking session:", err);
            setMyExistingBookingMessage("Failed to book session. Please try again. " + err.message);
            setShowMyExistingBookingPopup(true);
        } finally {
            setLoading(false);
        }
    };

    // Function to close the success popup and then clear selectedSlot
    const handleSuccessPopupClose = () => {
        setShowSuccessPopup(false);
        setSelectedSlot(null); // Clear selectedSlot here
    };


    // --- Render Logic ---
    if (loading) {
        return <div className="profile-loading">Loading therapist profile...</div>;
    }

    if (error) {
        return <div className="profile-error">{error}</div>;
    }

    if (!therapist) {
        return <div className="profile-not-found">No therapist found with this ID.</div>;
    }

    const sessionDurationMinutes = parseInt(therapist.sessionDuration || '50', 10) || 50;

    const selectedDayOfWeek = daysOfWeek[selectedDate.getDay()];
    const todayAvailability = therapist.availabilitySchedule?.find(day => day.day === selectedDayOfWeek && day.available);
    const slotsForSelectedDay = todayAvailability ? generateTimeSlots24Hr(todayAvailability.startTime, todayAvailability.endTime, sessionDurationMinutes) : [];


    return (
        <div className="therapist-profile-container">
            <div className="profile-header">
                {therapist.profilePhotoUrl ? (
                    <img src={therapist.profilePhotoUrl} alt={`${therapist.fullName}'s profile`} className="profile-photo-lg" />
                ) : (
                    <div className="profile-photo-lg-placeholder">
                        {getInitials(therapist.fullName)} {/* Use getInitials here */}
                    </div>
                )}
                <h1>{therapist.fullName || 'Therapist Name'}</h1>
                <p className="designation">{therapist.designation}</p>
            </div>

            <div className="profile-details-card">
                <p className="bio">{therapist.bio || 'This therapist has not provided a bio yet.'}</p>

                <div className="detail-section">
                    <h3>Professional Details</h3>
                    <p><strong>Professional Title:</strong> {therapist.professionalTitle}</p>
                    <p><strong>Years of Experience:</strong> {therapist.yearsExperience || 'N/A'} years</p>
                    <p><strong>Approx. Session Duration:</strong> {therapist.sessionDuration || 'N/A'}</p>
                </div>

                <div className="detail-section">
                    <h3>Expertise & Approach</h3>
                    <p><strong>Specializations:</strong> {therapist.specializations && therapist.specializations.length > 0 ? therapist.specializations.join(', ') : 'N/A'}</p>
                    <p><strong>Therapeutic Approaches:</strong> {therapist.approaches && therapist.approaches.length > 0 ? therapist.approaches.join(', ') : 'N/A'}</p>
                    <p><strong>Qualifications:</strong> {therapist.qualification && therapist.qualification.length > 0 ? therapist.qualification.join(', ') : 'N/A'}</p>
                </div>

                <div className="detail-section">
                    <h3>Logistics</h3>
                    <p><strong>Insurance Accepted:</strong> {therapist.insuranceAccepted && therapist.insuranceAccepted.length > 0 ? therapist.insuranceAccepted.join(', ') : 'N/A'}</p>
                    <p>
                        <strong>Clinical Location:</strong> {therapist.clinicalLocation?.address}, {therapist.clinicalLocation?.city}, {therapist.clinicalLocation?.state}, {therapist.clinicalLocation?.zipCode}, {therapist.clinicalLocation?.country}
                    </p>
                    <p>
                        <strong>Gender:</strong> {therapist.gender || 'N/A'}
                    </p>
                </div>

                <div className="detail-section availability-section">
                    <h3>Availability & Booking</h3>

                    {!patientUid && (
                        <p className="login-prompt-message">Please log in to view and book available sessions.</p>
                    )}

                    {availableDates.length > 0 ? (
                        <>
                            <div className="date-selector-dropdown">
                                <label htmlFor="date-select">Select a Date:</label>
                                <select
                                    id="date-select"
                                    value={selectedDate.toISOString().split('T')[0]}
                                    onChange={handleDateSelect}
                                    disabled={!patientUid || patientExistingBooking} // Disable if not logged in or has existing booking
                                >
                                    {availableDates.map((date, index) => (
                                        <option key={index} value={date.toISOString().split('T')[0]}>
                                            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {todayAvailability && (
                                <p className="daily-availability-range">
                                    Available from {formatTimeForDisplay(todayAvailability.startTime)} to {formatTimeForDisplay(todayAvailability.endTime)} on {selectedDayOfWeek}.
                                </p>
                            )}
                        </>
                    ) : (
                        <p className="no-slots no-availability-message">
                            This therapist has no available dates listed for the near future. Please check back later.
                        </p>
                    )}


                    <div className="time-slots-grid">
                        {slotsForSelectedDay.length > 0 ? (
                            slotsForSelectedDay.map((time24hr, index) => {
                                const formattedDate = selectedDate.toISOString().split('T')[0];
                                const bookingForSlot = therapistBookings.find(booking =>
                                    booking.slotDate === formattedDate &&
                                    booking.slotTime === time24hr
                                );

                                let slotClassName = 'time-slot';
                                let slotText = formatTimeForDisplay(time24hr);
                                let isDisabled = false;

                                const now = new Date();
                                const [slotHour, slotMinute] = time24hr.split(':').map(Number);
                                const currentSlotFullDateTime = new Date(selectedDate);
                                currentSlotFullDateTime.setHours(slotHour, slotMinute, 0, 0);

                                // 1. Check if the slot is in the past
                                if (currentSlotFullDateTime.getTime() < now.getTime()) {
                                    isDisabled = true;
                                    slotClassName += ' slot-past';
                                    if (!slotText.includes('(Past)') && !slotText.includes('(Inactive)') && !slotText.includes('(Taken)') && !slotText.includes('(My Request Pending)') && !slotText.includes('(My Session Booked)')) {
                                        slotText = `${formatTimeForDisplay(time24hr)} (Past)`;
                                    }
                                }
                                // 2. If patient already has ANY active booking with this therapist, disable ALL slots
                                // This overrides other states if an overall booking exists
                                else if (patientExistingBooking) {
                                    isDisabled = true;
                                    slotClassName += ' slot-disabled-by-existing-booking';
                                    slotText = `${formatTimeForDisplay(time24hr)} (Already Booked)`;
                                }
                                // 3. Check if this specific slot is booked/pending by anyone (including self)
                                else if (bookingForSlot) {
                                    if (bookingForSlot.patientId === patientUid) {
                                        if (bookingForSlot.status === 'pending') {
                                            slotClassName += ' slot-pending-by-me';
                                            slotText = `${formatTimeForDisplay(time24hr)} (My Request Pending)`;
                                        } else if (bookingForSlot.status === 'accepted') {
                                            slotClassName += ' slot-booked-by-me';
                                            slotText = `${formatTimeForDisplay(time24hr)} (My Session Booked)`;
                                        }
                                        isDisabled = true; // My own pending/accepted slot is also disabled for re-booking
                                    } else {
                                        slotClassName += ' slot-taken';
                                        slotText = `${formatTimeForDisplay(time24hr)} (Taken)`;
                                        isDisabled = true;
                                    }
                                }

                                return (
                                    <button
                                        key={index}
                                        className={slotClassName}
                                        onClick={() => handleSlotClick(selectedDayOfWeek, time24hr)}
                                        disabled={isDisabled || !patientUid} // Disable if already booked/past, or if not logged in
                                        title={isDisabled ? "This slot is not available" : `Book session for ${selectedDayOfWeek}, ${formattedDate} at ${formatTimeForDisplay(time24hr)}`}
                                    >
                                        {slotText}
                                    </button>
                                );
                            })
                        ) : (
                            <p className="no-slots no-availability-message">
                                {availableDates.length === 0 ?
                                    "This therapist has no available dates listed for the near future. Please check back later." :
                                    (todayAvailability ?
                                        `No specific time slots defined for ${selectedDayOfWeek} within the therapist's available range.` :
                                        `This therapist has no availability listed for ${selectedDayOfWeek}. Please select another date.`
                                    )
                                }
                            </p>
                        )}
                    </div>
                </div>

                {/* Patient Details Form Modal (Step 1) */}
                {showPatientDetailsFormModal && selectedSlot && (
                    <CustomModal
                        title="Confirm Your Details & Reason"
                        onConfirm={handlePatientDetailsSubmit}
                        onCancel={() => {
                            setShowPatientDetailsFormModal(false);
                            setSelectedSlot(null); // Clear selected slot if user cancels this initial form
                            setFormErrors({}); // Clear errors
                        }}
                        showConfirmButton={true}
                        confirmText="Review & Confirm"
                        loading={false} // This modal itself isn't loading, only the final confirmation
                        hideActions={false}
                    >
                        <div className="patient-details-form-container">
                            <p className="form-intro-message">Please confirm your details and provide a reason for your session with <strong>{therapist.fullName}</strong> on <strong>{selectedSlot.date.toLocaleDateString()}</strong> at <strong>{formatTimeForDisplay(selectedSlot.time)}</strong>.</p>

                            <div className="form-group">
                                <label htmlFor="fullName">Full Name:</label>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    value={bookingForm.fullName}
                                    onChange={handleFormChange}
                                    className={formErrors.fullName ? 'input-error' : ''}
                                    required
                                />
                                {formErrors.fullName && <span className="error-text">{formErrors.fullName}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email:</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={bookingForm.email}
                                    onChange={handleFormChange}
                                    className={formErrors.email ? 'input-error' : ''}
                                    required
                                />
                                {formErrors.email && <span className="error-text">{formErrors.email}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="phoneNumber">Phone Number:</label>
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    value={bookingForm.phoneNumber}
                                    onChange={handleFormChange}
                                    className={formErrors.phoneNumber ? 'input-error' : ''}
                                    required
                                />
                                {formErrors.phoneNumber && <span className="error-text">{formErrors.phoneNumber}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="gender">Gender:</label>
                                <select
                                    id="gender"
                                    name="gender"
                                    value={bookingForm.gender}
                                    onChange={handleFormChange}
                                    className={formErrors.gender ? 'input-error' : ''}
                                    required
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="non-binary">Non-binary</option>
                                    <option value="prefer-not-to-say">Prefer not to say</option>
                                </select>
                                {formErrors.gender && <span className="error-text">{formErrors.gender}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="dateOfBirth">Date of Birth:</label>
                                <input
                                    type="date"
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                    value={bookingForm.dateOfBirth}
                                    onChange={handleFormChange}
                                    className={formErrors.dateOfBirth ? 'input-error' : ''}
                                    required
                                />
                                {formErrors.dateOfBirth && <span className="error-text">{formErrors.dateOfBirth}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="address">Address:</label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={bookingForm.address}
                                    onChange={handleFormChange}
                                    className={formErrors.address ? 'input-error' : ''}
                                    required
                                />
                                {formErrors.address && <span className="error-text">{formErrors.address}</span>}
                            </div>

                            {/* Problem Area Dropdown */}
                            <div className="form-group">
                                <label htmlFor="problemArea">Problem Area:</label>
                                <select
                                    id="problemArea"
                                    name="problemArea"
                                    value={bookingForm.problemArea}
                                    onChange={handleFormChange}
                                    className={formErrors.problemArea ? 'input-error' : ''}
                                    required
                                >
                                    <option value="">Select an area</option>
                                    <option value="Focus & Attention">Focus & Attention</option>
                                    <option value="Anxiety & Depression">Anxiety & Depression</option>
                                    <option value="Learning & Memory">Learning & Memory</option>
                                </select>
                                {formErrors.problemArea && <span className="error-text">{formErrors.problemArea}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="reasonForBooking">Reason for Booking:</label>
                                <textarea
                                    id="reasonForBooking"
                                    name="reasonForBooking"
                                    rows="4"
                                    value={bookingForm.reasonForBooking}
                                    onChange={handleFormChange}
                                    className={formErrors.reasonForBooking ? 'input-error' : ''}
                                    placeholder="Briefly describe why you are booking this session."
                                    required
                                ></textarea>
                                {formErrors.reasonForBooking && <span className="error-text">{formErrors.reasonForBooking}</span>}
                            </div>
                        </div>
                    </CustomModal>
                )}


                {/* Booking Confirmation Modal (Step 2) */}
                {showBookingConfirmationModal && selectedSlot && (
                    <CustomModal
                        title="Confirm Session Booking"
                        onConfirm={handleConfirmBooking}
                        onCancel={() => {
                            setShowBookingConfirmationModal(false);
                            setShowPatientDetailsFormModal(true); // Go back to details form if canceled
                        }}
                        showConfirmButton={true}
                        confirmText="Confirm Request"
                        loading={loading}
                    >
                        <p className="confirmation-summary-message">Please review your details and confirm your session booking.</p>
                        <div className="booking-summary-details">
                            <p><strong>Therapist:</strong> {therapist.fullName}</p>
                            <p><strong>Date:</strong> {selectedSlot.date.toLocaleDateString()}</p>
                            <p><strong>Time:</strong> {formatTimeForDisplay(selectedSlot.time)}</p>
                            <hr className="modal-divider" />
                            <h5>Your Details:</h5>
                            <p><strong>Name:</strong> {bookingForm.fullName}</p>
                            <p><strong>Email:</strong> {bookingForm.email}</p>
                            <p><strong>Phone:</strong> {bookingForm.phoneNumber}</p>
                            <p><strong>Gender:</strong> {bookingForm.gender}</p>
                            <p><strong>Date of Birth:</strong> {bookingForm.dateOfBirth}</p>
                            <p><strong>Address:</strong> {bookingForm.address}</p>
                            <p><strong>Problem Area:</strong> {bookingForm.problemArea}</p>
                            <p><strong>Reason:</strong> {bookingForm.reasonForBooking}</p>
                        </div>
                    </CustomModal>
                )}

                {/* Slot Taken Popup (by another patient) */}
                {showSlotTakenPopup && (
                    <CustomModal
                        title="Slot Not Available"
                        message="This time slot is already taken by another patient or is otherwise unavailable. Please choose another slot."
                        onCancel={() => setShowSlotTakenPopup(false)}
                        showConfirmButton={false}
                    />
                )}

                {/* My Existing Booking Popup (for the specific slot or any active booking) */}
                {showMyExistingBookingPopup && (
                    <CustomModal
                        title="Booking Conflict"
                        message={myExistingBookingMessage}
                        onCancel={() => {
                            setShowMyExistingBookingPopup(false);
                            setSelectedSlot(null); // Clear selected slot when user dismisses the conflict
                        }}
                        showConfirmButton={false}
                    />
                )}

                {/* Booking Success Popup */}
                {showSuccessPopup && (
                    <CustomModal
                        title="Booking Request Sent!"
                        message={`Your session booking request for ${selectedSlot?.date.toLocaleDateString()} at ${formatTimeForDisplay(selectedSlot?.time)} has been sent successfully and is pending therapist approval. Please check your 'My Bookings' page for status updates.`}
                        onCancel={handleSuccessPopupClose}
                        showConfirmButton={false}
                    />
                )}
            </div>
        </div>
    );
};

export default TherapistProfileView;
