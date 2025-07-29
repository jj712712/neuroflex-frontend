// src/pages/TherapistManageProfile.js
import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'; // Import Firestore functions
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Import Storage functions
import { auth, db, storage } from '../firebaseConfig'; // Import auth, db, and storage
import { onAuthStateChanged } from 'firebase/auth'; // Import onAuthStateChanged
import './TherapistManageProfile.css';

const TherapistManageProfile = () => {
    const [profileData, setProfileData] = useState({
        // Public Profile Information
        profilePhoto: null, // This will be a File object for upload
        profilePhotoUrl: '', // To store URL from Firebase Storage after upload
        fullName: '',
        professionalTitle: '',
        designation: '',
        gender: '',
        qualification: [],
        specializations: [],
        yearsExperience: '',
        sessionDuration: '',
        availabilitySchedule: [
            { day: 'Monday', available: false, startTime: '', endTime: '' },
            { day: 'Tuesday', available: false, startTime: '', endTime: '' },
            { day: 'Wednesday', available: false, startTime: '', endTime: '' },
            { day: 'Thursday', available: false, startTime: '', endTime: '' },
            { day: 'Friday', available: false, startTime: '', endTime: '' },
            { day: 'Saturday', available: false, startTime: '', endTime: '' },
            { day: 'Sunday', available: false, startTime: '', endTime: '' },
        ],
        clinicalLocation: {
            address: '', city: '', state: '', zipCode: '', country: '',
        },
        bio: '',
        isPublic: false, // Controls visibility in FindTherapist. Will be set to true on save.
        approaches: [],
        insuranceAccepted: [], // Renamed to match FindTherapist.js query

        // Private/Internal Information
        legalFullName: '',
        dateOfBirth: '',
        personalPhoneNumber: '',
        personalEmail: '',
        residentialAddress: {
            address: '', city: '', state: '', zipCode: '', country: '',
        },
        licenseDetails: {
            licenseType: '', licenseNumber: '', issuingAuthority: '', expirationDate: '',
        },
        licenseDocuments: [], // To hold File objects before upload
        licenseDocumentsUrls: [], // To store URLs from Firebase Storage
        emergencyContact: {
            name: '', phoneNumber: '',
        },
        // Role and createdAt are usually handled on user creation or set during this process
        // Adding them here to ensure they are always present in the 'users' document
        role: 'therapist', // Explicitly set role
        createdAt: null, // Will be set on first save if not existing
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null); // Store the current user's UID
    const [fetchError, setFetchError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Dummy data for select options (consider fetching from Firestore for dynamic options)
    const professionalTitleOptions = ['Dr.', 'Mr.', 'Ms.', 'Mx.', 'Prof.'];
    const designationOptions = [
        'Licensed Clinical Psychologist', 'Licensed Clinical Social Worker', 'Licensed Marriage and Family Therapist',
        'Licensed Professional Counselor', 'Certified Addiction Counselor', 'Psychiatrist', 'Other'
    ];
    const genderOptions = ['Prefer not to say', 'Male', 'Female', 'Non-binary'];
    const qualificationOptions = [
        'Ph.D. in Clinical Psychology', 'Psy.D.', 'M.D. (Psychiatry)', 'MSW (Master of Social Work)',
        'M.A. in Counseling', 'LPC (Licensed Professional Counselor)', 'LMFT (Licensed Marriage and Family Therapist)',
        'LCSW (Licensed Clinical Social Worker)', 'CAC (Certified Addiction Counselor)'
    ];
    const specializationOptions = [
        'Anxiety Disorders', 'Depression', 'Trauma & PTSD', 'Couples Counseling', 'Grief & Loss',
        'Stress Management', 'ADHD', 'OCD', 'Eating Disorders', 'LGBTQ+ Affirmative Therapy',
        'Family Therapy', 'Child & Adolescent Therapy', 'Addiction Recovery', 'Anger Management'
    ];
    const approachOptions = [ // New options for approaches
        'Cognitive Behavioral Therapy (CBT)', 'Dialectical Behavior Therapy (DBT)', 'Psychodynamic Therapy',
        'Humanistic Therapy', 'Eye Movement Desensitization and Reprocessing (EMDR)', 'Family Systems Therapy',
        'Solution-Focused Brief Therapy (SFBT)', 'Mindfulness-Based Cognitive Therapy (MBCT)'
    ];
    const insuranceOptions = [ // New options for insurance
        'Aetna', 'Blue Cross Blue Shield', 'Cigna', 'UnitedHealthcare', 'Optum', 'Out-of-Network', 'Self-Pay Only'
    ];
    const sessionDurationOptions = ['30 minutes', '45 minutes', '50 minutes', '60 minutes', '75 minutes', '90 minutes'];
    const licenseTypes = [
        'Psychologist License', 'LCSW License', 'LMFT License', 'LPC License',
        'Psychiatrist License', 'Addiction Counselor License', 'Other'
    ];
    const countries = ['USA', 'Canada', 'UK', 'Australia', 'Pakistan', 'India', 'Germany', 'France', 'Other'];
    const usStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];
    // Add more states/provinces/regions as needed for other countries

    // Listen for auth state changes and fetch profile data
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUserId(user.uid);
                setLoading(true);
                setFetchError(null);
                try {
                    // *** IMPORTANT CHANGE: Fetch from 'users' collection ***
                    const docRef = doc(db, 'users', user.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setProfileData(prev => ({
                            ...prev,
                            ...data,
                            // Ensure arrays are initialized if missing from fetched data
                            qualification: data.qualification || [],
                            specializations: data.specializations || [],
                            approaches: data.approaches || [],
                            insuranceAccepted: data.insuranceAccepted || [], // Renamed here
                            availabilitySchedule: data.availabilitySchedule || [ // Fallback to default structure
                                { day: 'Monday', available: false, startTime: '', endTime: '' },
                                { day: 'Tuesday', available: false, startTime: '', endTime: '' },
                                { day: 'Wednesday', available: false, startTime: '', endTime: '' },
                                { day: 'Thursday', available: false, startTime: '', endTime: '' },
                                { day: 'Friday', available: false, startTime: '', endTime: '' },
                                { day: 'Saturday', available: false, startTime: '', endTime: '' },
                                { day: 'Sunday', available: false, startTime: '', endTime: '' },
                            ],
                            clinicalLocation: data.clinicalLocation || { address: '', city: '', state: '', zipCode: '', country: '' },
                            residentialAddress: data.residentialAddress || { address: '', city: '', state: '', zipCode: '', country: '' },
                            licenseDetails: data.licenseDetails || { licenseType: '', licenseNumber: '', issuingAuthority: '', expirationDate: '' },
                            licenseDocumentsUrls: data.licenseDocumentsUrls || [], // Existing uploaded document URLs
                            profilePhotoUrl: data.profilePhotoUrl || '', // Set preview from stored URL
                            // Ensure isPublic is correctly loaded
                            isPublic: data.isPublic || false,
                            // Ensure role is correctly loaded
                            role: data.role || 'therapist', // Default to therapist if not set
                        }));
                        console.log("Profile data loaded:", data);
                    } else {
                        console.log("No existing profile found for this therapist. Initializing with defaults.");
                        // If no existing user document, ensure role is therapist and isPublic is false by default
                        setProfileData(prev => ({
                            ...prev,
                            role: 'therapist',
                            isPublic: false,
                            createdAt: new Date(), // Set creation date for new profile
                        }));
                    }
                } catch (err) {
                    console.error("Error fetching therapist profile:", err);
                    setFetchError("Failed to load profile: " + err.message);
                } finally {
                    setLoading(false);
                }
            } else {
                setCurrentUserId(null);
                setLoading(false);
                setFetchError("Please log in to manage your profile.");
            }
        });
        return () => unsubscribeAuth();
    }, []);

    const handleChange = useCallback((e) => {
        const { name, value, type, files, dataset, checked } = e.target;
        let newErrors = { ...errors };

        if (type === 'file') {
            const file = files[0];
            if (name === 'profilePhoto' && file) {
                setProfileData(prev => ({
                    ...prev,
                    profilePhoto: file,
                    profilePhotoUrl: URL.createObjectURL(file) // For immediate preview
                }));
            } else if (name === 'licenseDocuments' && files) {
                // For licenseDocuments, we need to handle multiple files, potentially appending to existing ones
                setProfileData(prev => ({
                    ...prev,
                    licenseDocuments: Array.from(files) // Store File objects
                }));
            }
        } else if (dataset.fieldtype === 'multiselect') {
            const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
            setProfileData(prev => ({ ...prev, [name]: selectedOptions }));
        } else if (name.startsWith('availabilitySchedule')) {
            const [_, indexStr, field] = name.split('.');
            const index = parseInt(indexStr);
            const newSchedule = [...profileData.availabilitySchedule];
            if (field === 'available') {
                newSchedule[index].available = checked;
                if (!checked) { // Clear times if not available
                    newSchedule[index].startTime = '';
                    newSchedule[index].endTime = '';
                }
            } else {
                newSchedule[index][field] = value;
            }
            setProfileData(prev => ({ ...prev, availabilitySchedule: newSchedule }));
        } else if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setProfileData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value,
                },
            }));
        } else if (type === 'checkbox') { // For the isPublic checkbox
            setProfileData(prev => ({ ...prev, [name]: checked }));
        }
        else {
            setProfileData(prev => ({ ...prev, [name]: value }));
        }

        // Basic real-time validation
        if (name === 'personalEmail') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            newErrors.personalEmail = value && !emailRegex.test(value) ? 'Invalid email format' : '';
        } else if (name === 'personalPhoneNumber') {
            const phoneRegex = /^\+?[0-9]{7,15}$/;
            newErrors.personalPhoneNumber = value && !phoneRegex.test(value) ? 'Invalid phone number format (e.g., +1234567890)' : '';
        } else if (name === 'legalFullName') {
            newErrors.legalFullName = value.trim() === '' ? 'Legal full name is required' : '';
        } else if (name === 'yearsExperience') {
            const exp = parseInt(value);
            newErrors.yearsExperience = (isNaN(exp) || exp < 0) ? 'Years of experience must be a non-negative number' : '';
        }
        setErrors(newErrors);
    }, [profileData.availabilitySchedule, errors]); // Dependency array to prevent stale closure for errors

    const validateForm = useCallback(() => {
        let newErrors = {};
        let isValid = true;

        // Public Profile Validation
        if (!profileData.fullName.trim()) { newErrors.fullName = 'Professional name is required'; isValid = false; }
        if (!profileData.designation) { newErrors.designation = 'Designation is required'; isValid = false; }
        if (!profileData.yearsExperience || parseInt(profileData.yearsExperience) < 0) {
            newErrors.yearsExperience = 'Years of experience is required and must be a non-negative number'; isValid = false;
        }
        if (profileData.bio.length > 500) {
            newErrors.bio = `Bio exceeds maximum length of 500 characters (${profileData.bio.length})`; isValid = false;
        }
        if (profileData.specializations.length === 0) { newErrors.specializations = 'At least one specialization is required'; isValid = false; }

        // Availability validation
        profileData.availabilitySchedule.forEach((daySchedule, index) => {
            if (daySchedule.available) {
                if (!daySchedule.startTime || !daySchedule.endTime) {
                    newErrors[`availabilitySchedule.${index}.times`] = 'Start and End times are required for available days';
                    isValid = false;
                } else if (daySchedule.startTime >= daySchedule.endTime) {
                    newErrors[`availabilitySchedule.${index}.times`] = 'End time must be after Start time';
                    isValid = false;
                }
            }
        });

        // Private Information Validation
        if (!profileData.legalFullName.trim()) { newErrors.legalFullName = 'Full legal name is required for verification'; isValid = false; }
        if (!profileData.dateOfBirth) { newErrors.dateOfBirth = 'Date of birth is required'; isValid = false; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!profileData.personalEmail || !emailRegex.test(profileData.personalEmail)) { newErrors.personalEmail = 'A valid personal email is required'; isValid = false; }
        const phoneRegex = /^\+?[0-9]{7,15}$/;
        if (!profileData.personalPhoneNumber || !phoneRegex.test(profileData.personalPhoneNumber)) { newErrors.personalPhoneNumber = 'A valid personal phone number is required (e.g., +1234567890)'; isValid = false; }

        if (!profileData.residentialAddress.address || !profileData.residentialAddress.city ||
            !profileData.residentialAddress.state || !profileData.residentialAddress.zipCode ||
            !profileData.residentialAddress.country) {
            newErrors.residentialAddress = 'All residential address fields are required'; isValid = false;
        }

        if (!profileData.licenseDetails.licenseType || !profileData.licenseDetails.licenseNumber ||
            !profileData.licenseDetails.issuingAuthority || !profileData.licenseDetails.expirationDate) {
            newErrors.licenseDetails = 'All license details are required for verification'; isValid = false;
        } else {
            // Check if license expiration date is in the past
            const expirationDate = new Date(profileData.licenseDetails.expirationDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time for comparison
            if (expirationDate < today) {
                newErrors.licenseDetails = 'License expiration date cannot be in the past.';
                isValid = false;
            }
        }

        setErrors(newErrors);
        return isValid;
    }, [profileData]); // Dependency array for profileData changes

    const handleFileUpload = async (file, path) => {
        if (!file) return null;
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaveSuccess(false); // Reset success message
        if (!currentUserId) {
            setErrors(prev => ({ ...prev, form: "You must be logged in to save your profile." }));
            return;
        }

        if (validateForm()) {
            setSaving(true);
            setErrors({}); // Clear form errors before saving

            try {
                let updatedProfileData = { ...profileData };

                // Handle profile photo upload
                if (profileData.profilePhoto instanceof File) {
                    const photoPath = `therapist_photos/${currentUserId}/${profileData.profilePhoto.name}`;
                    updatedProfileData.profilePhotoUrl = await handleFileUpload(profileData.profilePhoto, photoPath);
                    delete updatedProfileData.profilePhoto; // Don't save File object to Firestore
                } else if (!profileData.profilePhotoUrl) {
                     // If no new photo and no existing URL, ensure it's empty
                     updatedProfileData.profilePhotoUrl = '';
                }

                // Handle license documents upload
                const newLicenseDocumentUrls = [];
                for (const file of profileData.licenseDocuments) {
                    if (file instanceof File) { // Only upload new File objects
                        const docPath = `therapist_license_docs/${currentUserId}/${file.name}`;
                        const url = await handleFileUpload(file, docPath);
                        if (url) newLicenseDocumentUrls.push(url);
                    }
                }
                // Combine new URLs with any existing ones (if you want to keep old ones)
                // Filter out any nulls/undefineds from newLicenseDocumentUrls
                updatedProfileData.licenseDocumentsUrls = [
                    ...(profileData.licenseDocumentsUrls || []), // Existing URLs
                    ...newLicenseDocumentUrls.filter(Boolean) // Filter out any failed uploads
                ];
                delete updatedProfileData.licenseDocuments; // Don't save File objects to Firestore


                // Clean up data for Firestore
                const dataToSave = {
                    ...updatedProfileData,
                    yearsExperience: parseInt(updatedProfileData.yearsExperience), // Ensure number type
                    // *** IMPORTANT ADDITIONS:
                    isPublic: true, // Automatically set to true when therapist saves their profile
                    role: 'therapist', // Ensure role is explicitly set for this document
                    // ***
                };

                // Remove temporary preview URL if it's not the actual stored URL
                // This is fine as profilePhotoUrl is updated with the actual download URL above
                delete dataToSave.profilePhotoPreview;

                // *** IMPORTANT CHANGE: Save to 'users' collection ***
                const docRef = doc(db, 'users', currentUserId);
                
                // If this is the very first time saving, set createdAt
                if (!profileData.createdAt) {
                    dataToSave.createdAt = new Date(); // Use client-side date for now; for production, consider serverTimestamp()
                }

                await setDoc(docRef, dataToSave, { merge: true }); // Use merge: true to avoid overwriting entire document

                console.log('Therapist Profile Saved to "users" collection:', dataToSave);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 5000); // Hide success message after 5 seconds

            } catch (err) {
                console.error('Error saving profile:', err);
                setErrors(prev => ({ ...prev, form: `Failed to save profile: ${err.message}` }));
            } finally {
                setSaving(false);
            }
        } else {
            console.error('Form validation failed', errors);
            setErrors(prev => ({ ...prev, form: "Please correct the errors in the form before saving." }));
        }
    };

    if (loading) {
        return <div className="loading-indicator">Loading profile...</div>;
    }

    if (fetchError) {
        return <div className="error-message">{fetchError}</div>;
    }

    return (
        <div className="manage-profile-container">
            <div className="profile-form-card">
                <h2>Manage My Profile</h2>
                <p className="form-description">Update your public-facing information and personal details.</p>

                {saveSuccess && <div className="success-message">Profile saved successfully! 🎉</div>}
                {errors.form && <div className="error-message">{errors.form}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Public Profile Information */}
                    <fieldset className="form-section">
                        <legend>Public Profile Information</legend>
                        <p className="section-description">This information will be visible to patients.</p>

                        <div className="form-group avatar-upload-group">
                            <label htmlFor="profilePhoto">Profile Photo:</label>
                            <div className="avatar-preview-area">
                                {profileData.profilePhotoUrl ? (
                                    <img src={profileData.profilePhotoUrl} alt="Profile Preview" className="profile-photo-preview" />
                                ) : (
                                    <div className="profile-photo-placeholder">No Photo</div>
                                )}
                                <input
                                    type="file"
                                    id="profilePhoto"
                                    name="profilePhoto"
                                    accept="image/*"
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="fullName">Full Name (Professional):</label>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                value={profileData.fullName}
                                onChange={handleChange}
                                required
                            />
                            {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="professionalTitle">Professional Title:</label>
                            <select
                                id="professionalTitle"
                                name="professionalTitle"
                                value={profileData.professionalTitle}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Title</option>
                                {professionalTitleOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="designation">Designation:</label>
                            <select
                                id="designation"
                                name="designation"
                                value={profileData.designation}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Designation</option>
                                {designationOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            {errors.designation && <span className="error-message">{errors.designation}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="gender">Gender:</label>
                            <select id="gender" name="gender" value={profileData.gender} onChange={handleChange}>
                                {genderOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="qualification">Qualification(s):</label>
                            <select
                                id="qualification"
                                name="qualification"
                                multiple
                                data-fieldtype="multiselect"
                                value={profileData.qualification}
                                onChange={handleChange}
                            >
                                <option value="">Select Qualification(s)</option>
                                {qualificationOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            <small>Hold Ctrl/Cmd to select multiple</small>
                            {profileData.qualification.length > 0 && (
                                <div className="selected-items-display">
                                    Selected:
                                    <ul>
                                        {profileData.qualification.map(q => <li key={q}>{q}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="specializations">Specializations/Areas of Expertise:</label>
                            <select
                                id="specializations"
                                name="specializations"
                                multiple
                                data-fieldtype="multiselect"
                                value={profileData.specializations}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Specialization(s)</option>
                                {specializationOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            <small>Hold Ctrl/Cmd to select multiple</small>
                            {profileData.specializations.length > 0 && (
                                <div className="selected-items-display">
                                    Selected:
                                    <ul>
                                        {profileData.specializations.map(s => <li key={s}>{s}</li>)}
                                    </ul>
                                </div>
                            )}
                            {errors.specializations && <span className="error-message">{errors.specializations}</span>}
                        </div>

                        {/* New fields for Approach and Insurance */}
                        <div className="form-group">
                            <label htmlFor="approaches">Therapeutic Approaches:</label>
                            <select
                                id="approaches"
                                name="approaches"
                                multiple
                                data-fieldtype="multiselect"
                                value={profileData.approaches}
                                onChange={handleChange}
                            >
                                <option value="">Select Approach(es)</option>
                                {approachOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            <small>Hold Ctrl/Cmd to select multiple</small>
                            {profileData.approaches.length > 0 && (
                                <div className="selected-items-display">
                                    Selected:
                                    <ul>
                                        {profileData.approaches.map(a => <li key={a}>{a}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="insuranceAccepted">Insurance Accepted:</label>
                            <select
                                id="insuranceAccepted" // Corrected ID to match state
                                name="insuranceAccepted" // Corrected name to match state
                                multiple
                                data-fieldtype="multiselect"
                                value={profileData.insuranceAccepted} // Corrected value to match state
                                onChange={handleChange}
                            >
                                <option value="">Select Insurance(s)</option>
                                {insuranceOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            <small>Hold Ctrl/Cmd to select multiple</small>
                            {profileData.insuranceAccepted.length > 0 && ( // Corrected here
                                <div className="selected-items-display">
                                    Selected:
                                    <ul>
                                        {profileData.insuranceAccepted.map(i => <li key={i}>{i}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                        {/* End New fields */}

                        <div className="form-group">
                            <label htmlFor="yearsExperience">Years of Experience:</label>
                            <input
                                type="number"
                                id="yearsExperience"
                                name="yearsExperience"
                                value={profileData.yearsExperience}
                                onChange={handleChange}
                                min="0"
                                max="70"
                                required
                            />
                            {errors.yearsExperience && <span className="error-message">{errors.yearsExperience}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="sessionDuration">Approximate Session Duration:</label>
                            <select
                                id="sessionDuration"
                                name="sessionDuration"
                                value={profileData.sessionDuration}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Duration</option>
                                {sessionDurationOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>General Availability:</label>
                            <small>Check the days you are generally available and specify your typical start and end times.</small>
                            <div className="availability-schedule">
                                {profileData.availabilitySchedule.map((daySchedule, index) => (
                                    <div key={daySchedule.day} className="availability-day">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                name={`availabilitySchedule.${index}.available`}
                                                checked={daySchedule.available}
                                                onChange={handleChange}
                                            />
                                            {daySchedule.day}
                                        </label>
                                        {daySchedule.available && (
                                            <div className="time-inputs">
                                                <input
                                                    type="time"
                                                    name={`availabilitySchedule.${index}.startTime`}
                                                    value={daySchedule.startTime}
                                                    onChange={handleChange}
                                                    required={daySchedule.available}
                                                />
                                                to
                                                <input
                                                    type="time"
                                                    name={`availabilitySchedule.${index}.endTime`}
                                                    value={daySchedule.endTime}
                                                    onChange={handleChange}
                                                    required={daySchedule.available}
                                                />
                                                {errors[`availabilitySchedule.${index}.times`] && (
                                                    <span className="error-message">{errors[`availabilitySchedule.${index}.times`]}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="clinicalLocation.address">Clinical Location Address:</label>
                            <input
                                type="text"
                                id="clinicalLocation.address"
                                name="clinicalLocation.address"
                                value={profileData.clinicalLocation.address}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group-inline">
                            <div className="form-group">
                                <label htmlFor="clinicalLocation.city">City:</label>
                                <input
                                    type="text"
                                    id="clinicalLocation.city"
                                    name="clinicalLocation.city"
                                    value={profileData.clinicalLocation.city}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="clinicalLocation.state">State/Province:</label>
                                <select
                                    id="clinicalLocation.state"
                                    name="clinicalLocation.state"
                                    value={profileData.clinicalLocation.state}
                                    onChange={handleChange}
                                >
                                    <option value="">Select State</option>
                                    {usStates.map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                    {/* Add logic for other countries' states/provinces */}
                                </select>
                            </div>
                        </div>
                        <div className="form-group-inline">
                            <div className="form-group">
                                <label htmlFor="clinicalLocation.zipCode">Zip Code:</label>
                                <input
                                    type="text"
                                    id="clinicalLocation.zipCode"
                                    name="clinicalLocation.zipCode"
                                    value={profileData.clinicalLocation.zipCode}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="clinicalLocation.country">Country:</label>
                                <select
                                    id="clinicalLocation.country"
                                    name="clinicalLocation.country"
                                    value={profileData.clinicalLocation.country}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Country</option>
                                    {countries.map(country => (
                                        <option key={country} value={country}>{country}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="bio">About Me (Bio):</label>
                            <textarea
                                id="bio"
                                name="bio"
                                value={profileData.bio}
                                onChange={handleChange}
                                maxLength="500"
                                rows="5"
                            ></textarea>
                            <small>{profileData.bio.length}/500 characters</small>
                            {errors.bio && <span className="error-message">{errors.bio}</span>}
                        </div>

                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    name="isPublic"
                                    checked={profileData.isPublic}
                                    onChange={handleChange}
                                />
                                Make my profile public (visible in 'Find a Therapist')
                            </label>
                            <small>By checking this, your public profile information will be visible to potential patients.</small>
                        </div>
                    </fieldset>

                    {/* Private/Internal Information */}
                    <fieldset className="form-section">
                        <legend>Private & Verification Information</legend>
                        <p className="section-description">This information is for verification and internal purposes only, not publicly displayed.</p>

                        <div className="form-group">
                            <label htmlFor="legalFullName">Legal Full Name:</label>
                            <input
                                type="text"
                                id="legalFullName"
                                name="legalFullName"
                                value={profileData.legalFullName}
                                onChange={handleChange}
                                required
                            />
                            {errors.legalFullName && <span className="error-message">{errors.legalFullName}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="dateOfBirth">Date of Birth:</label>
                            <input
                                type="date"
                                id="dateOfBirth"
                                name="dateOfBirth"
                                value={profileData.dateOfBirth}
                                onChange={handleChange}
                                required
                            />
                            {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="personalPhoneNumber">Personal Phone Number:</label>
                            <input
                                type="tel"
                                id="personalPhoneNumber"
                                name="personalPhoneNumber"
                                value={profileData.personalPhoneNumber}
                                onChange={handleChange}
                                placeholder="+1234567890"
                                required
                            />
                            {errors.personalPhoneNumber && <span className="error-message">{errors.personalPhoneNumber}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="personalEmail">Personal Email:</label>
                            <input
                                type="email"
                                id="personalEmail"
                                name="personalEmail"
                                value={profileData.personalEmail}
                                onChange={handleChange}
                                required
                            />
                            {errors.personalEmail && <span className="error-message">{errors.personalEmail}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="residentialAddress.address">Residential Address:</label>
                            <input
                                type="text"
                                id="residentialAddress.address"
                                name="residentialAddress.address"
                                value={profileData.residentialAddress.address}
                                onChange={handleChange}
                                required
                            />
                            {errors.residentialAddress && <span className="error-message">{errors.residentialAddress}</span>}
                        </div>
                        <div className="form-group-inline">
                            <div className="form-group">
                                <label htmlFor="residentialAddress.city">City:</label>
                                <input
                                    type="text"
                                    id="residentialAddress.city"
                                    name="residentialAddress.city"
                                    value={profileData.residentialAddress.city}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="residentialAddress.state">State/Province:</label>
                                <select
                                    id="residentialAddress.state"
                                    name="residentialAddress.state"
                                    value={profileData.residentialAddress.state}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select State</option>
                                    {usStates.map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-group-inline">
                            <div className="form-group">
                                <label htmlFor="residentialAddress.zipCode">Zip Code:</label>
                                <input
                                    type="text"
                                    id="residentialAddress.zipCode"
                                    name="residentialAddress.zipCode"
                                    value={profileData.residentialAddress.zipCode}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="residentialAddress.country">Country:</label>
                                <select
                                    id="residentialAddress.country"
                                    name="residentialAddress.country"
                                    value={profileData.residentialAddress.country}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Country</option>
                                    {countries.map(country => (
                                        <option key={country} value={country}>{country}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="licenseDetails.licenseType">License Type:</label>
                            <select
                                id="licenseDetails.licenseType"
                                name="licenseDetails.licenseType"
                                value={profileData.licenseDetails.licenseType}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select License Type</option>
                                {licenseTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            {errors.licenseDetails && <span className="error-message">{errors.licenseDetails}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="licenseDetails.licenseNumber">License Number:</label>
                            <input
                                type="text"
                                id="licenseDetails.licenseNumber"
                                name="licenseDetails.licenseNumber"
                                value={profileData.licenseDetails.licenseNumber}
                                onChange={handleChange}
                                required
                            />
                            {errors.licenseDetails && <span className="error-message">{errors.licenseDetails}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="licenseDetails.issuingAuthority">Issuing Authority:</label>
                            <input
                                type="text"
                                id="licenseDetails.issuingAuthority"
                                name="licenseDetails.issuingAuthority"
                                value={profileData.licenseDetails.issuingAuthority}
                                onChange={handleChange}
                                required
                            />
                            {errors.licenseDetails && <span className="error-message">{errors.licenseDetails}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="licenseDetails.expirationDate">License Expiration Date:</label>
                            <input
                                type="date"
                                id="licenseDetails.expirationDate"
                                name="licenseDetails.expirationDate"
                                value={profileData.licenseDetails.expirationDate}
                                onChange={handleChange}
                                required
                            />
                            {errors.licenseDetails && <span className="error-message">{errors.licenseDetails}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="licenseDocuments">Upload License Document(s):</label>
                            <input
                                type="file"
                                id="licenseDocuments"
                                name="licenseDocuments"
                                accept=".pdf,.doc,.docx,.jpg,.png"
                                multiple
                                onChange={handleChange}
                            />
                            <small>Max file size: 5MB. Accepted formats: PDF, DOCX, JPG, PNG.</small>
                            {profileData.licenseDocumentsUrls && profileData.licenseDocumentsUrls.length > 0 && (
                                <div className="uploaded-docs-display">
                                    Previously Uploaded:
                                    <ul>
                                        {profileData.licenseDocumentsUrls.map((url, index) => (
                                            <li key={index}><a href={url} target="_blank" rel="noopener noreferrer">Document {index + 1}</a></li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="emergencyContact.name">Emergency Contact Name:</label>
                            <input
                                type="text"
                                id="emergencyContact.name"
                                name="emergencyContact.name"
                                value={profileData.emergencyContact.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="emergencyContact.phoneNumber">Emergency Contact Phone:</label>
                            <input
                                type="tel"
                                id="emergencyContact.phoneNumber"
                                name="emergencyContact.phoneNumber"
                                value={profileData.emergencyContact.phoneNumber}
                                onChange={handleChange}
                                placeholder="+1234567890"
                            />
                        </div>

                    </fieldset>

                    <button type="submit" className="save-button" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TherapistManageProfile;