import React, { useState } from 'react';
 import './SelfAssmnt.css';
 import { useNavigate } from 'react-router-dom';

 const SelfAssmnt = () => {
  const [primaryConcern, setPrimaryConcern] = useState('');

  // Focus & Attention
  const [difficultyConcentratingFrequency, setDifficultyConcentratingFrequency] = useState('');
  const [mindWanderingFrequency, setMindWanderingFrequency] = useState('');
  const [taskCompletionDifficulty, setTaskCompletionDifficulty] = useState('');
  const [organizingTasksDifficulty, setOrganizingTasksDifficulty] = useState('');

  // Anxiety
  const [worryIntensity, setWorryIntensity] = useState('');
  const [racingThoughtsFrequency, setRacingThoughtsFrequency] = useState('');
  const [avoidingSituations, setAvoidingSituations] = useState('');
  const [sleepDisturbanceAnxiety, setSleepDisturbanceAnxiety] = useState('');

  // Depression & Mood
  const [sadnessDurationFrequency, setSadnessDurationFrequency] = useState('');
  const [pleasureLossDegree, setPleasureLossDegree] = useState('');
  const [fatigueLevel, setFatigueLevel] = useState('');
  const [appetiteChanges, setAppetiteChanges] = useState('');

  // Learning & Memory
  const [recentMemoryIssues, setRecentMemoryIssues] = useState('');
  const [followingInstructionsDifficulty, setFollowingInstructionsDifficulty] = useState('');
  const [newSkillLearningDifficulty, setNewSkillLearningDifficulty] = useState('');
  const [expressingThoughtsDifficulty, setExpressingThoughtsDifficulty] = useState('');

  const [assessmentResult, setAssessmentResult] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const navigate = useNavigate();

  const analyzeResponses = (formData) => {
    let engineeredFeatures = {};
    let result = '';
    let recommendation = '';
    const indicators = [];

    // --- Focus & Attention Scoring ---
    let focusScore = 0;
    const frequencyMap = { 'rarely': 1, 'sometimes': 2, 'often': 3, 'veryOften': 4 };
    const difficultyMap = { 'notDifficult': 1, 'slightlyDifficult': 2, 'moderatelyDifficult': 3, 'veryDifficult': 4 };

    focusScore += frequencyMap[formData.difficultyConcentratingFrequency] || 0;
    focusScore += frequencyMap[formData.mindWanderingFrequency] || 0;
    focusScore += frequencyMap[formData.taskCompletionDifficulty] || 0;
    focusScore += difficultyMap[formData.organizingTasksDifficulty] || 0;
    engineeredFeatures.focus_raw_score = focusScore;

    if (formData.primaryConcern === 'focus') {
      if (focusScore >= 8) { // Example threshold
        indicators.push('Responses suggest potential difficulties with focus and attention (based on score).');
        recommendation += ' Strategies focusing on attention regulation, time management, and minimizing distractions may be helpful. Neurofeedback training is a potential avenue to explore for enhancing focus. Consulting with a specialist could provide a comprehensive evaluation.';
      } else {
        recommendation += ' Continue to be mindful of your attention and focus in daily activities.';
      }
    }

    // --- Anxiety Scoring ---
    let anxietyScore = 0;
    anxietyScore += parseInt(formData.worryIntensity) || 0;
    anxietyScore += frequencyMap[formData.racingThoughtsFrequency] || 0;
    anxietyScore += frequencyMap[formData.avoidingSituations] === 3 || frequencyMap[formData.avoidingSituations] === 4 ? 2 : 0; // Assign higher score for 'often'/'veryOften'
    anxietyScore += frequencyMap[formData.sleepDisturbanceAnxiety] === 3 || frequencyMap[formData.sleepDisturbanceAnxiety] === 4 ? 2 : 0;
    engineeredFeatures.anxiety_raw_score = anxietyScore;

    if (formData.primaryConcern === 'anxiety') {
      if (anxietyScore >= 8) { // Example threshold
        indicators.push('Responses indicate potential experiences with anxiety (based on score).');
        recommendation += ' Techniques such as mindfulness, relaxation exercises, and cognitive restructuring can be beneficial for managing anxiety. Seeking guidance from a therapist specializing in anxiety disorders is recommended.';
      } else {
        recommendation += ' Continue to practice healthy coping mechanisms for stress and worry.';
      }
    }

    // --- Depression Scoring ---
    let moodScore = 0;
    const sadnessMap = { 'rarely': 1, 'sometimes': 2, 'moreThanTwoWeeks': 3, 'almostDaily': 4 };
    const appetiteMap = { 'noChange': 0, 'increased': 1, 'decreased': 1 };

    moodScore += sadnessMap[formData.sadnessDurationFrequency] || 0;
    moodScore += parseInt(formData.pleasureLossDegree) || 0;
    moodScore += parseInt(formData.fatigueLevel) || 0;
    moodScore += appetiteMap[formData.appetiteChanges] || 0;
    engineeredFeatures.mood_raw_score = moodScore;

    if (formData.primaryConcern === 'depression') {
      if (moodScore >= 8) { // Example threshold
        indicators.push('Responses suggest potential symptoms of low mood or depression (based on score).');
        recommendation += ' Engaging in enjoyable activities, maintaining social connections, and establishing a consistent routine can be supportive. Consulting with a mental health professional for a thorough assessment and potential treatment is advised.';
      } else {
        recommendation += ' Continue to prioritize self-care and monitor your mood.';
      }
    }

    // --- Learning & Memory Scoring ---
    let learningScore = 0;
    learningScore += frequencyMap[formData.recentMemoryIssues] || 0;
    learningScore += frequencyMap[formData.followingInstructionsDifficulty] || 0;
    learningScore += difficultyMap[formData.newSkillLearningDifficulty] || 0;
    learningScore += frequencyMap[formData.expressingThoughtsDifficulty] || 0;
    engineeredFeatures.learning_raw_score = learningScore;

    if (formData.primaryConcern === 'learning') {
      if (learningScore >= 8) { // Example threshold
        indicators.push('Responses indicate potential areas of learning or cognitive processing challenges (based on score).');
        recommendation += ' Exploring strategies for memory enhancement, organization, and communication may be helpful. Consulting with an educational psychologist or a specialist in learning differences could provide valuable insights and support.';
      } else {
        recommendation += ' Continue to be aware of your learning style and seek strategies that work best for you.';
      }
    }

    if (indicators.length > 0) {
      result = indicators.join(' ');
    } else {
      result = `Based on your responses related to ${formData.primaryConcern}, no strong indicators were identified at this time.`;
    }

    setAssessmentResult(JSON.stringify({ rawResponses: formData, engineeredFeatures }, null, 2));
    setRecommendations(result + ' ' + recommendation + ' This is a preliminary self-assessment and not a clinical diagnosis. A comprehensive evaluation by a qualified professional is essential for accurate diagnosis and personalized recommendations.');
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const formData = {
      primaryConcern,
      difficultyConcentratingFrequency, mindWanderingFrequency, taskCompletionDifficulty, organizingTasksDifficulty,
      worryIntensity: parseInt(worryIntensity), racingThoughtsFrequency, avoidingSituations, sleepDisturbanceAnxiety,
      sadnessDurationFrequency, pleasureLossDegree: parseInt(pleasureLossDegree), fatigueLevel: parseInt(fatigueLevel), appetiteChanges,
      recentMemoryIssues, followingInstructionsDifficulty, newSkillLearningDifficulty, expressingThoughtsDifficulty,
    };
    analyzeResponses(formData);
  };

  return (
    <div className="self-assmnt-container">
      <h2>Initial Cognitive Self-Assessment</h2>
      <form onSubmit={handleFormSubmit}>
        <div className="form-group">
          <label htmlFor="primaryConcern">Primary Cognitive Concern:</label>
          <select id="primaryConcern" value={primaryConcern} onChange={(e) => setPrimaryConcern(e.target.value)} required>
            <option value="">Select</option>
            <option value="focus">Focus & Attention</option>
            <option value="anxiety">Anxiety</option>
            <option value="depression">Mood & Depression</option>
            <option value="learning">Learning & Memory</option>
          </select>
        </div>

        {primaryConcern === 'focus' && (
          <>
            <div className="form-group">
              <label htmlFor="difficultyConcentratingFrequency">How often do you have difficulty concentrating on tasks?</label>
              <select id="difficultyConcentratingFrequency" value={difficultyConcentratingFrequency} onChange={(e) => setDifficultyConcentratingFrequency(e.target.value)}>
                <option value="">Select</option>
                <option value="rarely">Rarely</option>
                <option value="sometimes">Sometimes</option>
                <option value="often">Often</option>
                <option value="veryOften">Very Often</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="mindWanderingFrequency">How often does your mind wander during tasks or conversations?</label>
              <select id="mindWanderingFrequency" value={mindWanderingFrequency} onChange={(e) => setMindWanderingFrequency(e.target.value)}>
                <option value="">Select</option>
                <option value="rarely">Rarely</option>
                <option value="sometimes">Sometimes</option>
                <option value="often">Often</option>
                <option value="veryOften">Very Often</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="taskCompletionDifficulty">How often do you struggle to finish tasks you start?</label>
              <select id="taskCompletionDifficulty" value={taskCompletionDifficulty} onChange={(e) => setTaskCompletionDifficulty(e.target.value)}>
                <option value="">Select</option>
                <option value="rarely">Rarely</option>
                <option value="sometimes">Sometimes</option>
                <option value="often">Often</option>
                <option value="veryOften">Very Often</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="organizingTasksDifficulty">How difficult do you find organizing tasks and responsibilities?</label>
              <select id="organizingTasksDifficulty" value={organizingTasksDifficulty} onChange={(e) => setOrganizingTasksDifficulty(e.target.value)}>
                <option value="">Select</option>
                <option value="notDifficult">Not Difficult</option>
                <option value="slightlyDifficult">Slightly Difficult</option>
                <option value="moderatelyDifficult">Moderately Difficult</option>
                <option value="veryDifficult">Very Difficult</option>
              </select>
            </div>
          </>
        )}

        {primaryConcern === 'anxiety' && (
          <>
            <div className="form-group">
              <label htmlFor="worryIntensity">On a scale of 1 (Mild) to 5 (Severe), how intense are your worries?</label>
              <input type="number" id="worryIntensity" value={worryIntensity} onChange={(e) => setWorryIntensity(e.target.value)} min="1" max="5" />
            </div>
            <div className="form-group">
              <label htmlFor="racingThoughtsFrequency">How often do you experience racing thoughts that are hard to control?</label>
              <select id="racingThoughtsFrequency" value={racingThoughtsFrequency} onChange={(e) => setRacingThoughtsFrequency(e.target.value)}>
                <option value="">Select</option>
                <option value="rarely">Rarely</option>
                <option value="sometimes">Sometimes</option>
                <option value="often">Often</option>
                <option value="veryOften">Very Often</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="avoidingSituations">How often do you avoid situations that make you feel anxious?</label>
              <select id="avoidingSituations" value={avoidingSituations} onChange={(e) => setAvoidingSituations(e.target.value)}>
                <option value="">Select</option>
                <option value="rarely">Rarely</option>
                <option value="sometimes">Sometimes</option>
                <option value="often">Often</option>
                <option value="veryOften">Very Often</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="sleepDisturbanceAnxiety">How often does anxiety interfere with your sleep?</label>
              <select id="sleepDisturbanceAnxiety" value={sleepDisturbanceAnxiety} onChange={(e) => setSleepDisturbanceAnxiety(e.target.value)}>
                <option value="">Select</option>
                <option value="rarely">Rarely</option>
                <option value="sometimes">Sometimes</option>
                <option value="often">Often</option>
                <option value="veryOften">Very Often</option>
              </select>
            </div>
          </>
        )}

        {primaryConcern === 'depression' && (
          <>
            <div className="form-group">
              <label htmlFor="sadnessDurationFrequency">In the past two weeks, how often did you feel sad, down, or hopeless for most of the day?</label>
              <select id="sadnessDurationFrequency" value={sadnessDurationFrequency} onChange={(e) => setSadnessDurationFrequency(e.target.value)}>
                <option value="">Select</option>
                <option value="rarely">Rarely</option>
                <option value="sometimes">Sometimes</option>
                <option value="moreThanTwoWeeks">More than a few days</option>
                <option value="almostDaily">Almost Daily</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="pleasureLossDegree">On a scale of 1 (No loss) to 5 (Complete loss), how much have you lost interest or pleasure in activities?</label>
              <input type="number" id="pleasureLossDegree" value={pleasureLossDegree} onChange={(e) => setPleasureLossDegree(e.target.value)} min="1" max="5" />
            </div>
            <div className="form-group">
              <label htmlFor="fatigueLevel">On a scale of 1 (No fatigue) to 5 (Severe fatigue), how would you rate your energy levels?</label>
              <input type="number" id="fatigueLevel" value={fatigueLevel} onChange={(e) => setFatigueLevel(e.target.value)} min="1" max="5" />
            </div>
            <div className="form-group">
              <label htmlFor="appetiteChanges">Have you noticed significant changes in your appetite or weight recently?</label>
              <select id="appetiteChanges" value={appetiteChanges} onChange={(e) => setAppetiteChanges(e.target.value)}>
                <option value="">Select</option>
                <option value="noChange">No Change</option>
                <option value="increased">Increased</option>
                <option value="decreased">Decreased</option>
              </select>
            </div>
          </>
        )}

        {primaryConcern === 'learning' && (
          <>
            <div className="form-group">
              <label htmlFor="recentMemoryIssues">How often do you have trouble remembering recently learned information?</label>
              <select id="recentMemoryIssues" value={recentMemoryIssues} onChange={(e) => setRecentMemoryIssues(e.target.value)}>
                <option value="">Select</option>
                <option value="rarely">Rarely</option>
                <option value="sometimes">Sometimes</option>
                <option value="often">Often</option>
                <option value="veryOften">Very Often</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="followingInstructionsDifficulty">How often do you find it difficult to follow multi-step instructions?</label>
              <select id="followingInstructionsDifficulty" value={followingInstructionsDifficulty} onChange={(e) => setFollowingInstructionsDifficulty(e.target.value)}>
                <option value="">Select</option>
                <option value="rarely">Rarely</option>
                <option value="sometimes">Sometimes</option>
                <option value="often">Often</option>
                <option value="veryOften">Very Often</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="newSkillLearningDifficulty">How difficult do you find learning new skills or information compared to others?</label>
              <select id="newSkillLearningDifficulty" value={newSkillLearningDifficulty} onChange={(e) => setNewSkillLearningDifficulty(e.target.value)}>
                <option value="">Select</option>
                <option value="notDifficult">Not Difficult</option>
                <option value="slightlyDifficult">Slightly Difficult</option>
                <option value="moderatelyDifficult">Moderately Difficult</option>
                <option value="veryDifficult">Very Difficult</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="expressingThoughtsDifficulty">How often do you struggle to express your thoughts clearly, either verbally or in writing?</label>
              <select id="expressingThoughtsDifficulty" value={expressingThoughtsDifficulty} onChange={(e) => setExpressingThoughtsDifficulty(e.target.value)}>
                <option value="">Select</option>
                <option value="rarely">Rarely</option>
                <option value="sometimes">Sometimes</option>
                <option value="veryOften">Very Often</option>
              </select>
            </div>
          </>
        )}

        <button type="submit">Submit Assessment</button>
      </form>

      {assessmentResult && (
        <div className="assessment-results">
          <h3>Initial Assessment:</h3>
          <pre>{assessmentResult}</pre>
          <h3>Recommendations:</h3>
          <p>{recommendations}</p>
          <p className="disclaimer">**Important Note:** This is a preliminary self-assessment based on your reported experiences and is not a clinical diagnosis. The information provided here is for informational purposes only and should not be considered a substitute for professional medical advice, diagnosis, or treatment. A comprehensive evaluation by a qualified mental health professional or healthcare provider is essential for an accurate understanding of your cognitive well-being and to receive personalized recommendations, including potential neurofeedback therapy or other interventions.</p>
          <button onClick={() => navigate('/therapist-selection')}>Explore Therapists</button>
        </div>
      )}
    </div>
  );
};

export default SelfAssmnt;
                