// src/pages/TherapistManageProfile.js
import React, { useState, useEffect } from 'react';
import './TherapistManageProfile.css';

const TherapistManageProfile = () => {
  const [profileData, setProfileData] = useState({
    // Public Profile Information
    profilePhoto: null,
    profilePhotoPreview: '',
    fullName: '',
    professionalTitle: '',
    designation: '',
    gender: '',
    qualification: [],
    specializations: [],
    yearsExperience: '',
    sessionDuration: '',
    availabilitySchedule: [ // Updated for structured availability
      { day: 'Monday', available: false, startTime: '', endTime: '' },
      { day: 'Tuesday', available: false, startTime: '', endTime: '' },
      { day: 'Wednesday', available: false, startTime: '', endTime: '' },
      { day: 'Thursday', available: false, startTime: '', endTime: '' },
      { day: 'Friday', available: false, startTime: '', endTime: '' },
      { day: 'Saturday', available: false, startTime: '', endTime: '' },
      { day: 'Sunday', available: false, startTime: '', endTime: '' },
    ],
    clinicalLocation: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    bio: '',

    // Private/Internal Information
    legalFullName: '',
    dateOfBirth: '',
    personalPhoneNumber: '',
    personalEmail: '',
    residentialAddress: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    licenseDetails: {
      licenseType: '',
      licenseNumber: '',
      issuingAuthority: '',
      expirationDate: '',
    },
    licenseDocuments: [],
    emergencyContact: {
      name: '',
      phoneNumber: '',
    },
  });

  const [errors, setErrors] = useState({});

  // Dummy data for select options (in a real app, these would come from an API)
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
  const sessionDurationOptions = ['30 minutes', '45 minutes', '50 minutes', '60 minutes', '75 minutes', '90 minutes'];
  const licenseTypes = [
    'Psychologist License', 'LCSW License', 'LMFT License', 'LPC License',
    'Psychiatrist License', 'Addiction Counselor License', 'Other'
  ];
  const countries = ['USA', 'Canada', 'UK', 'Australia', 'Pakistan', 'India', 'Germany', 'France', 'Other'];
  const usStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];
  // Add more states/provinces/regions as needed for other countries


  // Effect to load existing profile data (mocking an API call)
  useEffect(() => {
    const mockProfileData = {
      fullName: 'Dr. Evelyn Reed',
      professionalTitle: 'Dr.',
      designation: 'Licensed Clinical Psychologist',
      gender: 'Female',
      qualification: ['Ph.D. in Clinical Psychology'],
      specializations: ['Anxiety Disorders', 'Trauma & PTSD'],
      yearsExperience: '12',
      sessionDuration: '50 minutes',
      availabilitySchedule: [
        { day: 'Monday', available: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Tuesday', available: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Wednesday', available: false, startTime: '', endTime: '' },
        { day: 'Thursday', available: true, startTime: '10:00', endTime: '18:00' },
        { day: 'Friday', available: true, startTime: '09:00', endTime: '13:00' },
        { day: 'Saturday', available: false, startTime: '', endTime: '' },
        { day: 'Sunday', available: false, startTime: '', endTime: '' },
      ],
      clinicalLocation: {
        address: '123 Therapy Ave',
        city: 'Metropolis',
        state: 'CA',
        zipCode: '90210',
        country: 'USA',
      },
      profilePhotoPreview: '/images/default_therapist.png',
      bio: 'Dr. Reed specializes in cognitive behavioral therapy (CBT) for anxiety and trauma. She aims to provide a safe and supportive environment for her clients to explore their challenges and develop effective coping strategies, empowering them to lead more fulfilling lives.',

      legalFullName: 'Evelyn Sarah Reed',
      dateOfBirth: '1980-05-15',
      personalPhoneNumber: '555-123-4567',
      personalEmail: 'evelyn.reed.therapy@example.com',
      residentialAddress: {
        address: '456 Elm St',
        city: 'Suburbia',
        state: 'CA',
        zipCode: '90001',
        country: 'USA',
      },
      licenseDetails: {
        licenseType: 'Psychologist License',
        licenseNumber: 'PSY123456',
        issuingAuthority: 'California Board of Psychology',
        expirationDate: '2025-12-31',
      },
      licenseDocuments: [],
      emergencyContact: {
        name: 'John Doe',
        phoneNumber: '555-987-6543',
      },
    };
    setProfileData(mockProfileData);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, files, dataset, checked } = e.target;
    let newErrors = { ...errors }; // Create a mutable copy of errors

    if (type === 'file') {
      const file = files[0];
      if (name === 'profilePhoto' && file) {
        setProfileData(prev => ({
          ...prev,
          profilePhoto: file,
          profilePhotoPreview: URL.createObjectURL(file)
        }));
      } else if (name === 'licenseDocuments' && files) {
        setProfileData(prev => ({ ...prev, licenseDocuments: Array.from(files) }));
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
        // Clear times if not available
        if (!checked) {
          newSchedule[index].startTime = '';
          newSchedule[index].endTime = '';
        }
      } else {
        newSchedule[index][field] = value;
      }
      setProfileData(prev => ({ ...prev, availabilitySchedule: newSchedule }));
    }
     else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setProfileData(prev => ({ ...prev, [name]: value }));
    }

    // Basic real-time validation (can be expanded)
    if (name === 'personalEmail') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      newErrors.personalEmail = value && !emailRegex.test(value) ? 'Invalid email format' : '';
    } else if (name === 'personalPhoneNumber') {
        const phoneRegex = /^\+?[0-9]{7,15}$/; // Basic international phone regex
        newErrors.personalPhoneNumber = value && !phoneRegex.test(value) ? 'Invalid phone number format (e.g., +1234567890)' : '';
    } else if (name === 'legalFullName') {
        newErrors.legalFullName = value.trim() === '' ? 'Legal full name is required' : '';
    } else if (name === 'yearsExperience') {
        newErrors.yearsExperience = value < 0 ? 'Years of experience cannot be negative' : '';
    }
    // More real-time validation can be added here for other fields

    setErrors(newErrors);
  };


  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    // Public Profile Validation
    if (!profileData.fullName.trim()) { newErrors.fullName = 'Professional name is required'; isValid = false; }
    if (!profileData.yearsExperience || parseInt(profileData.yearsExperience) < 0) {
      newErrors.yearsExperience = 'Years of experience is required and must be a non-negative number'; isValid = false;
    }
    if (profileData.bio.length > 500) { // Example max length for bio
        newErrors.bio = `Bio exceeds maximum length of 500 characters (${profileData.bio.length})`; isValid = false;
    }

    // Availability validation (basic)
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
    const phoneRegex = /^\+?[0-9]{7,15}$/; // Basic international phone regex
    if (!profileData.personalPhoneNumber || !phoneRegex.test(profileData.personalPhoneNumber)) { newErrors.personalPhoneNumber = 'A valid personal phone number is required (e.g., +1234567890)'; isValid = false; }

    if (!profileData.residentialAddress.address || !profileData.residentialAddress.city ||
        !profileData.residentialAddress.state || !profileData.residentialAddress.zipCode ||
        !profileData.residentialAddress.country) {
      newErrors.residentialAddress = 'All residential address fields are required'; isValid = false;
    }

    if (!profileData.licenseDetails.licenseType || !profileData.licenseDetails.licenseNumber ||
        !profileData.licenseDetails.issuingAuthority || !profileData.licenseDetails.expirationDate) {
      newErrors.licenseDetails = 'All license details are required for verification'; isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Saving Therapist Profile Data:', profileData);
      alert('Profile saved successfully! (Check console for data)');
      // In a real application, you would send profileData to your backend API
      // Example: axios.post('/api/therapist/profile', profileData)
    } else {
      console.error('Form validation failed', errors);
      alert('Please correct the errors in the form.');
    }
  };

  return (
    <div className="manage-profile-container">
      <div className="profile-form-card">
        <h2>Manage My Profile</h2>
        <p className="form-description">Update your public-facing information and personal details.</p>

        <form onSubmit={handleSubmit}>
          {/* Public Profile Information */}
          <fieldset className="form-section">
            <legend>Public Profile Information</legend>
            <p className="section-description">This information will be visible to patients.</p>

            <div className="form-group avatar-upload-group">
              <label htmlFor="profilePhoto">Profile Photo:</label>
              <div className="avatar-preview-area">
                {profileData.profilePhotoPreview ? (
                  <img src={profileData.profilePhotoPreview} alt="Profile Preview" className="profile-photo-preview" />
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
              >
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
                max="70" // Reasonable max
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
                  <div key={daySchedule.day} className="availability-day-row">
                    <input
                      type="checkbox"
                      id={`day-${daySchedule.day}`}
                      name={`availabilitySchedule.${index}.available`}
                      checked={daySchedule.available}
                      onChange={handleChange}
                    />
                    <label htmlFor={`day-${daySchedule.day}`}>{daySchedule.day}</label>
                    {daySchedule.available && (
                      <div className="time-inputs">
                        <input
                          type="time"
                          name={`availabilitySchedule.${index}.startTime`}
                          value={daySchedule.startTime}
                          onChange={handleChange}
                          required
                        />
                        <span> - </span>
                        <input
                          type="time"
                          name={`availabilitySchedule.${index}.endTime`}
                          value={daySchedule.endTime}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    )}
                  </div>
                ))}
                {errors.availabilitySchedule && <span className="error-message">{errors.availabilitySchedule}</span>}
                {Object.keys(errors).filter(key => key.startsWith('availabilitySchedule.') && key.endsWith('.times')).map(key => (
                    <span key={key} className="error-message">{errors[key]}</span>
                ))}
              </div>
            </div>

            <div className="form-group address-group">
              <label>Clinical Location (Optional - if you offer in-person sessions):</label>
              <input
                type="text"
                name="clinicalLocation.address"
                value={profileData.clinicalLocation.address}
                onChange={handleChange}
                placeholder="Street Address, Apt/Suite #"
              />
              <input
                type="text"
                name="clinicalLocation.city"
                value={profileData.clinicalLocation.city}
                onChange={handleChange}
                placeholder="City"
              />
              <input
                type="text"
                name="clinicalLocation.state"
                value={profileData.clinicalLocation.state}
                onChange={handleChange}
                placeholder="State/Province"
              />
              <input
                type="text"
                name="clinicalLocation.zipCode"
                value={profileData.clinicalLocation.zipCode}
                onChange={handleChange}
                placeholder="Zip/Postal Code"
              />
              <select
                name="clinicalLocation.country"
                value={profileData.clinicalLocation.country}
                onChange={handleChange}
              >
                <option value="">Select Country</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="bio">About Me / Biography:</label>
              <textarea
                id="bio"
                name="bio"
                value={profileData.bio}
                onChange={handleChange}
                rows="5"
                maxLength="500" // Example max length
                placeholder="Write a brief introduction about your therapeutic approach, philosophy, and what you help with (max 500 characters)."
              ></textarea>
              <small>{profileData.bio.length} / 500 characters</small>
              {errors.bio && <span className="error-message">{errors.bio}</span>}
            </div>

          </fieldset>

          {/* Private/Internal Information */}
          <fieldset className="form-section private-section">
            <legend>Private/Internal Information</legend>
            <p className="section-description">This information is for platform use only and not visible to patients. It's crucial for verification and payments.</p>

            <div className="form-group">
              <label htmlFor="legalFullName">Full Legal Name:</label>
              <input
                type="text"
                id="legalFullName"
                name="legalFullName"
                value={profileData.legalFullName}
                onChange={handleChange}
                placeholder="As it appears on your legal documents (e.g., license, ID)"
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
                max={new Date().toISOString().split('T')[0]} // Cannot be a future date
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
                placeholder="e.g., +1 (555) 123-4567 or 03XX-XXXXXXX"
                pattern="^\+?[0-9]{7,15}$" // Basic pattern for 7-15 digits, optional +
                required
              />
              <small>Used for urgent platform communications.</small>
              {errors.personalPhoneNumber && <span className="error-message">{errors.personalPhoneNumber}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="personalEmail">Personal Email Address:</label>
              <input
                type="email"
                id="personalEmail"
                name="personalEmail"
                value={profileData.personalEmail}
                onChange={handleChange}
                placeholder="e.g., yourname@example.com"
                required
              />
              <small>Used for account-related notifications.</small>
              {errors.personalEmail && <span className="error-message">{errors.personalEmail}</span>}
            </div>

            <div className="form-group address-group">
              <label>Residential Address:</label>
              <small>Your home address for verification and official communications (not visible to patients).</small>
              <input
                type="text"
                name="residentialAddress.address"
                value={profileData.residentialAddress.address}
                onChange={handleChange}
                placeholder="Street Address, Apt/Suite #"
                required
              />
              <input
                type="text"
                name="residentialAddress.city"
                value={profileData.residentialAddress.city}
                onChange={handleChange}
                placeholder="City"
                required
              />
              <input
                type="text"
                name="residentialAddress.state"
                value={profileData.residentialAddress.state}
                onChange={handleChange}
                placeholder="State/Province"
                required
              />
              <input
                type="text"
                name="residentialAddress.zipCode"
                value={profileData.residentialAddress.zipCode}
                onChange={handleChange}
                placeholder="Zip/Postal Code"
                required
              />
              <select
                name="residentialAddress.country"
                value={profileData.residentialAddress.country}
                onChange={handleChange}
                required
              >
                <option value="">Select Country</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.residentialAddress && <span className="error-message">{errors.residentialAddress}</span>}
            </div>

            <div className="form-group">
              <label>License Information:</label>
              <small>Provide your professional license details for verification by the platform.</small>
              <select
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
              <input
                type="text"
                name="licenseDetails.licenseNumber"
                value={profileData.licenseDetails.licenseNumber}
                onChange={handleChange}
                placeholder="License Number (e.g., 123456-ABC)"
                pattern="^[a-zA-Z0-9-]{5,20}$" // Example: 5-20 alphanumeric, hyphens allowed
                required
              />
              <input
                type="text"
                name="licenseDetails.issuingAuthority"
                value={profileData.licenseDetails.issuingAuthority}
                onChange={handleChange}
                placeholder="Issuing Authority/Board (e.g., California Board of Psychology)"
                required
              />
              <label htmlFor="licenseDetails.expirationDate">Expiration Date:</label>
              <input
                type="date"
                id="licenseDetails.expirationDate"
                name="licenseDetails.expirationDate"
                value={profileData.licenseDetails.expirationDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]} // Cannot be a past date for expiration
                required
              />
              {errors.licenseDetails && <span className="error-message">{errors.licenseDetails}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="licenseDocuments">Upload License Documents:</label>
              <input
                type="file"
                id="licenseDocuments"
                name="licenseDocuments"
                accept=".pdf, .jpg, .png"
                multiple
                onChange={handleChange}
              />
              <small>Upload scanned copies of your official licenses or certifications (PDF, JPG, PNG).</small>
              {profileData.licenseDocuments.length > 0 && (
                <div className="uploaded-files-preview">
                  <p>Uploaded Files:</p>
                  <ul>
                    {profileData.licenseDocuments.map((file, index) => (
                      <li key={file.name || index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Emergency Contact Information:</label>
              <small>Person to contact in case of an emergency (not visible to patients).</small>
              <input
                type="text"
                name="emergencyContact.name"
                value={profileData.emergencyContact.name}
                onChange={handleChange}
                placeholder="Contact Name"
              />
              <input
                type="tel"
                name="emergencyContact.phoneNumber"
                value={profileData.emergencyContact.phoneNumber}
                onChange={handleChange}
                placeholder="Contact Phone Number"
              />
            </div>
          </fieldset>

          <div className="form-actions">
            <button type="submit" className="save-button">Save Changes</button>
            <button type="button" className="cancel-button" onClick={() => console.log('Cancelled')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TherapistManageProfile;