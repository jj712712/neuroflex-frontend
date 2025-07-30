// src/pages/TherapistManageProfile.js
import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

// Import React Datepicker and its CSS
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import enUS from 'date-fns/locale/en-US'; // Import locale for date-fns

import './TherapistManageProfile.css'; // Your custom CSS

// Register the locale for react-datepicker
registerLocale('en-US', enUS);

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
        insuranceAccepted: [],

        // Private/Internal Information
        legalFullName: '',
        dateOfBirth: '', // Stored as YYYY-MM-DD string
        personalPhoneNumber: '',
        personalEmail: '',
        residentialAddress: {
            address: '', city: '', state: '', zipCode: '', country: '',
        },
        licenseDetails: {
            licenseType: '', licenseNumber: '', issuingAuthority: '', expirationDate: '', // Stored as YYYY-MM-DD string
        },
        licenseDocuments: [], // To hold File objects before upload
        licenseDocumentsUrls: [], // To store URLs from Firebase Storage
        emergencyContact: {
            name: '', phoneNumber: '',
        },
        role: 'therapist',
        createdAt: null,
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [fetchError, setFetchError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [formErrorSummary, setFormErrorSummary] = useState('');

    // Helper to get initials for placeholder
    const getInitials = useCallback((fullName) => {
        if (!fullName) return '';
        const names = fullName.split(' ').filter(n => n);
        if (names.length === 0) return '';
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    }, []);

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
    const approachOptions = [
        'Cognitive Behavioral Therapy (CBT)', 'Dialectical Behavior Therapy (DBT)', 'Psychodynamic Therapy',
        'Humanistic Therapy', 'Eye Movement Desensitization and Reprocessing (EMDR)', 'Family Systems Therapy',
        'Solution-Focused Brief Therapy (SFBT)', 'Mindfulness-Based Cognitive Therapy (MBCT)'
    ];
    const insuranceOptions = [
        'Aetna', 'Blue Cross Blue Shield', 'Cigna', 'UnitedHealthcare', 'Optum', 'Out-of-Network', 'Self-Pay Only'
    ];
    const sessionDurationOptions = ['30 minutes', '45 minutes', '50 minutes', '60 minutes', '75 minutes', '90 minutes'];
    const licenseTypes = [
        'Psychologist License', 'LCSW License', 'LMFT License', 'LPC License',
        'Psychiatrist License', 'Addiction Counselor License', 'Other'
    ];
    const countries = ['USA', 'Canada', 'UK', 'Australia', 'Pakistan', 'India', 'Germany', 'France', 'Other'];
    const usStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];

    // Effect to listen for auth state changes and fetch profile data
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUserId(user.uid);
                setLoading(true);
                setFetchError(null);
                try {
                    const docRef = doc(db, 'users', user.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setProfileData(prev => ({
                            ...prev,
                            ...data,
                            qualification: data.qualification || [],
                            specializations: data.specializations || [],
                            approaches: data.approaches || [],
                            insuranceAccepted: data.insuranceAccepted || [],
                            availabilitySchedule: data.availabilitySchedule || [
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
                            licenseDocumentsUrls: data.licenseDocumentsUrls || [],
                            profilePhotoUrl: data.profilePhotoUrl || '',
                            isPublic: data.isPublic || false,
                            role: data.role || 'therapist',
                            // Ensure date strings are loaded correctly for DatePicker to convert
                            dateOfBirth: data.dateOfBirth || '',
                            licenseDetails: {
                                ...data.licenseDetails,
                                expirationDate: data.licenseDetails?.expirationDate || ''
                            }
                        }));
                        console.log("Profile data loaded:", data);
                    } else {
                        console.log("No existing profile found for this therapist. Initializing with defaults.");
                        setProfileData(prev => ({
                            ...prev,
                            role: 'therapist',
                            isPublic: false,
                            createdAt: null, // Will be set by serverTimestamp on first save
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
    }, []); // 'auth' and 'db' are stable references from firebaseConfig, no need to include in deps

    // General change handler for most form inputs
    const handleChange = useCallback((e) => {
        const { name, value, type, files, dataset, checked } = e.target;
        let newErrors = { ...errors };
        setFormErrorSummary(''); // Clear form summary error on any change

        if (type === 'file') {
            const file = files[0];
            if (name === 'profilePhoto' && file) {
                setProfileData(prev => ({
                    ...prev,
                    profilePhoto: file,
                    profilePhotoUrl: URL.createObjectURL(file) // For immediate preview
                }));
            } else if (name === 'licenseDocuments' && files) {
                setProfileData(prev => ({
                    ...prev,
                    licenseDocuments: Array.from(files) // Store File objects
                }));
            }
        } else if (dataset.fieldtype === 'multiselect') {
            const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
            setProfileData(prev => ({ ...prev, [name]: selectedOptions }));
            if (newErrors[name] && selectedOptions.length > 0) {
                newErrors[name] = '';
            }
        } else if (name.startsWith('availabilitySchedule')) {
            const [_, indexStr, field] = name.split('.');
            const index = parseInt(indexStr);
            const newSchedule = [...profileData.availabilitySchedule];
            if (field === 'available') {
                newSchedule[index].available = checked;
                if (!checked) { // Clear times if not available
                    newSchedule[index].startTime = '';
                    newSchedule[index].endTime = '';
                    if (newErrors[`availabilitySchedule.${index}.times`]) {
                        delete newErrors[`availabilitySchedule.${index}.times`];
                    }
                }
            } else {
                newSchedule[index][field] = value;
                // Basic time validation on change
                if (newSchedule[index].startTime && newSchedule[index].endTime && newSchedule[index].startTime >= newSchedule[index].endTime) {
                    newErrors[`availabilitySchedule.${index}.times`] = 'End time must be after Start time';
                } else {
                    delete newErrors[`availabilitySchedule.${index}.times`];
                }
            }
            setProfileData(prev => ({ ...prev, availabilitySchedule: newSchedule }));
        } else if (name.includes('.')) {
            // Handle nested objects like clinicalLocation, residentialAddress, licenseDetails, emergencyContact
            const [parent, child] = name.split('.');
            setProfileData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value,
                },
            }));
            // Clear error for nested fields if value is present
            if (newErrors[parent] && value.trim() !== '') {
                let allSubFieldsFilled = true;
                const currentParentData = { ...profileData[parent], [child]: value }; // Use updated value
                let fieldsToCheck = [];
                if (parent === 'clinicalLocation' || parent === 'residentialAddress') {
                    fieldsToCheck = ['address', 'city', 'state', 'zipCode', 'country'];
                } else if (parent === 'licenseDetails') {
                    fieldsToCheck = ['licenseType', 'licenseNumber', 'issuingAuthority', 'expirationDate'];
                }
                for (const f of fieldsToCheck) {
                    if (!currentParentData[f] || String(currentParentData[f]).trim() === '') {
                        allSubFieldsFilled = false;
                        break;
                    }
                }
                if (allSubFieldsFilled) {
                    newErrors[parent] = '';
                }
            }
        } else if (type === 'checkbox') {
            setProfileData(prev => ({ ...prev, [name]: checked }));
        } else {
            setProfileData(prev => ({ ...prev, [name]: value }));
        }

        // Basic real-time validation for top-level fields
        if (name === 'personalEmail') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            newErrors.personalEmail = value && !emailRegex.test(value) ? 'Invalid email format' : '';
        } else if (name === 'personalPhoneNumber') {
            const phoneRegex = /^\+?[0-9]{7,15}$/;
            newErrors.personalPhoneNumber = value && !phoneRegex.test(value) ? 'Invalid phone number format (e.g., +1234567890)' : '';
        } else if (name === 'legalFullName') {
            newErrors.legalFullName = value.trim() === '' ? 'Legal full name is required' : '';
        } else if (name === 'fullName') {
            newErrors.fullName = value.trim() === '' ? 'Professional name is required' : '';
        } else if (name === 'designation') {
            newErrors.designation = value.trim() === '' ? 'Designation is required' : '';
        } else if (name === 'yearsExperience') {
            const exp = parseInt(value);
            newErrors.yearsExperience = (isNaN(exp) || exp < 0) ? 'Years of experience must be a non-negative number' : '';
        } else if (name === 'bio') {
            newErrors.bio = value.length > 500 ? `Bio exceeds maximum length of 500 characters (${value.length})` : '';
        }

        setErrors(newErrors);
    }, [profileData, errors]); // Added profileData to dependencies for accurate nested object validation

    // Handle DatePicker specific changes
    const handleDateChange = useCallback((date, name) => {
        let newErrors = { ...errors };
        setFormErrorSummary('');

        setProfileData(prev => {
            if (name.includes('.')) {
                const [parent, child] = name.split('.');
                return {
                    ...prev,
                    [parent]: {
                        ...prev[parent],
                        [child]: date ? date.toISOString().split('T')[0] : '', // Store as YYYY-MM-DD string
                    },
                };
            }
            return {
                ...prev,
                [name]: date ? date.toISOString().split('T')[0] : '', // Store as YYYY-MM-DD string
            };
        });

        // Basic date validation
        if (name === 'dateOfBirth') {
            newErrors.dateOfBirth = date === null ? 'Date of birth is required' : '';
        } else if (name === 'licenseDetails.expirationDate') {
            newErrors.licenseDetails = date === null ? 'License expiration date is required' : '';
            if (date && date < new Date()) {
                newErrors.licenseDetails = 'License expiration date cannot be in the past.';
            }
        }
        setErrors(newErrors);
    }, [errors]);

    const validateForm = useCallback(() => {
        let newErrors = {};
        let isValid = true;
        let validationMessages = [];

        // Public Profile Validation
        if (!profileData.fullName.trim()) { newErrors.fullName = 'Professional name is required'; isValid = false; validationMessages.push('Professional name is required.'); }
        if (!profileData.designation) { newErrors.designation = 'Designation is required'; isValid = false; validationMessages.push('Designation is required.'); }
        if (profileData.specializations.length === 0) { newErrors.specializations = 'At least one specialization is required'; isValid = false; validationMessages.push('At least one specialization is required.'); }
        if (!profileData.yearsExperience || parseInt(profileData.yearsExperience) < 0) {
            newErrors.yearsExperience = 'Years of experience is required and must be a non-negative number'; isValid = false; validationMessages.push('Years of experience must be a non-negative number.');
        }
        if (profileData.bio.length > 500) {
            newErrors.bio = `Bio exceeds maximum length of 500 characters (${profileData.bio.length})`; isValid = false; validationMessages.push('Bio exceeds maximum length of 500 characters.');
        }

        // Availability validation
        profileData.availabilitySchedule.forEach((daySchedule, index) => {
            if (daySchedule.available) {
                if (!daySchedule.startTime || !daySchedule.endTime) {
                    newErrors[`availabilitySchedule.${index}.times`] = 'Start and End times are required for available days';
                    isValid = false;
                    validationMessages.push(`Start and End times are required for ${daySchedule.day}.`);
                } else if (daySchedule.startTime >= daySchedule.endTime) {
                    newErrors[`availabilitySchedule.${index}.times`] = 'End time must be after Start time';
                    isValid = false;
                    validationMessages.push(`End time must be after Start time for ${daySchedule.day}.`);
                }
            }
        });

        // Private Information Validation
        if (!profileData.legalFullName.trim()) { newErrors.legalFullName = 'Full legal name is required for verification'; isValid = false; validationMessages.push('Full legal name is required for verification.'); }
        if (!profileData.dateOfBirth) { newErrors.dateOfBirth = 'Date of birth is required'; isValid = false; validationMessages.push('Date of birth is required.'); }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!profileData.personalEmail || !emailRegex.test(profileData.personalEmail)) { newErrors.personalEmail = 'A valid personal email is required'; isValid = false; validationMessages.push('A valid personal email is required.'); }
        const phoneRegex = /^\+?[0-9]{7,15}$/;
        if (!profileData.personalPhoneNumber || !phoneRegex.test(profileData.personalPhoneNumber)) { newErrors.personalPhoneNumber = 'A valid personal phone number is required (e.g., +1234567890)'; isValid = false; validationMessages.push('A valid personal phone number is required (e.g., +1234567890).'); }

        // Validate residential address
        if (!profileData.residentialAddress.address || !profileData.residentialAddress.city ||
            !profileData.residentialAddress.state || !profileData.residentialAddress.zipCode ||
            !profileData.residentialAddress.country) {
            newErrors.residentialAddress = 'All residential address fields are required'; isValid = false; validationMessages.push('All residential address fields are required.');
        }

        // Validate license details
        if (!profileData.licenseDetails.licenseType || !profileData.licenseDetails.licenseNumber ||
            !profileData.licenseDetails.issuingAuthority || !profileData.licenseDetails.expirationDate) {
            newErrors.licenseDetails = 'All license details are required for verification'; isValid = false; validationMessages.push('All license details are required for verification.');
        } else {
            const expirationDate = new Date(profileData.licenseDetails.expirationDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (expirationDate < today) {
                newErrors.licenseDetails = 'License expiration date cannot be in the past.';
                isValid = false;
                validationMessages.push('License expiration date cannot be in the past.');
            }
        }

        setErrors(newErrors);
        if (!isValid) {
            setFormErrorSummary("Please correct the following issues:\n" + validationMessages.map(msg => `- ${msg}`).join('\n'));
        } else {
            setFormErrorSummary('');
        }
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
        setSaveSuccess(false);
        setFormErrorSummary('');

        if (!currentUserId) {
            setFormErrorSummary("You must be logged in to save your profile.");
            return;
        }

        if (validateForm()) {
            setSaving(true);
            setErrors({});

            try {
                let updatedProfileData = { ...profileData };

                // Handle profile photo upload
                if (profileData.profilePhoto instanceof File) {
                    const photoPath = `therapist_photos/${currentUserId}/${profileData.profilePhoto.name}`;
                    updatedProfileData.profilePhotoUrl = await handleFileUpload(profileData.profilePhoto, photoPath);
                } else if (!profileData.profilePhotoUrl) {
                    updatedProfileData.profilePhotoUrl = '';
                }

                // Handle license documents upload
                const newLicenseDocumentUrls = [];
                for (const file of profileData.licenseDocuments) {
                    if (file instanceof File) {
                        const docPath = `therapist_license_docs/${currentUserId}/${file.name}`;
                        const url = await handleFileUpload(file, docPath);
                        if (url) newLicenseDocumentUrls.push(url);
                    }
                }
                updatedProfileData.licenseDocumentsUrls = [
                    ...(profileData.licenseDocumentsUrls || []),
                    ...newLicenseDocumentUrls.filter(Boolean)
                ];

                // Prepare data for Firestore
                const dataToSave = {
                    ...updatedProfileData,
                    yearsExperience: parseInt(updatedProfileData.yearsExperience),
                    isPublic: true, // Automatically set to true when therapist saves their profile
                    role: 'therapist',
                };

                // Remove File objects from data to save to Firestore
                delete dataToSave.profilePhoto;
                delete dataToSave.licenseDocuments;

                const docRef = doc(db, 'users', currentUserId);

                // Check if createdAt exists, if not, set it using serverTimestamp
                const docSnap = await getDoc(docRef);
                if (!docSnap.exists() || !docSnap.data().createdAt) {
                    dataToSave.createdAt = serverTimestamp();
                } else {
                    // If createdAt already exists, keep its original value
                    dataToSave.createdAt = docSnap.data().createdAt;
                }

                await setDoc(docRef, dataToSave, { merge: true });

                console.log('Therapist Profile Saved to "users" collection:', dataToSave);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 5000);

            } catch (err) {
                console.error('Error saving profile:', err);
                setFormErrorSummary(`Failed to save profile: ${err.message}`);
            } finally {
                setSaving(false);
            }
        } else {
            console.error('Form validation failed', errors);
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
                {formErrorSummary && <div className="error-message form-summary">{formErrorSummary}</div>}

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
                                    <div className="profile-photo-placeholder">
                                        {profileData.fullName ? getInitials(profileData.fullName) : 'N/A'}
                                    </div>
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
                                id="insuranceAccepted"
                                name="insuranceAccepted"
                                multiple
                                data-fieldtype="multiselect"
                                value={profileData.insuranceAccepted}
                                onChange={handleChange}
                            >
                                <option value="">Select Insurance(s)</option>
                                {insuranceOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            <small>Hold Ctrl/Cmd to select multiple</small>
                            {profileData.insuranceAccepted.length > 0 && (
                                <div className="selected-items-display">
                                    Selected:
                                    <ul>
                                        {profileData.insuranceAccepted.map(i => <li key={i}>{i}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>

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
                                    {profileData.clinicalLocation.country === 'USA' && usStates.map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                    {/* Add logic for other countries' states/provinces if applicable */}
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
                            <DatePicker
                                selected={profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : null}
                                onChange={(date) => handleDateChange(date, 'dateOfBirth')}
                                dateFormat="yyyy-MM-dd"
                                className="form-control" // Apply existing input styles
                                locale="en-US"
                                placeholderText="Select Date of Birth"
                                showYearDropdown
                                scrollableYearDropdown
                                yearDropdownItemNumber={15}
                                maxDate={new Date()} // Cannot select a future date
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
                                    {profileData.residentialAddress.country === 'USA' && usStates.map(state => (
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
                            <DatePicker
                                selected={profileData.licenseDetails.expirationDate ? new Date(profileData.licenseDetails.expirationDate) : null}
                                onChange={(date) => handleDateChange(date, 'licenseDetails.expirationDate')}
                                dateFormat="yyyy-MM-dd"
                                className="form-control" // Apply existing input styles
                                locale="en-US"
                                placeholderText="Select Expiration Date"
                                showYearDropdown
                                scrollableYearDropdown
                                yearDropdownItemNumber={15}
                                minDate={new Date()} // Cannot select a past date for expiration
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
