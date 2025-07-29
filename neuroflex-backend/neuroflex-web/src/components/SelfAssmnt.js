import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

import { auth, db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

import './SelfAssmnt.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const gammaThresholds = {
    focus: 8,
    anxietyDepression: 14,
    learning: 8,
};

// Updated interpretationDetails for enhanced emojis/icons and consistent phrasing
const interpretationDetails = {
    focus: {
        alpha: {
            summary: [
                'Your Focus and Attention performance is <strong>Excellent (Alpha Level)</strong>. You show optimal concentration and effective task management. ✨',
            ],
            full: [
                'Optimal focus, good concentration, minimal distractions, and effective task management.',
                'Your performance in Focus and Attention is <strong>Excellent (Alpha Level)</strong>. This means you generally experience strong cognitive control and efficient processing.',
                'You likely find it easy to concentrate, maintain attention, and complete tasks without significant mental effort.',
                'This is a very positive indicator for cognitive well-being. Keep up the great work! 😊',
            ],
        },
        beta: {
            summary: [
                'Your Focus and Attention performance is <strong>Moderate (Beta Level)</strong>. You might experience occasional difficulty concentrating or mind wandering. 💡',
            ],
            full: [
                'Occasional difficulty concentrating, mind wandering, or some challenges with task completion and organization.',
                'You might find certain environments or tasks more challenging for focus.',
                'Your performance in Focus and Attention is <strong>Moderate (Beta Level)</strong>. While generally functional, these occasional lapses suggest areas where attention might be less sustained, or where distractions have a greater impact.',
                'Strategies to enhance focus and reduce distractions could be beneficial. Consider exploring new techniques! 🧐',
            ],
        },
        gamma: {
            summary: [
                'Your Focus and Attention performance is <strong>Critical (Gamma Level)</strong>. You report significant and frequent difficulties with concentration. ⚠️',
            ],
            full: [
                'Significant and frequent difficulties with concentration, persistent mind wandering, and consistent struggle with task completion and organization.',
                'These challenges may be impacting your daily activities and productivity.',
                'Your performance in Focus and Attention is <strong>Critical (Gamma Level)</strong>. Such persistent issues often indicate underlying cognitive or emotional factors that warrant professional attention.',
                'Seeking guidance from a specialist is highly recommended to explore potential interventions like neurofeedback or other therapies. We are here to help! 🤝',
            ],
        },
    },
    anxietyDepression: {
        alpha: {
            summary: [
                'Your Anxiety and Depression levels are <strong>Excellent (Alpha Level)</strong>. You demonstrate healthy emotional well-being and stress management. 🌟',
            ],
            full: [
                'Healthy emotional well-being, good stress management, stable mood, and minimal worry or fatigue.',
                'Your performance in Anxiety and Depression is <strong>Excellent (Alpha Level)</strong>. This indicates a strong emotional resilience and a balanced psychological state.',
                'You are likely adept at managing life\'s stressors and maintaining a positive outlook. This is a great foundation for overall well-being. Celebrate your calm! 🧘',
            ],
        },
        beta: {
            summary: [
                'Your Anxiety and Depression levels are <strong>Moderate (Beta Level)</strong>. You may experience moderate worries or occasional periods of low mood. ☁️',
            ],
            full: [
                'Moderate worries, occasional racing thoughts, some periods of low mood or fatigue, or mild sleep disturbances.',
                'You might benefit from exploring stress-reduction techniques or seeking support during challenging times.',
                'Your performance in Anxiety and Depression is <strong>Moderate (Beta Level)</strong>. While generally functional, these symptoms, while not severe, suggest a need for proactive self-care and potential minor adjustments in lifestyle or coping strategies to prevent escalation and improve emotional comfort. Small steps can make a big difference! 🌱',
            ],
        },
        gamma: {
            summary: [
                'Your Anxiety and Depression levels are <strong>Critical (Gamma Level)</strong>. You report intense and persistent worries and significant fatigue. 🚨',
            ],
            full: [
                'Intense and persistent worries, frequent racing thoughts, prolonged sadness/loss of pleasure, and significant fatigue impacting daily life.',
                'These symptoms suggest a need for professional guidance from a mental health expert and comprehensive support.',
                'Your performance in Anxiety and Depression is <strong>Critical (Gamma Level)</strong>. Such severe and ongoing symptoms often indicate a clinical level of distress that requires immediate professional assessment and intervention, potentially including therapy, medication, or targeted neurofeedback protocols. Reach out for support; you are not alone. ❤️‍🩹',
            ],
        },
    },
    learning: {
        alpha: {
            summary: [
                'Your Learning and Memory performance is <strong>Excellent (Alpha Level)</strong>. You have strong memory and learn new skills easily. 🧠',
            ],
            full: [
                'Strong memory, easy to follow instructions, quick at learning new skills, and clear expression of thoughts.',
                'Your performance in Learning and Memory is <strong>Excellent (Alpha Level)</strong>. This signifies robust cognitive functions related to acquiring, retaining, and recalling information.',
                'You likely find academic or professional learning tasks straightforward and communication effective. This is a significant asset for personal and professional development. Keep growing! 📈',
            ],
        },
        beta: {
            summary: [
                'Your Learning and Memory performance is <strong>Moderate (Beta Level)</strong>. You might experience occasional trouble remembering new information or following multi-step instructions. 📚',
            ],
            full: [
                'Occasional trouble remembering new information, minor difficulty with multi-step instructions, takes a bit longer to learn new skills, or sometimes struggles to express thoughts clearly.',
                'Exploring different learning strategies or memory aids might be beneficial.',
                'Your performance in Learning and Memory is <strong>Moderate (Beta Level)</strong>. While these challenges are not debilitating, they indicate an opportunity to optimize your learning processes and memory recall through targeted exercises or cognitive strategies. Every effort counts! ✍️',
            ],
        },
        gamma: {
            summary: [
                'Your Learning and Memory performance is <strong>Critical (Gamma Level)</strong>. You report persistent and significant difficulty with memory and new skill acquisition. ⛔',
            ],
            full: [
                'Persistent and significant difficulty with memory, frequent challenges following multi-step instructions, substantial struggle with new skill acquisition, and noticeable difficulty expressing thoughts verbally or in writing.',
                'A comprehensive evaluation by an educational psychologist or specialist in learning differences is highly recommended.',
                'Your performance in Learning and Memory is <strong>Critical (Gamma Level)</strong>. These severe and impactful learning and memory issues often point to underlying neurological or developmental considerations that require thorough professional assessment and tailored interventions, such as specialized learning programs or neurofeedback therapy. Professional guidance can illuminate the path forward. 💡',
            ],
        },
    },
};

const getPerformanceLevelAndColor = (score, concernType) => {
    const gammaThreshold = gammaThresholds[concernType];
    const betaThreshold = Math.round(gammaThreshold * 0.5);

    let level = '';
    let color = '';
    let summaryInterpretation = [];
    let fullInterpretation = [];

    if (score >= gammaThreshold) {
        level = 'Gamma Level Performance';
        color = 'rgba(255, 99, 132, 0.8)';
        summaryInterpretation = interpretationDetails[concernType].gamma.summary;
        fullInterpretation = interpretationDetails[concernType].gamma.full;
    } else if (score >= betaThreshold) {
        level = 'Beta Level Performance';
        color = 'rgba(255, 159, 64, 0.8)';
        summaryInterpretation = interpretationDetails[concernType].beta.summary;
        fullInterpretation = interpretationDetails[concernType].beta.full;
    } else {
        level = 'Alpha Level Performance';
        color = 'rgba(75, 192, 192, 0.8)';
        summaryInterpretation = interpretationDetails[concernType].alpha.summary;
        fullInterpretation = interpretationDetails[concernType].alpha.full;
    }
    return { level, color, betaThreshold, gammaThreshold, summaryInterpretation, fullInterpretation };
};

const SelfAssmnt = () => {
    const [primaryConcern, setPrimaryConcern] = useState('');
    const [difficultyConcentratingFrequency, setDifficultyConcentratingFrequency] = useState('');
    const [mindWanderingFrequency, setMindWanderingFrequency] = useState('');
    const [taskCompletionDifficulty, setTaskCompletionDifficulty] = useState('');
    const [organizingTasksDifficulty, setOrganizingTasksDifficulty] = useState('');
    const [worryIntensity, setWorryIntensity] = useState('');
    const [racingThoughtsFrequency, setRacingThoughtsFrequency] = useState('');
    const [sadnessDurationFrequency, setSadnessDurationFrequency] = useState('');
    const [pleasureLossDegree, setPleasureLossDegree] = useState('');
    const [fatigueLevel, setFatigueLevel] = useState('');
    const [recentMemoryIssues, setRecentMemoryIssues] = useState('');
    const [followingInstructionsDifficulty, setFollowingInstructionsDifficulty] = useState('');
    const [newSkillLearningDifficulty, setNewSkillLearningDifficulty] = useState('');
    const [expressingThoughtsDifficulty, setExpressingThoughtsDifficulty] = useState('');

    const [assessmentResult, setAssessmentResult] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [summaryRecommendation, setSummaryRecommendation] = useState([]);
    const [showFullInterpretation, setShowFullInterpretation] = useState(false);

    const navigate = useNavigate();

    const [currentUserId, setCurrentUserId] = useState(null);
    const [isFirebaseReady, setIsFirebaseReady] = useState(false);
    const [firebaseError, setFirebaseError] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("onAuthStateChanged fired. User:", user);
            if (user) {
                setCurrentUserId(user.uid);
                setIsFirebaseReady(true);
                console.log("Authenticated User ID:", user.uid);
            } else {
                console.log("No user found, attempting anonymous sign-in...");
                try {
                    await signInAnonymously(auth);
                } catch (anonSignInError) {
                    const msg = `Authentication failed: ${anonSignInError.message}`;
                    setFirebaseError(msg);
                    console.error(msg);
                    setIsFirebaseReady(false);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    const frequencyMap = { 'rarely': 1, 'sometimes': 2, 'often': 3, 'veryOften': 4 };
    const difficultyMap = { 'notDifficult': 1, 'slightlyDifficult': 2, 'moderatelyDifficult': 3, 'veryDifficult': 4 };
    const sadnessMap = { 'rarely': 1, 'sometimes': 2, 'moreThanTwoWeeks': 3, 'almostDaily': 4 };

    const saveAssessmentToFirestore = async (dataToSave) => {
        if (!db || !currentUserId || !isFirebaseReady) {
            setFirebaseError("Firestore or User ID not ready. Cannot save data. Please wait for initialization.");
            console.error("Firestore or User ID not ready. Cannot save data.");
            return;
        }
        try {
            const userAssessmentsCollectionRef = collection(db, 'users', currentUserId, 'assessments');
            await addDoc(userAssessmentsCollectionRef, {
                ...dataToSave,
                timestamp: serverTimestamp(),
                userId: currentUserId,
            });
            console.log("Assessment saved to Firestore!");
        } catch (error) {
            console.error("Error saving assessment to Firestore:", error);
            setFirebaseError(`Failed to save data: ${error.message}`);
        }
    };

    const analyzeResponses = (formData) => {
        let engineeredFeatures = {};
        let summaryTextArray = [];
        let fullTextArray = [];
        let identifiedConcernsForSession = [];
        let performanceLevelForPrimaryConcern = '';

        let focusScore = 0;
        focusScore += frequencyMap[formData.difficultyConcentratingFrequency] || 0;
        focusScore += frequencyMap[formData.mindWanderingFrequency] || 0;
        focusScore += frequencyMap[formData.taskCompletionDifficulty] || 0;
        focusScore += difficultyMap[formData.organizingTasksDifficulty] || 0;
        engineeredFeatures.focus_raw_score = focusScore;

        if (formData.primaryConcern === 'focus') {
            const { level, summaryInterpretation, fullInterpretation } = getPerformanceLevelAndColor(focusScore, 'focus');
            summaryTextArray = summaryInterpretation;
            fullTextArray = fullInterpretation;
            identifiedConcernsForSession.push(`Focus (${level.split(' ')[0]})`);
            performanceLevelForPrimaryConcern = level;
        }

        let combinedAnxietyDepressionScore = 0;
        combinedAnxietyDepressionScore += parseInt(formData.worryIntensity) || 0;
        combinedAnxietyDepressionScore += frequencyMap[formData.racingThoughtsFrequency] || 0;
        combinedAnxietyDepressionScore += sadnessMap[formData.sadnessDurationFrequency] || 0;
        combinedAnxietyDepressionScore += parseInt(formData.pleasureLossDegree) || 0;
        combinedAnxietyDepressionScore += parseInt(formData.fatigueLevel) || 0;
        engineeredFeatures.anxietyDepression_raw_score = combinedAnxietyDepressionScore;

        if (formData.primaryConcern === 'anxietyDepression') {
            const { level, summaryInterpretation, fullInterpretation } = getPerformanceLevelAndColor(combinedAnxietyDepressionScore, 'anxietyDepression');
            summaryTextArray = summaryInterpretation;
            fullTextArray = fullInterpretation;
            identifiedConcernsForSession.push(`Anxiety & Depression (${level.split(' ')[0]})`);
            performanceLevelForPrimaryConcern = level;
        }

        let learningScore = 0;
        learningScore += frequencyMap[formData.recentMemoryIssues] || 0;
        learningScore += frequencyMap[formData.followingInstructionsDifficulty] || 0;
        learningScore += difficultyMap[formData.newSkillLearningDifficulty] || 0;
        learningScore += frequencyMap[formData.expressingThoughtsDifficulty] || 0;
        engineeredFeatures.learning_raw_score = learningScore;

        if (formData.primaryConcern === 'learning') {
            const { level, summaryInterpretation, fullInterpretation } = getPerformanceLevelAndColor(learningScore, 'learning');
            summaryTextArray = summaryInterpretation;
            fullTextArray = fullInterpretation;
            identifiedConcernsForSession.push(`Learning & Memory (${level.split(' ')[0]})`);
            performanceLevelForPrimaryConcern = level;
        }

        if (identifiedConcernsForSession.length === 0 && formData.primaryConcern) {
             const { level, summaryInterpretation, fullInterpretation } = getPerformanceLevelAndColor(0, formData.primaryConcern);
             const cleanedConcern = formData.primaryConcern.replace(/([A-Z])/g, ' $1').trim();
             identifiedConcernsForSession.push(`${cleanedConcern} (${level.split(' ')[0]})`);
             performanceLevelForPrimaryConcern = level;
             summaryTextArray = summaryInterpretation;
             fullTextArray = fullInterpretation;
        } else if (identifiedConcernsForSession.length === 0 && !formData.primaryConcern) {
            identifiedConcernsForSession.push('General Well-being (Alpha)');
            performanceLevelForPrimaryConcern = 'Alpha Level Performance';
            summaryTextArray = ['Please select a primary concern to get a tailored assessment.'];
            fullTextArray = summaryTextArray;
        }

        localStorage.setItem('selectedConcerns', JSON.stringify(identifiedConcernsForSession));

        const currentResult = {
            rawResponses: formData,
            engineeredFeatures,
            performanceLevel: performanceLevelForPrimaryConcern
        };
        setAssessmentResult(currentResult);

        const disclaimerPoint = 'This is a preliminary self-assessment and not a clinical diagnosis. The information provided here is for informational purposes only and should not be considered a substitute for professional medical advice, diagnosis, or treatment. A comprehensive evaluation by a qualified mental health professional or healthcare provider is essential for an accurate understanding of your cognitive well-being and to receive personalized recommendations, including potential neurofeedback therapy or other interventions.';
        
        // Capitalize the first letter of each sentence
        setSummaryRecommendation(summaryTextArray.map(s => s.charAt(0).toUpperCase() + s.slice(1)));
        setRecommendations([...fullTextArray.map(s => s.charAt(0).toUpperCase() + s.slice(1)), disclaimerPoint]);

        if (isFirebaseReady) {
            saveAssessmentToFirestore({
                primaryConcern: formData.primaryConcern,
                responses: formData,
                scores: engineeredFeatures,
                recommendations: [...fullTextArray, disclaimerPoint],
                performanceLevel: performanceLevelForPrimaryConcern,
            });
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        setShowFullInterpretation(false);
        analyzeResponses({
            primaryConcern,
            difficultyConcentratingFrequency, mindWanderingFrequency, taskCompletionDifficulty, organizingTasksDifficulty,
            worryIntensity: parseInt(worryIntensity) || null,
            racingThoughtsFrequency,
            sadnessDurationFrequency,
            pleasureLossDegree: parseInt(pleasureLossDegree) || null,
            fatigueLevel: parseInt(fatigueLevel) || null,
            recentMemoryIssues, followingInstructionsDifficulty, newSkillLearningDifficulty, expressingThoughtsDifficulty,
        });
    };

    const renderResponseItem = (label, value) => {
        if (value === null || value === '' || label === 'primaryConcern') {
            return null;
        }

        let formattedLabel = label.replace(/([A-Z])/g, ' $1').trim();
        let formattedValue = value;
        let className = 'response-value';

        const currentConcernType = primaryConcern;
        let itemScoreProxy = 0;
        if (typeof value === 'number') {
            if (value >= 4) { // Assuming 4-5 are high concern for 1-5 scale questions
                itemScoreProxy = gammaThresholds[currentConcernType] || 0;
            } else if (value >= 2) { // Assuming 2-3 are moderate concern
                itemScoreProxy = (gammaThresholds[currentConcernType] * 0.5) || 0;
            }
        } else if (typeof value === 'string') {
            // Mapping string values to a proxy score for visual feedback
            if (value === 'veryOften' || value === 'almostDaily' || value === 'moderatelyDifficult' || value === 'veryDifficult' || value === 'moreThanTwoWeeks') {
                itemScoreProxy = gammaThresholds[currentConcernType] || 0;
            } else if (value === 'often' || value === 'sometimes' || value === 'slightlyDifficult') {
                itemScoreProxy = (gammaThresholds[currentConcernType] * 0.5) || 0;
            }
        }

        const { level: itemLevel } = getPerformanceLevelAndColor(itemScoreProxy, currentConcernType);

        if (itemLevel === 'Gamma Level Performance') {
            className += ' potential-concern';
        } else if (itemLevel === 'Beta Level Performance') {
            className += ' moderate-concern';
        } else {
            className += ' low-concern';
        }

        return (
            <div key={label} className="response-item">
                <span className="response-label">{formattedLabel}:</span>
                <span className={className}>{formattedValue}</span>
            </div>
        );
    };


    const getChartDataAndOptions = (concernType, currentScores) => {
        if (!concernType || !currentScores) {
            return {
                data: { labels: [''], datasets: [] },
                options: { plugins: { title: { text: 'Select a Concern to See Chart' } } }
            };
        }

        let label = '';
        let scoreKey = '';
        let maxScorePossible = 0;

        switch (concernType) {
            case 'focus':
                label = 'Focus & Attention';
                scoreKey = 'focus_raw_score';
                maxScorePossible = 16;
                break;
            case 'anxietyDepression':
                label = 'Anxiety & Depression';
                scoreKey = 'anxietyDepression_raw_score';
                maxScorePossible = 20;
                break;
            case 'learning':
                label = 'Learning & Memory';
                scoreKey = 'learning_raw_score';
                maxScorePossible = 16;
                break;
            default:
                return {
                    data: { labels: [''], datasets: [] },
                    options: { plugins: { title: { text: 'Invalid Concern Selected' } } }
                };
        }

        const currentScoreValue = currentScores[scoreKey] || 0;
        const { level: performanceLevel, color: barColor, betaThreshold, gammaThreshold } = getPerformanceLevelAndColor(currentScoreValue, concernType);

        const alphaZoneColor = 'rgba(75, 192, 192, 0.2)';
        const betaZoneColor = 'rgba(255, 159, 64, 0.2)';
        const gammaZoneColor = 'rgba(255, 99, 132, 0.2)';

        return {
            data: {
                labels: [label],
                datasets: [
                    {
                        label: 'Excellent (Alpha Zone)',
                        data: [betaThreshold],
                        backgroundColor: alphaZoneColor,
                        borderColor: 'transparent',
                        borderWidth: 0,
                        barPercentage: 1,
                        categoryPercentage: 1,
                        stack: 'zones',
                        order: 1,
                    },
                    {
                        label: 'Moderate (Beta Zone)',
                        data: [gammaThreshold - betaThreshold],
                        backgroundColor: betaZoneColor,
                        borderColor: 'transparent',
                        borderWidth: 0,
                        barPercentage: 1,
                        categoryPercentage: 1,
                        stack: 'zones',
                        order: 2,
                    },
                    {
                        label: 'Critical (Gamma Zone)',
                        data: [maxScorePossible - gammaThreshold +1], // +1 to ensure the max score falls within this zone's visual range
                        backgroundColor: gammaZoneColor,
                        borderColor: 'transparent',
                        borderWidth: 0,
                        barPercentage: 1,
                        categoryPercentage: 1,
                        stack: 'zones',
                        order: 3,
                    },
                    {
                        label: `Your Score: ${performanceLevel.split(' ')[0]}`,
                        data: [currentScoreValue],
                        backgroundColor: barColor,
                        borderColor: barColor.replace('0.8)', '1)'),
                        borderWidth: 1,
                        barPercentage: 0.8,
                        categoryPercentage: 0.8,
                        order: 4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'x',
                scales: {
                    x: {
                        ticks: {
                            color: '#343a40'
                        },
                        grid: {
                            display: false
                        },
                        stacked: false,
                    },
                    y: {
                        beginAtZero: true,
                        max: maxScorePossible,
                        title: {
                            display: true,
                            text: 'Score (Higher score indicates more concern)',
                            color: '#194b45'
                        },
                        ticks: {
                            stepSize: 1,
                            color: '#343a40'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        stacked: true, // This stacking is for the background zones
                    },
                },
                plugins: {
                    title: {
                        display: true,
                        text: `Cognitive Performance: ${label}`,
                        color: '#194b45',
                        font: {
                            size: 18,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: '#343a40',
                            // Only show the legend for "Your Score" to avoid clutter
                            filter: function(legendItem, chartData) {
                                return legendItem.datasetIndex === 3;
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (context.dataset.stack === 'zones') {
                                    const datasetIndex = context.datasetIndex;
                                    let range = '';
                                    if (datasetIndex === 2) { range = `Score >= ${gammaThreshold}`; }
                                    else if (datasetIndex === 1) { range = `Score ${betaThreshold}-${gammaThreshold - 1}`; }
                                    else if (datasetIndex === 0) { range = `Score 0-${betaThreshold - 1}`; }
                                    return `${label}: ${range}`;
                                } else {
                                    return `${label}: ${context.raw}`;
                                }
                            }
                        }
                    },
                },
            },
        };
    };

    const chartConfig = assessmentResult ? getChartDataAndOptions(primaryConcern, assessmentResult.engineeredFeatures) : getChartDataAndOptions(null, null);

    return (
        <div className="self-assessment-container">
            <h1 className="assessment-title">Cognitive Self-Assessment</h1>
            <p className="assessment-intro">
                Please answer the following questions to help us understand your primary concerns.
                Your responses will help tailor recommendations.
            </p>

            {firebaseError && (
                <div className="firebase-error-message">
                    <p>Error: {firebaseError}</p>
                    <p>Please ensure you are connected to the internet and refresh the page if the issue persists.</p>
                </div>
            )}

            <form onSubmit={handleFormSubmit} className="assessment-form">
                <div className="form-section">
                    <label htmlFor="primaryConcern" className="form-label">What is your primary concern?</label>
                    <select
                        id="primaryConcern"
                        className="form-select"
                        value={primaryConcern}
                        onChange={(e) => setPrimaryConcern(e.target.value)}
                        required
                    >
                        <option value="">Select an area</option>
                        <option value="focus">Focus & Attention</option>
                        <option value="anxietyDepression">Anxiety & Depression</option>
                        <option value="learning">Learning & Memory</option>
                    </select>
                </div>

                {primaryConcern === 'focus' && (
                    <div className="form-section">
                        <h2 className="section-title">🧠 Focus & Attention</h2>
                        <div className="form-group">
                            <label className="question-label">How often do you experience difficulty concentrating on tasks?</label>
                            <div className="radio-group">
                                <label><input type="radio" name="difficultyConcentratingFrequency" value="rarely" onChange={(e) => setDifficultyConcentratingFrequency(e.target.value)} required={primaryConcern === 'focus'} /> Rarely</label>
                                <label><input type="radio" name="difficultyConcentratingFrequency" value="sometimes" onChange={(e) => setDifficultyConcentratingFrequency(e.target.value)} /> Sometimes</label>
                                <label><input type="radio" name="difficultyConcentratingFrequency" value="often" onChange={(e) => setDifficultyConcentratingFrequency(e.target.value)} /> Often</label>
                                <label><input type="radio" name="difficultyConcentratingFrequency" value="veryOften" onChange={(e) => setDifficultyConcentratingFrequency(e.target.value)} /> Very Often</label>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="question-label">How frequently does your mind wander during conversations or tasks?</label>
                            <div className="radio-group">
                                <label><input type="radio" name="mindWanderingFrequency" value="rarely" onChange={(e) => setMindWanderingFrequency(e.target.value)} required={primaryConcern === 'focus'} /> Rarely</label>
                                <label><input type="radio" name="mindWanderingFrequency" value="sometimes" onChange={(e) => setMindWanderingFrequency(e.target.value)} /> Sometimes</label>
                                <label><input type="radio" name="mindWanderingFrequency" value="often" onChange={(e) => setMindWanderingFrequency(e.target.value)} /> Often</label>
                                <label><input type="radio" name="mindWanderingFrequency" value="veryOften" onChange={(e) => setMindWanderingFrequency(e.target.value)} /> Very Often</label>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="question-label">How difficult is it for you to complete tasks once started?</label>
                            <div className="radio-group">
                                <label><input type="radio" name="taskCompletionDifficulty" value="notDifficult" onChange={(e) => setTaskCompletionDifficulty(e.target.value)} required={primaryConcern === 'focus'} /> Not Difficult</label>
                                <label><input type="radio" name="taskCompletionDifficulty" value="slightlyDifficult" onChange={(e) => setTaskCompletionDifficulty(e.target.value)} /> Slightly Difficult</label>
                                <label><input type="radio" name="taskCompletionDifficulty" value="moderatelyDifficult" onChange={(e) => setTaskCompletionDifficulty(e.target.value)} /> Moderately Difficult</label>
                                <label><input type="radio" name="taskCompletionDifficulty" value="veryDifficult" onChange={(e) => setTaskCompletionDifficulty(e.target.value)} /> Very Difficult</label>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="question-label">How well do you manage to organize tasks and prioritize them?</label>
                            <div className="radio-group">
                                <label><input type="radio" name="organizingTasksDifficulty" value="notDifficult" onChange={(e) => setOrganizingTasksDifficulty(e.target.value)} required={primaryConcern === 'focus'} /> Very Well</label>
                                <label><input type="radio" name="organizingTasksDifficulty" value="slightlyDifficult" onChange={(e) => setOrganizingTasksDifficulty(e.target.value)} /> Fairly Well</label>
                                <label><input type="radio" name="organizingTasksDifficulty" value="moderatelyDifficult" onChange={(e) => setOrganizingTasksDifficulty(e.target.value)} /> With Some Difficulty</label>
                                <label><input type="radio" name="organizingTasksDifficulty" value="veryDifficult" onChange={(e) => setOrganizingTasksDifficulty(e.target.value)} /> Very Difficult</label>
                            </div>
                        </div>
                    </div>
                )}

                {primaryConcern === 'anxietyDepression' && (
                    <div className="form-section">
                        <h2 className="section-title">☁️ Anxiety & Depression</h2>
                        <div className="form-group">
                            <label className="question-label">On a scale of 1-5, how intense are your worries (1=minimal, 5=overwhelming)?</label>
                            <input type="number" name="worryIntensity" min="1" max="5" value={worryIntensity} onChange={(e) => setWorryIntensity(e.target.value)} required={primaryConcern === 'anxietyDepression'} className="number-input" />
                        </div>
                        <div className="form-group">
                            <label className="question-label">How often do you experience racing thoughts or an inability to calm your mind?</label>
                            <div className="radio-group">
                                <label><input type="radio" name="racingThoughtsFrequency" value="rarely" onChange={(e) => setRacingThoughtsFrequency(e.target.value)} required={primaryConcern === 'anxietyDepression'} /> Rarely</label>
                                <label><input type="radio" name="racingThoughtsFrequency" value="sometimes" onChange={(e) => setRacingThoughtsFrequency(e.target.value)} /> Sometimes</label>
                                <label><input type="radio" name="racingThoughtsFrequency" value="often" onChange={(e) => setRacingThoughtsFrequency(e.target.value)} /> Often</label>
                                <label><input type="radio" name="racingThoughtsFrequency" value="veryOften" onChange={(e) => setRacingThoughtsFrequency(e.target.value)} /> Very Often</label>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="question-label">How often do you feel sad, down, or hopeless, even for prolonged periods?</label>
                            <div className="radio-group">
                                <label><input type="radio" name="sadnessDurationFrequency" value="rarely" onChange={(e) => setSadnessDurationFrequency(e.target.value)} required={primaryConcern === 'anxietyDepression'} /> Rarely/Never</label>
                                <label><input type="radio" name="sadnessDurationFrequency" value="sometimes" onChange={(e) => setSadnessDurationFrequency(e.target.value)} /> Sometimes (brief periods)</label>
                                <label><input type="radio" name="sadnessDurationFrequency" value="moreThanTwoWeeks" onChange={(e) => setSadnessDurationFrequency(e.target.value)} /> More than two weeks</label>
                                <label><input type="radio" name="sadnessDurationFrequency" value="almostDaily" onChange={(e) => setSadnessDurationFrequency(e.target.value)} /> Almost daily</label>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="question-label">On a scale of 1-5, how much do you experience a loss of pleasure or interest in activities you once enjoyed (1=minimal, 5=complete loss)?</label>
                            <input type="number" name="pleasureLossDegree" min="1" max="5" value={pleasureLossDegree} onChange={(e) => setPleasureLossDegree(e.target.value)} required={primaryConcern === 'anxietyDepression'} className="number-input" />
                        </div>
                        <div className="form-group">
                            <label className="question-label">On a scale of 1-5, how severe is your fatigue or loss of energy (1=minimal, 5=severe, impacting daily life)?</label>
                            <input type="number" name="fatigueLevel" min="1" max="5" value={fatigueLevel} onChange={(e) => setFatigueLevel(e.target.value)} required={primaryConcern === 'anxietyDepression'} className="number-input" />
                        </div>
                    </div>
                )}

                {primaryConcern === 'learning' && (
                    <div className="form-section">
                        <h2 className="section-title">📚 Learning & Memory</h2>
                        <div className="form-group">
                            <label className="question-label">How often do you have trouble remembering recent events or new information?</label>
                            <div className="radio-group">
                                <label><input type="radio" name="recentMemoryIssues" value="rarely" onChange={(e) => setRecentMemoryIssues(e.target.value)} required={primaryConcern === 'learning'} /> Rarely</label>
                                <label><input type="radio" name="recentMemoryIssues" value="sometimes" onChange={(e) => setRecentMemoryIssues(e.target.value)} /> Sometimes</label>
                                <label><input type="radio" name="recentMemoryIssues" value="often" onChange={(e) => setRecentMemoryIssues(e.target.value)} /> Often</label>
                                <label><input type="radio" name="recentMemoryIssues" value="veryOften" onChange={(e) => setRecentMemoryIssues(e.target.value)} /> Very Often</label>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="question-label">How difficult is it for you to follow multi-step instructions?</label>
                            <div className="radio-group">
                                <label><input type="radio" name="followingInstructionsDifficulty" value="notDifficult" onChange={(e) => setFollowingInstructionsDifficulty(e.target.value)} required={primaryConcern === 'learning'} /> Not Difficult</label>
                                <label><input type="radio" name="followingInstructionsDifficulty" value="slightlyDifficult" onChange={(e) => setFollowingInstructionsDifficulty(e.target.value)} /> Slightly Difficult</label>
                                <label><input type="radio" name="followingInstructionsDifficulty" value="moderatelyDifficult" onChange={(e) => setFollowingInstructionsDifficulty(e.target.value)} /> Moderately Difficult</label>
                                <label><input type="radio" name="followingInstructionsDifficulty" value="veryDifficult" onChange={(e) => setFollowingInstructionsDifficulty(e.target.value)} /> Very Difficult</label>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="question-label">How easily do you learn new skills or adapt to new routines?</label>
                            <div className="radio-group">
                                <label><input type="radio" name="newSkillLearningDifficulty" value="notDifficult" onChange={(e) => setNewSkillLearningDifficulty(e.target.value)} required={primaryConcern === 'learning'} /> Very Easily</label>
                                <label><input type="radio" name="newSkillLearningDifficulty" value="slightlyDifficult" onChange={(e) => setNewSkillLearningDifficulty(e.target.value)} /> Fairly Easily</label>
                                <label><input type="radio" name="newSkillLearningDifficulty" value="moderatelyDifficult" onChange={(e) => setNewSkillLearningDifficulty(e.target.value)} /> With Some Difficulty</label>
                                <label><input type="radio" name="newSkillLearningDifficulty" value="veryDifficult" onChange={(e) => setNewSkillLearningDifficulty(e.target.value)} /> Very Difficult</label>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="question-label">How often do you struggle to express your thoughts clearly, either verbally or in writing?</label>
                            <div className="radio-group">
                                <label><input type="radio" name="expressingThoughtsDifficulty" value="rarely" onChange={(e) => setExpressingThoughtsDifficulty(e.target.value)} required={primaryConcern === 'learning'} /> Rarely</label>
                                <label><input type="radio" name="expressingThoughtsDifficulty" value="sometimes" onChange={(e) => setExpressingThoughtsDifficulty(e.target.value)} /> Sometimes</label>
                                <label><input type="radio" name="expressingThoughtsDifficulty" value="often" onChange={(e) => setExpressingThoughtsDifficulty(e.target.value)} /> Often</label>
                                <label><input type="radio" name="expressingThoughtsDifficulty" value="veryOften" onChange={(e) => setExpressingThoughtsDifficulty(e.target.value)} /> Very Often</label>
                            </div>
                        </div>
                    </div>
                )}

                <button type="submit" className="submit-button" disabled={!primaryConcern}>
                    Get Assessment
                </button>
            </form>

            {assessmentResult && (
                <div className={`assessment-results-container ${assessmentResult.performanceLevel.toLowerCase().replace(/\s/g, '-')}`}>
                    <hr className="results-divider" />
                    <h2 className="results-title">Your Assessment Results</h2>
                    <div className="chart-container">
                        <Bar data={chartConfig.data} options={chartConfig.options} />
                    </div>

                    <div className={`interpretations ${assessmentResult.performanceLevel.toLowerCase().replace(/\s/g, '-')}`}>
                        <h3>Interpretation:</h3>
                        <ul>
                            {summaryRecommendation.map((point, index) => (
                                <li key={index} dangerouslySetInnerHTML={{ __html: point }}></li>
                            ))}
                            {!showFullInterpretation && recommendations.length > summaryRecommendation.length && (
                                <li className="read-more-wrapper">
                                    <button
                                        className="read-more-button"
                                        onClick={() => setShowFullInterpretation(true)}
                                    >
                                        Read More
                                    </button>
                                </li>
                            )}
                            {showFullInterpretation && recommendations.slice(summaryRecommendation.length).map((point, index) => (
                                <li key={`full-${index}`} dangerouslySetInnerHTML={{ __html: point }}></li>
                            ))}
                            {showFullInterpretation && (
                                <li className="read-less-wrapper">
                                    <button
                                        className="read-more-button"
                                        onClick={() => setShowFullInterpretation(false)}
                                    >
                                        Show Less
                                    </button>
                                </li>
                            )}
                        </ul>
                    </div>

                    <div className="response-review">
                        <h3>Your Responses:</h3>
                        {Object.entries(assessmentResult.rawResponses).map(([key, value]) =>
                            renderResponseItem(key, value)
                        )}
                    </div>
                    <button onClick={() => navigate('/find-therapist')} className="book-session-button">
                        Find a Therapist
                    </button>
                </div>
            )}
        </div>
    );
};

export default SelfAssmnt;