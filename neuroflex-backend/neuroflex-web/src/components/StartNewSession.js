// src/components/StartNewSession.js
import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { useNavigate } from 'react-router-dom';
import { useFirebase } from '../contexts/FirebaseContext'; // IMPORTANT: Import useFirebase hook


// Register Chart.js components needed for the line chart
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const StartNewSession = () => {
    // Consume Firebase context to get db, auth, and user info
    const { db, auth, currentUserId, isFirebaseReady, firebaseError } = useFirebase();

    const [deviceConnected, setDeviceConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [selectedConcerns, setSelectedConcerns] = useState(
        localStorage.getItem('selectedConcerns')
            ? JSON.parse(localStorage.getItem('selectedConcerns'))
            : []
    );
    const [sessionStarted, setSessionStarted] = useState(false);
    const [emotivUserId, setEmotivUserId] = useState(''); // Emotiv API User ID (could be passed from bridge if desired)
    const [sessionId, setSessionId] = useState(''); // Emotiv Session ID (could be passed from bridge if desired)
    const [socketInstance, setSocketInstance] = useState(null); // WebSocket connection to Python bridge

    const [sessionData, setSessionData] = useState([]); // Array of {timestamp, engagement, meditation, ...} for chart
    const [sessionStartTime, setSessionStartTime] = useState(null);
    const [sessionDurationSeconds, setSessionDurationSeconds] = useState(0); // in seconds
    const sessionDataBuffer = useRef([]); // Buffer to collect all data points for saving
    const sessionTimerRef = useRef(null); // Ref for setInterval
    const navigate = useNavigate();
    const [message, setMessage] = useState(''); // For in-component messages

    // --- Emotiv Bridge Communication Configuration ---
    // IMPORTANT: This URL MUST match the port your Python emotiv_bridge.py is listening on!
    const REACT_APP_WEBSOCKET_URL = 'ws://localhost:9001'; // <-- Adjust this if your Python bridge uses a different port


    // Set initial message/error based on Firebase context status
    useEffect(() => {
        if (firebaseError) {
            setMessage(`Firebase Initialization Error: ${firebaseError}`);
        } else if (!isFirebaseReady) {
            setMessage("Initializing Firebase and authenticating...");
        } else {
            // Only set a success message if no other error is present
            if (!message.includes("Error") && !message.includes("Connecting")) {
                setMessage("Firebase is ready. Connect to Emotiv device.");
            }
        }
    }, [firebaseError, isFirebaseReady]); // Depend on context status


    // Clean up socket and timer on component unmount
    useEffect(() => {
        return () => {
            if (socketInstance) {
                socketInstance.close();
            }
            if (sessionTimerRef.current) {
                clearInterval(sessionTimerRef.current);
            }
        };
    }, [socketInstance]);


    const connectDevice = async () => {
        setMessage('');
        setConnecting(true);
        // Check if Firebase is ready and user is authenticated from context
        if (!isFirebaseReady || !currentUserId || !db || !auth) {
            setMessage("Firebase is not fully initialized or user not authenticated. Please wait.");
            setConnecting(false);
            return;
        }

        // Establish WebSocket connection to your Python bridge
        const bridgeSocket = new WebSocket(REACT_APP_WEBSOCKET_URL);
        setSocketInstance(bridgeSocket); // Store this instance for later closing

        bridgeSocket.onopen = () => {
            console.log("WebSocket connected to Python Emotiv Bridge.");
            setMessage("Connected to Python Bridge. Waiting for Emotiv data...");
            setDeviceConnected(true);
            setConnecting(false);
        };

        bridgeSocket.onmessage = (event) => {
            const response = JSON.parse(event.data);
            console.log("Data from Python Bridge:", response);

            // Assuming the Python bridge sends 'pow' and 'met' data directly
            if (sessionStarted) { // Only collect data if the session has actively been started by the user
                const dataPoint = { timestamp: new Date() };
                if (response.streamName === "met" && response.met) {
                    dataPoint.engagement = response.met[0];
                    dataPoint.meditation = response.met[1];
                    dataPoint.stress = response.met[2];
                    dataPoint.attention = response.met[3];
                } else if (response.streamName === "pow" && response.pow) {
                    dataPoint.theta = response.pow[0];
                    dataPoint.alpha = response.pow[1];
                    dataPoint.lowBeta = response.pow[2];
                    dataPoint.highBeta = response.pow[3];
                    dataPoint.gamma = response.pow[4];
                }

                if (Object.keys(dataPoint).length > 1) { // If actual data for metrics was added
                    setSessionData(prevData => [...prevData, dataPoint]); // Update for real-time chart
                    sessionDataBuffer.current.push(dataPoint); // Add to buffer for saving
                }
            } else {
                // You might receive initial status messages from the bridge before session starts
                if (response.status === "device_connected") {
                    setMessage("Python Bridge indicates device connected. Ready to start session.");
                } else if (response.status === "session_created" && response.sessionId) {
                    setSessionId(response.sessionId);
                    setEmotivUserId(response.emotivUserId);
                    setMessage("Emotiv session created via bridge. Ready to start data collection.");
                }
            }
        };

        bridgeSocket.onerror = (err) => {
            console.error("WebSocket Error from Python Bridge:", err);
            setMessage("WebSocket connection to Python Bridge failed. Is the Python script running on the correct port?");
            setConnecting(false);
            setDeviceConnected(false);
        };

        bridgeSocket.onclose = () => {
            console.log("WebSocket connection to Python Bridge closed.");
            setDeviceConnected(false);
            setConnecting(false);
            setMessage("Connection to Emotiv device (via Python bridge) closed.");
        };
    };

    const startSession = () => {
        setMessage('');
        if (!deviceConnected) {
            setMessage("Please connect to the Emotiv device first by running the Python bridge and clicking 'Connect'.");
            return;
        }
        // Double-check Firebase readiness from context before starting session that will save data
        if (!isFirebaseReady || !currentUserId || !db || !auth) {
            setMessage("Firebase not ready or user not authenticated. Please wait for Firebase to initialize.");
            console.error("Firebase not fully initialized or currentUserId is null. Cannot start session.");
            return;
        }

        setSessionStarted(true);
        setSessionData([]); // Clear previous session data for a new session chart
        sessionDataBuffer.current = []; // Clear buffer for new session

        setSessionStartTime(new Date());
        setSessionDurationSeconds(0);
        setMessage("Session started. Collecting data...");
        // Start the timer to track session duration
        sessionTimerRef.current = setInterval(() => {
            setSessionDurationSeconds(prev => prev + 1);
        }, 1000);
    };

    const stopSession = async () => {
        setMessage("Stopping session and saving data...");
        setSessionStarted(false);
        if (sessionTimerRef.current) {
            clearInterval(sessionTimerRef.current); // Stop the session timer
        }

        const endTime = new Date();
        const durationMinutes = Math.round(sessionDurationSeconds / 60);

        // Close the WebSocket connection to the Python bridge when session stops
        if (socketInstance) {
            socketInstance.close();
        }

        // Aggregate data for averages
        const performanceMetricsKeys = ['engagement', 'meditation', 'stress', 'attention'];
        const bandPowerKeys = ['theta', 'alpha', 'lowBeta', 'highBeta', 'gamma'];

        const aggregateMetrics = (dataPoints, keys) => {
            if (dataPoints.length === 0) return keys.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
            const sums = keys.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
            dataPoints.forEach(p => { keys.forEach(key => { sums[key] += p[key] || 0; }); });
            return keys.reduce((acc, key) => ({ ...acc, [key]: sums[key] / dataPoints.length }), {});
        };

        const emotivPerformanceMetricsAverage = aggregateMetrics(sessionDataBuffer.current, performanceMetricsKeys);
        const eegBandPowerAverage = aggregateMetrics(sessionDataBuffer.current, bandPowerKeys);

        // --- Generate Progress Summary with Gemini API ---
        let progressSummary = "Could not generate AI summary.";
        if (currentUserId && db) { // Ensure Firebase is ready before calling Gemini
            const promptForGemini = `Analyze the following neurofeedback session data focusing on user performance.
            Session Duration: ${durationMinutes} minutes.
            Average Engagement: ${emotivPerformanceMetricsAverage.engagement?.toFixed(2) || 'N/A'}
            Average Meditation: ${emotivPerformanceMetricsAverage.meditation?.toFixed(2) || 'N/A'}
            Average Stress: ${emotivPerformanceMetricsAverage.stress?.toFixed(2) || 'N/A'}
            Average Attention: ${emotivPerformanceMetricsAverage.attention?.toFixed(2) || 'N/A'}
            Average Alpha Power: ${eegBandPowerAverage.alpha?.toFixed(2) || 'N/A'}
            Average Beta Power (sum of low and high): ${((eegBandPowerAverage.lowBeta || 0) + (eegBandPowerAverage.highBeta || 0))?.toFixed(2) || 'N/A'}
            Dominant Brainwave (highest average power): ${Object.keys(eegBandPowerAverage).find(key => eegBandPowerAverage[key] === Math.max(...Object.values(eegBandPowerAverage))) || 'N/A'}.
            The user's primary concerns for this session were: ${selectedConcerns.length > 0 ? selectedConcerns.join(', ') : 'Not specified'}.

            Provide a concise (2-3 sentences), encouraging summary of their progress for a patient, highlighting key insights or areas for continued focus. Avoid technical jargon where possible.`;

            try {
                const apiKey = ""; // Canvas will provide this at runtime
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
                const payload = { contents: [{ role: "user", parts: [{ text: promptForGemini }] }] };

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
                    progressSummary = result.candidates[0].content.parts[0].text;
                } else {
                    console.warn("Gemini API did not return a valid summary:", result);
                }
            } catch (geminiError) {
                console.error("Error calling Gemini API:", geminiError);
                progressSummary = "Could not generate AI summary due to an error. Please try again.";
            }
        }

        // Save session to Firestore
        try {
            if (!db) { // Ensure db is available from context
                setMessage("Firestore database not initialized. Cannot save session.");
                console.error("Firestore database is null, cannot save session.");
                return;
            }
            await addDoc(collection(db, 'eegSessions'), {
                userId: currentUserId, // Your Firebase authenticated user ID from context
                emotivUserId: emotivUserId, // Emotiv platform's user ID (if different/needed, from bridge)
                startTime: sessionStartTime,
                endTime: endTime,
                durationMinutes: durationMinutes,
                cognitiveAreaTargeted: selectedConcerns.length > 0 ? selectedConcerns.join(', ') : "General Neurofeedback",
                emotivPerformanceMetricsAverage: emotivPerformanceMetricsAverage,
                eegBandPowerAverage: eegBandPowerAverage,
                progressSummary: progressSummary,
                // Only save a subset of raw data to keep document size manageable if needed
                rawMetricHistoryPoints: sessionDataBuffer.current.map(dataPoint => ({
                    timestamp: dataPoint.timestamp,
                    engagement: dataPoint.engagement || 0,
                    meditation: dataPoint.meditation || 0,
                    alpha: dataPoint.alpha || 0,
                    beta: (dataPoint.lowBeta || 0) + (dataPoint.highBeta || 0), // Sum low and high beta
                })).filter(Boolean), // Filter out any empty/null data points
                timestamp: serverTimestamp(), // Use Firestore server timestamp for consistency
            });
            setMessage("Session saved successfully! Navigating to history...");
            setTimeout(() => navigate('/session-history'), 1500); // Navigate after a short delay
        } catch (saveError) {
            console.error("Error saving session to Firestore:", saveError);
            setMessage(`Failed to save session: ${saveError.message}`);
        }
    };


    // Chart Data (showing Engagement and Meditation over time for current session)
    const chartData = {
        labels: sessionData.map(d => d.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })),
        datasets: [
            {
                label: 'Engagement',
                data: sessionData.map(d => d.engagement),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.3,
                pointRadius: 1, // Keep points small for busy real-time charts
            },
            {
                label: 'Meditation',
                data: sessionData.map(d => d.meditation),
                borderColor: 'rgba(153, 102, 255, 1)',
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                fill: true,
                tension: 0.3,
                pointRadius: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { color: '#343a40' } },
            title: {
                display: true,
                text: 'Real-time Session Metrics (Engagement & Meditation)',
                color: '#194b45',
                font: { size: 18 }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.7)', titleColor: '#fff', bodyColor: '#fff',
                borderColor: '#c3a36b', borderWidth: 1, cornerRadius: 5,
            },
        },
        scales: {
            x: {
                title: { display: true, text: 'Time', color: '#343a40' },
                ticks: { color: '#343a40', autoSkip: true, maxRotation: 0 },
                grid: { color: 'rgba(0, 0, 0, 0.05)' }
            },
            y: {
                beginAtZero: true, max: 1, // Assuming performance metrics are 0-1
                title: { display: true, text: 'Metric Value (0-1)', color: '#343a40' },
                ticks: { color: '#343a40' },
                grid: { color: 'rgba(0, 0, 0, 0.05)' }
            },
        },
        animation: { duration: 0 }, // Disable animation for smoother real-time updates
        elements: { line: { borderWidth: 2 }, point: { radius: 0 } } // Thin lines, no points
    };

    return (
        <div className="start-new-session-container">
            <style>
                {`
                /* src/components/StartNewSession.css - Keep your existing styles or add new ones */
                .start-new-session-container {
                    font-family: 'Nunito Sans', sans-serif;
                    background-color: #eef5f9;
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    margin: 90px auto;
                    max-width: 900px;
                    color: #2c3e50;
                    animation: fadeIn 0.8s ease-out;
                    text-align: center;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .start-new-session-header {
                    margin-bottom: 30px;
                }

                .user-info {
                    /* Style for user info if you add it */
                }

                .start-new-session-content h1 {
                    color: #194b45;
                    margin-bottom: 25px;
                    font-size: 2.5em;
                    font-weight: 700;
                }

                .start-new-session-button {
                    background: #d6b781;
                    color: #333;
                    padding: 12px 25px;
                    border-radius: 25px;
                    font-weight: 600;
                    text-decoration: none;
                    display: inline-block;
                    font-family: 'Montserrat', sans-serif;
                    position: relative;
                    overflow: hidden;
                    z-index: 1;
                    letter-spacing: 0.02em;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
                    border: none;
                    margin: 0 10px 20px;
                    cursor: pointer;
                }

                .start-new-session-button:hover {
                    transform: translateY(-3px);
                    box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.3);
                }

                .start-new-session-button:disabled {
                    background-color: #bdc3c7;
                    cursor: not-allowed;
                }

                .message-display {
                    font-size: 1.1em;
                    margin-bottom: 15px;
                    font-weight: 600;
                }
                .message-display.connecting { color: #f39c12; }
                .message-display.success { color: #27ae60; }
                .message-display.error { color: #e74c3c; }

                .concerns-display {
                    font-size: 1em;
                    color: #555;
                    margin-bottom: 20px;
                }

                .chart-container {
                    margin-top: 30px;
                    height: 400px; /* Fixed height for the chart */
                    width: 100%;
                    max-width: 800px;
                    margin-left: auto;
                    margin-right: auto;
                    background-color: #fff;
                    border-radius: 8px;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
                    padding: 15px;
                }

                .session-info {
                    margin-top: 20px;
                    font-size: 1em;
                    color: #555;
                }

                @media (max-width: 768px) {
                    .start-new-session-container {
                        padding: 20px;
                        margin: 15px auto;
                    }
                    .start-new-session-content h1 {
                        font-size: 2em;
                    }
                    .start-new-session-button {
                        padding: 10px 20px;
                        font-size: 0.9em;
                        margin: 5px;
                        display: block;
                        width: calc(100% - 20px);
                    }
                    .chart-container {
                        height: 300px;
                        padding: 10px;
                    }
                }
                `}
            </style>

            <header className="start-new-session-header">
                <div className="user-info">{/* Optional user info */}</div>
            </header>

            <div className="start-new-session-content">
                <h1>Start New Session</h1>

                {message && (
                    <p className={`message-display ${message.includes('Error') ? 'error' : message.includes('Connecting') ? 'connecting' : 'success'}`}>
                        {message}
                    </p>
                )}

                {!deviceConnected && !connecting && (
                    <button className="start-new-session-button primary" onClick={connectDevice} disabled={!isFirebaseReady || !currentUserId}>
                        Connect Emotiv Device
                    </button>
                )}

                {deviceConnected && (
                    <div>
                        <p className="device-connected-message">
                            Device Connected Successfully!
                            {sessionStarted ? ` Session active for: ${Math.floor(sessionDurationSeconds / 60)}m ${sessionDurationSeconds % 60}s` : ''}
                        </p>
                        <p className="concerns-display">
                            Concerns: {selectedConcerns.length > 0 ? selectedConcerns.join(', ') : 'No concerns selected (general session)'}
                        </p>
                        {!sessionStarted ? (
                            <button className="start-new-session-button success" onClick={startSession} disabled={!isFirebaseReady || !currentUserId}>
                                Start Session
                            </button>
                        ) : (
                            <button className="start-new-session-button primary" onClick={stopSession}>
                                Stop Session & Save
                            </button>
                        )}
                    </div>
                )}

                {sessionStarted && sessionData.length > 0 && (
                    <div className="chart-container">
                        <Line data={chartData} options={chartOptions} />
                    </div>
                )}

                {/* Display current user ID for debugging */}
                {currentUserId && <p style={{ fontSize: '0.8em', color: '#777', marginTop: '20px' }}>Firebase User ID: {currentUserId}</p>}
                {emotivUserId && <p style={{ fontSize: '0.8em', color: '#777' }}>Emotiv User ID: {emotivUserId}</p>}
            </div>
        </div>
    );
};

export default StartNewSession;
