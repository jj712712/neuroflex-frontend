import React, { useState, useEffect, useCallback } from 'react';
import './FindTherapist.css';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Import your Firestore instance

const FindTherapist = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSpecialization, setSelectedSpecialization] = useState('');
    const [selectedApproach, setSelectedApproach] = useState('');
    const [selectedInsurance, setSelectedInsurance] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [therapists, setTherapists] = useState([]);
    const [specializations, setSpecializations] = useState([]);
    const [approaches, setApproaches] = useState([]);
    const [insurances, setInsurances] = useState([]);

    // Helper to get initials for placeholder
    const getInitials = useCallback((fullName) => {
        if (!fullName) return '';
        const names = fullName.split(' ').filter(n => n); // Split by space and remove empty strings
        if (names.length === 0) return '';
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    }, []);

    const handleSearchChange = useCallback((e) => {
        setSearchQuery(e.target.value);
    }, []);

    const handleSpecializationChange = useCallback((e) => {
        setSelectedSpecialization(e.target.value);
    }, []);

    const handleApproachChange = useCallback((e) => {
        setSelectedApproach(e.target.value);
    }, []);

    const handleInsuranceChange = useCallback((e) => {
        setSelectedInsurance(e.target.value);
    }, []);

    const handleSortChange = useCallback((e) => {
        setSortBy(e.target.value);
    }, []);

    useEffect(() => {
        const fetchTherapistDataFromFirestore = async () => {
            setLoading(true);
            setError(null);
            try {
                const usersRef = collection(db, 'users');
                const q = query(
                    usersRef,
                    where('role', '==', 'therapist'),
                    where('isPublic', '==', true)
                );
                const querySnapshot = await getDocs(q);

                const therapistData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setTherapists(therapistData);

                // Extract unique options for filters
                const uniqueSpecializations = [...new Set(therapistData.flatMap(t => t.specializations || []))]
                    .filter(Boolean)
                    .sort();
                const uniqueApproaches = [...new Set(therapistData.flatMap(t => t.approaches || []))]
                    .filter(Boolean)
                    .sort();
                const uniqueInsurances = [...new Set(therapistData.flatMap(t => t.insuranceAccepted || []))]
                    .filter(Boolean)
                    .sort();

                setSpecializations(uniqueSpecializations);
                setApproaches(uniqueApproaches);
                setInsurances(uniqueInsurances);

            } catch (err) {
                console.error('Error fetching therapists:', err);
                setError('Failed to load therapists. ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTherapistDataFromFirestore();
    }, []); // 'db' is a stable reference, no need to include in dependencies

    const filteredTherapists = therapists.filter(therapist => {
        const nameMatch = therapist.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
        const specializationMatch = selectedSpecialization === '' || (therapist.specializations && therapist.specializations.includes(selectedSpecialization));
        const approachMatch = selectedApproach === '' || (therapist.approaches && therapist.approaches.includes(selectedApproach));
        const insuranceMatch = selectedInsurance === '' || (therapist.insuranceAccepted && therapist.insuranceAccepted.includes(selectedInsurance));
        return nameMatch && specializationMatch && approachMatch && insuranceMatch;
    });

    const sortedTherapists = [...filteredTherapists].sort((a, b) => {
        if (sortBy === 'name') {
            return (a.fullName || '').localeCompare(b.fullName || '');
        } else if (sortBy === 'rating') {
            return (b.averageRating || 0) - (a.averageRating || 0);
        } else if (sortBy === 'experience') {
            return (b.yearsExperience || 0) - (a.yearsExperience || 0);
        }
        return 0;
    });

    const formatAvailability = (schedule) => {
        if (!schedule || schedule.length === 0) return 'Not specified';

        return schedule
            .filter(day => day.available)
            .map(day => `${day.day.substring(0, 3)} (${day.startTime}-${day.endTime})`)
            .join(', ');
    };

    if (loading) {
        return <div className="loading-indicator">Loading therapists...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="find-therapist-container">
            <h1>Find a Therapist</h1>

            <div className="filter-section">
                <div className="filter-group">
                    <label htmlFor="search-name" className="sr-only">Search by name</label>
                    <input
                        type="text"
                        id="search-name"
                        placeholder="Search by name"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="filter-input"
                    />
                </div>
                <div className="filter-group">
                    <label htmlFor="specialization-select" className="sr-only">Specialization</label>
                    <select
                        id="specialization-select"
                        value={selectedSpecialization}
                        onChange={handleSpecializationChange}
                        className="filter-select"
                    >
                        <option value="">All Specializations</option>
                        {specializations.map(spec => (
                            <option key={spec} value={spec}>{spec}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label htmlFor="approach-select" className="sr-only">Approach</label>
                    <select
                        id="approach-select"
                        value={selectedApproach}
                        onChange={handleApproachChange}
                        className="filter-select"
                    >
                        <option value="">All Approaches</option>
                        {approaches.map(approach => (
                            <option key={approach} value={approach}>{approach}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label htmlFor="insurance-select" className="sr-only">Insurance</label>
                    <select
                        id="insurance-select"
                        value={selectedInsurance}
                        onChange={handleInsuranceChange}
                        className="filter-select"
                    >
                        <option value="">All Insurances</option>
                        {insurances.map(insurance => (
                            <option key={insurance} value={insurance}>{insurance}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label htmlFor="sort-select" className="sr-only">Sort By</label>
                    <select
                        id="sort-select"
                        value={sortBy}
                        onChange={handleSortChange}
                        className="filter-select"
                    >
                        <option value="name">Sort by Name</option>
                        <option value="rating">Sort by Rating</option>
                        <option value="experience">Sort by Experience</option>
                    </select>
                </div>
            </div>

            <ul className="therapist-list">
                {sortedTherapists.length > 0 ? (
                    sortedTherapists.map(therapist => (
                        <li key={therapist.id} className="therapist-card">
                            {therapist.profilePhotoUrl ? (
                                <img
                                    src={therapist.profilePhotoUrl}
                                    alt={therapist.fullName || 'Therapist Profile'}
                                    className="therapist-photo"
                                />
                            ) : (
                                <div className="therapist-photo-placeholder">
                                    {getInitials(therapist.fullName)}
                                </div>
                            )}
                            <div className="therapist-info">
                                <Link to={`/therapist-profile/${therapist.id}`} className="therapist-name-link">
                                    <span className="therapist-name">{therapist.fullName}</span>
                                </Link>
                                <span className="therapist-credentials">{therapist.designation}</span>
                                <span className="therapist-specialization">
                                    Specialization: {therapist.specializations?.join(', ') || 'N/A'}
                                </span>
                                <span className="therapist-availability">
                                    Available: {formatAvailability(therapist.availabilitySchedule)}
                                </span>
                                {therapist.yearsExperience && <span>Experience: {therapist.yearsExperience} years</span>}
                                {therapist.averageRating && <span>Rating: {therapist.averageRating.toFixed(1)}/5</span>}
                                {therapist.clinicalLocation?.city && <span>Location: {therapist.clinicalLocation.city}, {therapist.clinicalLocation.state}</span>}
                            </div>
                            <div className="therapist-actions">
                                <Link to={`/therapist-profile/${therapist.id}`} className="select-therapist-button">
                                    View Profile
                                </Link>
                            </div>
                        </li>
                    ))
                ) : (
                    <p className="no-therapists">No therapists found matching your criteria.</p>
                )}
            </ul>
        </div>
    );
};

export default FindTherapist;
