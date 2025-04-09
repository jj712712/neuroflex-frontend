import React from "react";
import { Link } from "react-router-dom";
import "../styles/Welcome.css"; // Assuming your CSS is in Welcome.css

const Welcome = () => {
  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <h1>Mastering The Mind By Reframing Reality</h1>
        <p className="subtitle">"Train Your Brain, Transform Your Life"</p>
        <p>Experience real-time brain training with engaging neurofeedback games.</p>
        <div className="welcome-buttons"> {/* New container for buttons */}
          <Link to="/signup" className="start-btn">Get Started</Link>
          <Link to="/self-assessment">Take Our Initial Self-Assessment</Link>
        </div>
      </div>
    </div>
  );
};

export default Welcome;