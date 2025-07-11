// src/components/ViewSessionHistory.js
import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { useNavigate } from 'react-router-dom';
import { useFirebase } from '../contexts/FirebaseContext'; // IMPORTANT: Import Firebase Context


// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const ViewSessionHistory = () => {
    const { db, auth, currentUserId, isFirebaseReady, firebaseError } = useFirebase(); // Consume Context
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Set initial error from Firebase context
    useEffect(() => {
        if (firebaseError) {
            setError(`Firebase Initialization Error: ${firebaseError}`);
            setLoading(false); // Stop loading if Firebase has an error
        } else if (!isFirebaseReady) {
            setError("Initializing Firebase. Please wait..."); // Set a temporary message while not ready
            setLoading(true);
        } else {
            setError(null); // Clear error if Firebase becomes ready
        }
    }, [firebaseError, isFirebaseReady]);

    // Fetch sessions when Firebase and user are ready
    useEffect(() => {
        const fetchSessions = async () => {
            if (!isFirebaseReady || !currentUserId || !db) { // Ensure db is also ready from context
                console.log("Firebase not ready, no user ID, or DB not initialized. Not fetching sessions yet.");
                // If not ready and no existing error, set a message
                if (!error) setError("Waiting for Firebase to be ready...");
                return;
            }

            setLoading(true);
            setError(null); // Clear previous errors before fetching
            try {
                const q = query(
                    collection(db, 'eegSessions'),
                    where('userId', '==', currentUserId),
                    orderBy('timestamp', 'desc')
                );
                const querySnapshot = await getDocs(q);
                const fetchedSessions = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    startTime: doc.data().startTime?.toDate(),
                    endTime: doc.data().endTime?.toDate(),
                    timestamp: doc.data().timestamp?.toDate(),
                    rawMetricHistoryPoints: doc.data().rawMetricHistoryPoints?.map(p => ({
                        ...p,
                        timestamp: p.timestamp?.toDate()
                    })) || []
                }));
                setSessions(fetchedSessions);
            } catch (err) {
                console.error("Error fetching sessions:", err);
                setError(`Failed to load sessions: ${err.message}. Please check your internet connection or Firebase rules.`);
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
    }, [isFirebaseReady, currentUserId, db]); // Depend on context values

    const getSessionChartData = (session) => {
        if (!session || !session.rawMetricHistoryPoints || session.rawMetricHistoryPoints.length === 0) {
            return { labels: [], datasets: [] };
        }

        const sortedHistory = [...session.rawMetricHistoryPoints].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        const labels = sortedHistory.map(dataPoint =>
            dataPoint.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );

        return {
            labels: labels,
            datasets: [
                {
                    label: 'Engagement',
                    data: sortedHistory.map(dataPoint => dataPoint.engagement),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                    yAxisID: 'y'
                },
                {
                    label: 'Meditation',
                    data: sortedHistory.map(dataPoint => dataPoint.meditation),
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointBackgroundColor: 'rgba(153, 102, 255, 1)',
                    yAxisID: 'y'
                },
                {
                    label: 'Alpha Power',
                    data: sortedHistory.map(dataPoint => dataPoint.alpha),
                    borderColor: 'rgba(255, 159, 64, 1)',
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointBackgroundColor: 'rgba(255, 159, 64, 1)',
                    yAxisID: 'y1'
                },
                {
                    label: 'Beta Power',
                    data: sortedHistory.map(dataPoint => dataPoint.beta),
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                    yAxisID: 'y1'
                },
            ],
        };
    };

    const getSessionChartOptions = (title) => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#343a40' }
            },
            title: {
                display: true,
                text: `Session Progress: ${title}`,
                color: '#194b45',
                font: { size: 18 }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#c3a36b',
                borderWidth: 1,
                cornerRadius: 5,
            },
        },
        scales: {
            x: {
                title: { display: true, text: 'Time', color: '#343a40' },
                ticks: { color: '#343a40' },
                grid: { color: 'rgba(0, 0, 0, 0.05)' }
            },
            y: {
                beginAtZero: true,
                max: 1,
                title: { display: true, text: 'Performance (0-1)', color: '#343a40' },
                ticks: { color: '#343a40' },
                grid: { color: 'rgba(0, 0, 0, 0.05)' },
                position: 'left',
                id: 'y',
            },
            y1: {
                beginAtZero: true,
                title: { display: true, text: 'Band Power', color: '#343a40' },
                ticks: { color: '#343a40' },
                grid: { drawOnChartArea: false },
                position: 'right',
                id: 'y1',
            }
        },
    });

    if (loading) {
        return (
            <div className="session-history-container">
                <p>Loading session history...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="session-history-container error-message">
                <p>Error: {error}</p>
                <button className="navigate-button" onClick={() => window.location.reload()}>Refresh Page</button>
            </div>
        );
    }

    return (
        <div className="session-history-container">
            <style>
                {`
                /* src/components/ViewSessionHistory.css */
                .session-history-container {
                    font-family: 'Nunito Sans', sans-serif;
                    background-color: #eef5f9;
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    margin: 90px auto;
                    max-width: 1000px;
                    color: #2c3e50;
                    animation: fadeIn 0.8s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                h2 {
                    color: #194b45;
                    margin-bottom: 30px;
                    text-align: center;
                    font-size: 2.5em;
                    font-weight: 700;
                }

                h3 {
                    color: #bca071;
                    margin-top: 25px;
                    margin-bottom: 15px;
                    font-size: 1.8em;
                    font-weight: 600;
                    text-align: center;
                }

                .session-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                    padding: 20px;
                    background-color: #f9fafa;
                    border: 1px solid #d1d8e2;
                    border-radius: 10px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
                }

                .session-card {
                    background-color: #ffffff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
                    cursor: pointer;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    border-left: 5px solid #194b45;
                }

                .session-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .session-card h4 {
                    color: #194b45;
                    margin-top: 0;
                    margin-bottom: 10px;
                    font-size: 1.3em;
                    font-weight: 600;
                }

                .session-card p {
                    font-size: 0.95em;
                    color: #555;
                    margin-bottom: 5px;
                    line-height: 1.4;
                }

                .session-details {
                    margin-top: 40px;
                    padding: 30px;
                    border: 1px solid #d1d8e2;
                    border-radius: 8px;
                    background-color: #f9fafa;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
                }

                .session-details p {
                    font-size: 1.1em;
                    line-height: 1.7;
                    margin-bottom: 15px;
                }

                .chart-area {
                    margin-top: 20px;
                    height: 350px; /* Fixed height for the chart */
                    width: 100%;
                    max-width: 800px;
                    margin-left: auto;
                    margin-right: auto;
                }

                .navigate-button {
                    background: #d6b781;
                    color: #333;
                    padding: 14px 30px;
                    border-radius: 30px;
                    font-weight: 600;
                    text-decoration: none;
                    display: inline-block;
                    font-family: 'Montserrat', sans-serif;
                    position: relative;
                    overflow: hidden;
                    z-index: 1;
                    letter-spacing: 0.02em;
                    transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
                    border: none;
                    margin: 10px;
                    cursor: pointer;
                }

                .navigate-button:hover {
                    transform: translate3d(0, -5px, 5px);
                    box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.3);
                }

                .error-message {
                    color: #e74c3c;
                    font-weight: bold;
                    text-align: center;
                    margin-top: 20px;
                }

                @media (max-width: 768px) {
                    .session-history-container {
                        padding: 20px;
                        margin: 15px auto;
                    }

                    h2 {
                        font-size: 2em;
                    }

                    .session-list {
                        grid-template-columns: 1fr;
                    }

                    .session-card {
                        padding: 15px;
                    }

                    .session-card h4 {
                        font-size: 1.2em;
                    }

                    .session-details {
                        padding: 20px;
                    }

                    .chart-area {
                        height: 250px; /* Adjust height for smaller screens */
                    }
                }
                `}
            </style>

            <h2>Your Session History</h2>

            {sessions.length === 0 && !loading && (
                <p style={{ textAlign: 'center' }}>No neurofeedback sessions found for your account. Please conduct a session to see your progress here.</p>
            )}

            <div className="session-list">
                {sessions.map(session => (
                    <div key={session.id} className="session-card" onClick={() => setSelectedSession(session)}>
                        <h4>{session.cognitiveAreaTargeted || 'General Session'}</h4>
                        <p><strong>Date:</strong> {session.startTime ? session.startTime.toLocaleDateString() : 'N/A'}</p>
                        <p><strong>Duration:</strong> {session.durationMinutes || 'N/A'} mins</p>
                        <p><strong>Summary:</strong> {session.progressSummary ? session.progressSummary.substring(0, 70) + '...' : 'No summary available.'}</p>
                    </div>
                ))}
            </div>

            {selectedSession && (
                <div className="session-details">
                    <h3>Details for Selected Session</h3>
                    <p><strong>Session ID:</strong> {selectedSession.id}</p>
                    <p><strong>Targeted Area:</strong> {selectedSession.cognitiveAreaTargeted}</p>
                    <p><strong>Start Time:</strong> {selectedSession.startTime ? selectedSession.startTime.toLocaleString() : 'N/A'}</p>
                    <p><strong>End Time:</strong> {selectedSession.endTime ? selectedSession.endTime.toLocaleString() : 'N/A'}</p>
                    <p><strong>Duration:</strong> {selectedSession.durationMinutes} minutes</p>

                    <h4>Average Metrics:</h4>
                    <table className="scores-table">
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>Average Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedSession.emotivPerformanceMetricsAverage && Object.entries(selectedSession.emotivPerformanceMetricsAverage).map(([key, value]) => (
                                <tr key={key}>
                                    <td>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</td>
                                    <td>{typeof value === 'number' ? value.toFixed(2) : value}</td>
                                </tr>
                            ))}
                            {selectedSession.eegBandPowerAverage && Object.entries(selectedSession.eegBandPowerAverage).map(([key, value]) => (
                                <tr key={key}>
                                    <td>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</td>
                                    <td>{typeof value === 'number' ? value.toFixed(2) : value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {selectedSession.rawMetricHistoryPoints && selectedSession.rawMetricHistoryPoints.length > 0 && (
                        <>
                            <h4>Real-time Progress During Session:</h4>
                            <div className="chart-area">
                                <Line
                                    data={getSessionChartData(selectedSession)}
                                    options={getSessionChartOptions(selectedSession.cognitiveAreaTargeted)}
                                />
                            </div>
                        </>
                    )}

                    <h4>Summary & Recommendations:</h4>
                    <p>{selectedSession.progressSummary || "No detailed summary available for this session."}</p>

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <button className="navigate-button" onClick={() => setSelectedSession(null)}>Back to Sessions</button>
                    </div>
                </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <button className="navigate-button" onClick={() => navigate('/self-assessment')}>Go to Self-Assessment</button>
                <button className="navigate-button" onClick={() => navigate('/find-therapist')}>Find a Therapist</button>
                <button className="navigate-button" onClick={() => navigate('/start-new-session')}>Start New Live Session</button>
            </div>
        </div>
    );
};

export default ViewSessionHistory;
