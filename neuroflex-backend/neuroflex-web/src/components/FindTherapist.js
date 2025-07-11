// src/components/FindTherapist.js
import React, { useState, useEffect } from 'react';
import './FindTherapist.css'; // Import the themed CSS
import { Link } from 'react-router-dom'; // For navigation

const FindTherapist = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSpecialization, setSelectedSpecialization] = useState('');
    const [selectedApproach, setSelectedApproach] = useState('');
    const [selectedInsurance, setSelectedInsurance] = useState('');
    const [sortBy, setSortBy] = useState('name'); // Default sorting
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [therapists, setTherapists] = useState([]); // Initialize as empty array
    const [specializations, setSpecializations] = useState([]);
    const [approaches, setApproaches] = useState([]);
    const [insurances, setInsurances] = useState([]);

    // Simulate fetching data from an API
    useEffect(() => {
        const fetchTherapistData = async () => {
            setLoading(true);
            setError(null);
            try {
                // In a real app, this would be an API call
                const mockTherapistData = [
                    {
                        id: 1,
                        name: 'Dr. Anya Sharma',
                        specialization: 'Anxiety Disorders',
                        availability: 'Mon-Fri',
                        credentials: 'PhD, LPC',
                        approaches: ['CBT', 'ACT'],
                        bio: 'Experienced in treating anxiety and related disorders...',
                        languages: ['English', 'Hindi'],
                        photo: '/images/therapist_anya.jpg',
                        fees: 120,
                        insurance: ['Aetna', 'Cigna'],
                        rating: 4.8,
                        experience: 10,
                        location: 'Karachi', // Example location
                    },
                    {
                        id: 2,
                        name: 'Dr. Ben Carter',
                        specialization: 'Depression',
                        availability: 'Tue-Sat',
                        credentials: 'PsyD',
                        approaches: ['Psychodynamic'],
                        bio: 'Compassionate therapist specializing in mood disorders...',
                        languages: ['English'],
                        photo: '/images/therapist_ben.jpg',
                        fees: 150,
                        insurance: ['Blue Cross', 'Aetna'],
                        rating: 4.5,
                        experience: 8,
                        location: 'Lahore', // Example location
                    },
                    {
                        id: 3,
                        name: 'Dr. Chloe Davis',
                        specialization: 'Stress Management',
                        availability: 'Wed-Sun',
                        credentials: 'MSW, LCSW',
                        approaches: ['Mindfulness-Based Therapy'],
                        bio: 'Helping individuals manage stress and improve well-being...',
                        languages: ['English', 'Urdu'],
                        photo: '/images/therapist_chloe.jpg',
                        fees: 100,
                        insurance: ['Cigna'],
                        rating: 4.9,
                        experience: 12,
                        location: 'Islamabad', // Example location
                    },
                    {
                        id: 4,
                        name: 'Dr. Ethan Ford',
                        specialization: 'Anxiety Disorders',
                        availability: 'Mon-Thu',
                        credentials: 'MA, LMFT',
                        approaches: ['CBT', 'DBT'],
                        bio: 'Dedicated to providing effective therapy for anxiety and trauma...',
                        languages: ['English'],
                        photo: '/images/therapist_ethan.jpg',
                        fees: 130,
                        insurance: ['Blue Cross'],
                        rating: 4.6,
                        experience: 7,
                        location: 'Karachi', // Example location
                    },
                    // Add more mock data
                ];

                setTherapists(mockTherapistData);
                // Extract unique specializations, approaches, and insurances
                const uniqueSpecializations = [...new Set(mockTherapistData.map(t => t.specialization))];
                const uniqueApproaches = [...new Set(mockTherapistData.flatMap(t => t.approaches))];
                const uniqueInsurances = [...new Set(mockTherapistData.flatMap(t => t.insurance))];

                setSpecializations(uniqueSpecializations);
                setApproaches(uniqueApproaches);
                setInsurances(uniqueInsurances);
            } catch (error) {
                console.error('Error fetching therapists:', error);
                setError('Failed to load therapists.');
            } finally {
                setLoading(false);
            }
        };

        fetchTherapistData();
    }, []);

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const handleSpecializationChange = (event) => {
        setSelectedSpecialization(event.target.value);
    };

    const handleApproachChange = (event) => {
        setSelectedApproach(event.target.value);
    };

    const handleInsuranceChange = (event) => {
        setSelectedInsurance(event.target.value);
    };

    const handleSortChange = (event) => {
        setSortBy(event.target.value);
    };

    const filteredTherapists = therapists.filter(therapist => {
        const nameMatch = therapist.name.toLowerCase().includes(searchQuery.toLowerCase());
        const specializationMatch = selectedSpecialization === '' || therapist.specialization === selectedSpecialization;
        const approachMatch = selectedApproach === '' || therapist.approaches.includes(selectedApproach);
        const insuranceMatch = selectedInsurance === '' || therapist.insurance.includes(selectedInsurance);
        return nameMatch && specializationMatch && approachMatch && insuranceMatch;
    });

    const sortedTherapists = [...filteredTherapists].sort((a, b) => {
        if (sortBy === 'name') {
            return a.name.localeCompare(b.name);
        } else if (sortBy === 'rating') {
            return b.rating - a.rating;
        } else if (sortBy === 'experience') {
            return b.experience - a.experience;
        }
        return 0;
    });

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
                <input
                    type="text"
                    placeholder="Search by name"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="filter-input"
                />
                <select
                    value={selectedSpecialization}
                    onChange={handleSpecializationChange}
                    className="filter-select"
                >
                    <option value="">All Specializations</option>
                    {specializations.map(spec => (
                        <option key={spec} value={spec}>{spec}</option>
                    ))}
                </select>
                <select
                    value={selectedApproach}
                    onChange={handleApproachChange}
                    className="filter-select"
                >
                    <option value="">All Approaches</option>
                    {approaches.map(approach => (
                        <option key={approach} value={approach}>{approach}</option>
                    ))}
                </select>
                <select
                    value={selectedInsurance}
                    onChange={handleInsuranceChange}
                    className="filter-select"
                >
                    <option value="">All Insurances</option>
                    {insurances.map(insurance => (
                        <option key={insurance} value={insurance}>{insurance}</option>
                    ))}
                </select>
                <select
                    value={sortBy}
                    onChange={handleSortChange}
                    className="filter-select"
                >
                    <option value="name">Sort by Name</option>
                    <option value="rating">Sort by Rating</option>
                    <option value="experience">Sort by Experience</option>
                </select>
            </div>

            <ul className="therapist-list">
                {sortedTherapists.map(therapist => (
                    <li key={therapist.id} className="therapist-card">
                        {therapist.photo && <img src={therapist.photo} alt={therapist.name} className="therapist-photo" />}
                        <div className="therapist-info">
                            <Link to={`/therapist-profile/${therapist.id}`} className="therapist-name-link">
                                <span className="therapist-name">{therapist.name}</span>
                            </Link>
                            <span className="therapist-credentials">{therapist.credentials}</span>
                            <span className="therapist-specialization">Specialization: {therapist.specialization}</span>
                            <span>Approaches: {therapist.approaches.join(', ')}</span>
                            <span>Accepts Insurance: {therapist.insurance.join(', ')}</span>
                            <span className="therapist-availability">Availability: {therapist.availability}</span>
                            {therapist.rating && <span>Rating: {therapist.rating}</span>}
                            {therapist.experience && <span>Experience: {therapist.experience} years</span>}
                            {therapist.location && <span>Location: {therapist.location}</span>}
                        </div>
                        <Link to={`/therapist-profile/${therapist.id}`} className="select-therapist-button">
                            View Profile
                        </Link>
                    </li>
                ))}
                {sortedTherapists.length === 0 && <p className="no-therapists">No therapists found matching your criteria.</p>}
            </ul>
        </div>
    );
};

export default FindTherapist;