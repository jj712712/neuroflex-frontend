// src/components/Onboarding.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Onboarding.css'; // Create this CSS file for styling

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [experience, setExperience] = useState('');
  const navigate = useNavigate();

  const nextStep = () => {
    setStep(prevStep => prevStep + 1);
  };

  const prevStep = () => {
    setStep(prevStep => prevStep - 1);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    if (name === 'name') {
      setName(value);
    } else if (name === 'goal') {
      setGoal(value);
    } else if (name === 'experience') {
      setExperience(value);
    }
  };

  const handleSubmit = () => {
    // Here you would typically send the onboarding data to your backend
    console.log('Onboarding Data:', { name, goal, experience });

    // After successful onboarding, you might redirect the user
    navigate('/user-dashboard'); // Or wherever appropriate
  };

  switch (step) {
    case 1:
      return (
        <div className="onboarding-container">
          <h2>Welcome! Let's get started.</h2>
          <div className="onboarding-step">
            <h3>Step 1: Tell us your name</h3>
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={name}
              onChange={handleInputChange}
            />
            <div className="onboarding-navigation">
              <button onClick={nextStep} disabled={!name.trim()}>Next</button>
            </div>
          </div>
        </div>
      );
    case 2:
      return (
        <div className="onboarding-container">
          <h2>Welcome! Let's get started.</h2>
          <div className="onboarding-step">
            <h3>Step 2: What are your goals?</h3>
            <textarea
              name="goal"
              placeholder="What do you hope to achieve?"
              value={goal}
              onChange={handleInputChange}
            />
            <div className="onboarding-navigation">
              <button onClick={prevStep}>Previous</button>
              <button onClick={nextStep} disabled={!goal.trim()}>Next</button>
            </div>
          </div>
        </div>
      );
    case 3:
      return (
        <div className="onboarding-container">
          <h2>Welcome! Let's get started.</h2>
          <div className="onboarding-step">
            <h3>Step 3: Have you used similar tools before?</h3>
            <select name="experience" value={experience} onChange={handleInputChange}>
              <option value="">Select an option</option>
              <option value="yes">Yes, I have experience.</option>
              <option value="no">No, this is new to me.</option>
              <option value="some">Some limited experience.</option>
            </select>
            <div className="onboarding-navigation">
              <button onClick={prevStep}>Previous</button>
              <button onClick={handleSubmit} disabled={!experience}>Finish</button>
            </div>
          </div>
        </div>
      );
    default:
      return (
        <div className="onboarding-container">
          <h2>Onboarding Complete!</h2>
          <p>Thank you for providing the information.</p>
          <button onClick={() => navigate('/user-dashboard')}>Go to Dashboard</button>
        </div>
      );
  }
};

export default Onboarding;