import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/Welcome.css";

const Welcome = () => {
  const [titleText, setTitleText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const fullTitle = "Mastering The Mind By Reframing Reality";
  const typingSpeed = 100; // milliseconds

  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < fullTitle.length) {
        setTitleText(fullTitle.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
        setCursorVisible(false); // Hide cursor after typing
      }
    }, typingSpeed);

    return () => clearInterval(typingInterval); // Cleanup on unmount
  }, []);

  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <h1 className="title typewriter" style={{ borderRight: cursorVisible ? '.15em solid white' : 'none' }}>{titleText}</h1>
        <p className="subtitle">"Train Your Brain, Transform Your Life"</p>
        <p className="hero-description">Experience real-time brain training with engaging neurofeedback games. 
         </p>
         <Link to="/signup" className="signup-link signup-btn-style">Sign Up Now</Link> 
      </div>

      <section className="features-section">
        <h2>Key Features</h2>
        <div className="features-grid centered-grid"> {/* Added centered-grid class */}
          <div className="feature-item enhanced-hover"> {/* Changed hover class */}
            <img src="https://img.icons8.com/material-outlined/48/33776b/controller.png" alt="Gamified Therapy Icon" className="feature-icon" />
            <h3>Gamified Therapy</h3>
            <p>Engage in interactive and fun games designed to make your therapy sessions more enjoyable and effective.</p>
          </div>
          <div className="feature-item enhanced-hover"> {/* Changed hover class */}
            <img src="https://img.icons8.com/material-outlined/48/33776b/brain.png" alt="Neurofeedback Monitoring Icon" className="feature-icon" />
            <h3>Neurofeedback Monitoring</h3>
            <p>Experience real-time monitoring of your brain activity, providing valuable insights to optimize your training.</p>
          </div>
          <div className="feature-item enhanced-hover"> {/* Changed hover class */}
            <img src="https://img.icons8.com/material-outlined/48/33776b/user.png" alt="Personalized Training Icon" className="feature-icon" />
            <h3>Personalized Training</h3>
            <p>Receive training programs tailored to your specific needs and goals, adapting as you progress.</p>
          </div>
          <div className="feature-item enhanced-hover"> {/* Changed hover class */}
            <img src="https://img.icons8.com/material-outlined/48/33776b/idea--v2.png" alt="Cognitive Training Modules Icon" className="feature-icon" />
            <h3>Cognitive Training Modules</h3>
            <p>Access a variety of modules targeting different cognitive skills such as focus, memory, and attention.</p>
          </div>
          <div className="feature-item enhanced-hover"> {/* Changed hover class */}
            <img src="https://img.icons8.com/material-outlined/48/33776b/comments.png" alt="Real-Time Feedback Icon" className="feature-icon" />
            <h3>Real-Time Feedback</h3>
            <p>Get immediate feedback on your performance during training sessions, helping you learn and improve in the moment.</p>
          </div>
        </div>
      </section>

      {/* Remaining sections (How It Works, Benefits, Call to Action) */}
      <section className="how-it-works-section outlined-hover centered-grid">
        <h2>How It Works</h2>
        <div className="how-it-works-steps">
          <div className="step">
            <img src="https://img.icons8.com/material-outlined/48/33776b/link.png" alt="Connect EEG Icon" className="step-icon" />
            <h3>Step 1: Connect Your EEG Device</h3>
            <p>Easily connect your compatible EEG device to our platform.</p>
          </div>
          <div className="step">
            <img src="https://img.icons8.com/material-outlined/48/33776b/play--v1.png" alt="Play Games Icon" className="step-icon" />
            <h3>Step 2: Play Engaging Games</h3>
            <p>Start playing our specially designed neurofeedback games.</p>
          </div>
          <div className="step">
            <img src="https://img.icons8.com/material-outlined/48/33776b/line-chart.png" alt="Track Progress Icon" className="step-icon" />
            <h3>Step 3: Track Your Progress</h3>
            <p>Monitor your brain activity and see your improvements over time.</p>
          </div>
        </div>
        <Link to="/how-it-works" className="learn-more-btn signup-btn-style">Learn More</Link>
      </section>

      <section className="benefits-section appealing-benefits">
        <h2>Unlock the Benefits</h2>
        <div className="benefits-grid">
        <div className="benefit-item">
  <img src="https://img.icons8.com/material-outlined/48/33776b/target.png" alt="Improved Focus Icon" className="benefit-icon" />
  <h3>Improved Focus</h3>
  <p>Sharpen your attention and enhance concentration for better productivity.</p>
</div>
<div className="benefit-item">
  <img src="https://img.icons8.com/material-outlined/48/33776b/sad.png" alt="Reduce Stress Icon" className="benefit-icon" />
  <h3>Reduced Stress</h3>
  <p>Learn to regulate brain activity associated with stress and anxiety.</p>
</div>
<div className="benefit-item">
  <img src="https://img.icons8.com/material-outlined/48/33776b/light-on.png" alt="Enhanced Cognition Icon" className="benefit-icon" />
  <h3>Cognitive Enhancement</h3>
  <p>Boost memory, learning capabilities, and overall cognitive function.</p>
</div>
        </div>
      </section>

      <section className="call-to-action-section appealing-cta" style={{ backgroundColor: '#f9f9f9', color: '#33776b' }}>
        <h2>Ready to Transform Your Mind?</h2>
        <p>Embark on a journey to enhance your cognitive well-being.</p>
        <Link to="/signup" className="signup-link signup-btn-style">Sign Up Now</Link>
      </section>
    </div>
  );
};

export default Welcome;