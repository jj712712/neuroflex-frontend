
import React from 'react';
import '../styles/HowItWorks.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faLightbulb,      // Identify Goals
    faBrain,          // EEG Assessment
    faClipboardCheck, // Personalized Recommendation
    faGamepad,        // Engage in Games
    faEye,            // Real-Time Feedback
    faFileAlt,        // Post-Session Reports
    faChartLine,      // Track Improvement
} from '@fortawesome/free-solid-svg-icons';

const HowItWorks = () => {
    return (
        <div className="how-it-works-page">
            <section className="hero">
                <div className="container">
                    <h1>How NeuroFlex Works</h1>
                    <p className="lead">Unlock your cognitive potential through our innovative neurofeedback therapy system.</p>
                </div>
            </section>

            <section className="steps">
                <div className="container">
                    <h2>The NeuroFlex Journey</h2>
                    <div className="steps-grid">
                        <div className="step-item">
                            <div className="step-icon">
                                <FontAwesomeIcon icon={faLightbulb} />
                            </div>
                            <h3 className="step-title">Identify Your Goals</h3>
                            <p className="step-description">Understand your primary cognitive challenges or goals.</p>
                        </div>
                        <div className="step-item">
                            <div className="step-icon">
                                <FontAwesomeIcon icon={faBrain} />
                            </div>
                            <h3 className="step-title">EEG Assessment</h3>
                            <p className="step-description">Connect your EEG device for real-time brainwave monitoring.</p>
                        </div>
                        <div className="step-item">
                            <div className="step-icon">
                                <FontAwesomeIcon icon={faClipboardCheck} />
                            </div>
                            <h3 className="step-title">Personalized Therapy</h3>
                            <p className="step-description">Receive tailored game recommendations based on your needs.</p>
                        </div>
                        <div className="step-item">
                            <div className="step-icon">
                                <FontAwesomeIcon icon={faGamepad} />
                            </div>
                            <h3 className="step-title">Engage in Games</h3>
                            <p className="step-description">Play adaptive games that respond to your brainwaves.</p>
                        </div>
                        <div className="step-item">
                            <div className="step-icon">
                                <FontAwesomeIcon icon={faEye} />
                            </div>
                            <h3 className="step-title">Real-Time Feedback</h3>
                            <p className="step-description">Get immediate feedback within the games.</p>
                        </div>
                        <div className="step-item">
                            <div className="step-icon">
                                <FontAwesomeIcon icon={faFileAlt} />
                            </div>
                            <h3 className="step-title">Post-Session Reports</h3>
                            <p className="step-description">Review detailed cognitive performance reports.</p>
                        </div>
                        <div className="step-item">
                            <div className="step-icon">
                                <FontAwesomeIcon icon={faChartLine} />
                            </div>
                            <h3 className="step-title">Track Improvement</h3>
                            <p className="step-description">Monitor your progress over time.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="faq">
                <div className="container">
                    <h2>Frequently Asked Questions</h2>
                    <div className="faq-item">
                        <h3>What is neurofeedback?</h3>
                        <p>Neurofeedback is a type of biofeedback that uses real-time displays of brain activity...</p>
                    </div>
                    <div className="faq-item">
                        <h3>Is the EMOTIV Insight device safe?</h3>
                        <p>Yes, the EMOTIV Insight is a non-invasive EEG device...</p>
                    </div>
                    {/* Add more FAQ items here */}
                </div>
            </section>
        </div>
    );
};

export default HowItWorks;