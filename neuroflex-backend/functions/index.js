const express = require("express");
const cors = require("cors");
const { functions } = require("./firebase");

const authRoutes = require("./auth");
const userRoutes = require("./users");
const sessionRoutes = require("./sessions");
const gameRoutes = require("./games");
const reportRoutes = require("./reports");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/sessions", sessionRoutes);
app.use("/games", gameRoutes);
app.use("/reports", reportRoutes);

// Export API
exports.api = functions.https.onRequest(app);
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.analyzeSelfAssessment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const userId = context.auth.uid;
  const { primaryConcern, ...responses } = data;

  // --- Basic Scoring ---
  let engineeredFeatures = {};
  let focusScore = 0;
  const frequencyMap = { 'rarely': 1, 'sometimes': 2, 'often': 3, 'veryOften': 4 };
  const difficultyMap = { 'notDifficult': 1, 'slightlyDifficult': 2, 'moderatelyDifficult': 3, 'veryDifficult': 4 };
  focusScore += frequencyMap[responses.difficultyConcentratingFrequency] || 0;
  focusScore += frequencyMap[responses.mindWanderingFrequency] || 0;
  focusScore += frequencyMap[responses.taskCompletionDifficulty] || 0;
  focusScore += difficultyMap[responses.organizingTasksDifficulty] || 0;
  engineeredFeatures.focus_raw_score = focusScore;

  let anxietyScore = 0;
  anxietyScore += parseInt(responses.worryIntensity) || 0;
  anxietyScore += frequencyMap[responses.racingThoughtsFrequency] || 0;
  anxietyScore += (responses.avoidingSituations === 'often' || responses.avoidingSituations === 'veryOften' ? 2 : 0);
  anxietyScore += (responses.sleepDisturbanceAnxiety === 'often' || responses.sleepDisturbanceAnxiety === 'veryOften' ? 2 : 0);
  engineeredFeatures.anxiety_raw_score = anxietyScore;

  let moodScore = 0;
  const sadnessMap = { 'rarely': 1, 'sometimes': 2, 'moreThanTwoWeeks': 3, 'almostDaily': 4 };
  const appetiteMap = { 'noChange': 0, 'increased': 1, 'decreased': 1 };
  moodScore += sadnessMap[responses.sadnessDurationFrequency] || 0;
  moodScore += parseInt(responses.pleasureLossDegree) || 0;
  moodScore += parseInt(responses.fatigueLevel) || 0;
  moodScore += appetiteMap[responses.appetiteChanges] || 0;
  engineeredFeatures.mood_raw_score = moodScore;

  let learningScore = 0;
  learningScore += frequencyMap[responses.recentMemoryIssues] || 0;
  learningScore += frequencyMap[responses.followingInstructionsDifficulty] || 0;
  learningScore += difficultyMap[responses.newSkillLearningDifficulty] || 0;
  learningScore += frequencyMap[responses.expressingThoughtsDifficulty] || 0;
  engineeredFeatures.learning_raw_score = learningScore;

  let aiRecommendations = [];
  let predictedIssues = [];

  // --- More Advanced Rule-Based Recommendations ---
  // Focus & Attention Recommendations
  if (primaryConcern === 'focus') {
    if (focusScore >= 9) {
      aiRecommendations.push("Based on your responses, there's a notable indication of focus and attention challenges. Consider incorporating structured planning tools, minimizing environmental distractions, and practicing mindfulness techniques. Neurofeedback training may also be a beneficial avenue to explore for enhancing focus. Consulting with a specialist could provide a comprehensive evaluation.");
      predictedIssues.push("potential_significant_focus_difficulty");
    } else if (focusScore >= 6) {
      aiRecommendations.push("You've indicated some difficulties with focus and attention. Experiment with time management techniques like the Pomodoro method, break down tasks into smaller steps, and try to identify specific triggers for distraction. Regular breaks and a structured routine might also help.");
      predictedIssues.push("potential_mild_focus_difficulty");
    } else {
      aiRecommendations.push("Continue to be mindful of your attention and focus in daily activities. Explore strategies like active listening and single-tasking to further enhance your concentration.");
    }
  }

  // Anxiety Recommendations
  if (primaryConcern === 'anxiety') {
    if (anxietyScore >= 8) {
      aiRecommendations.push("Your responses suggest a significant level of anxiety. Exploring mindfulness, deep breathing exercises, and progressive muscle relaxation could be helpful. Seeking guidance from a therapist specializing in anxiety disorders is recommended to develop personalized coping strategies and potentially explore cognitive behavioral therapy (CBT).");
      predictedIssues.push("potential_significant_anxiety");
    } else if (anxietyScore >= 5) {
      aiRecommendations.push("You've reported experiencing some anxiety. Consider incorporating regular relaxation exercises, identifying potential stressors in your life, and practicing healthy lifestyle habits such as regular sleep and exercise. If these feelings persist or worsen, seeking professional support could be beneficial.");
      predictedIssues.push("potential_mild_anxiety");
    } else {
      aiRecommendations.push("Continue to practice healthy coping mechanisms for stress and worry. Mindfulness and relaxation techniques can be helpful in maintaining emotional well-being.");
    }
  }

  // Mood & Depression Recommendations
  if (primaryConcern === 'depression') {
    if (moodScore >= 8) {
      aiRecommendations.push("Responses suggest potential symptoms of low mood or depression. Engaging in enjoyable activities, maintaining social connections, and establishing a consistent routine can be supportive. Consulting with a mental health professional for a thorough assessment and potential treatment, which may include therapy or medication, is strongly advised.");
      predictedIssues.push("potential_low_mood_or_depression");
    } else if (moodScore >= 5) {
      aiRecommendations.push("You've indicated experiencing some symptoms of low mood. Try to engage in activities you usually enjoy, maintain social contact, and ensure you're getting enough sleep and exercise. Monitoring your mood and seeking support from friends or family can also be helpful.");
      predictedIssues.push("potential_mild_low_mood");
    } else {
      aiRecommendations.push("Continue to prioritize self-care and monitor your mood. Engaging in activities that bring you joy and maintaining a healthy lifestyle are important for overall well-being.");
    }
  }

  // Learning & Memory Recommendations
  if (primaryConcern === 'learning') {
    if (learningScore >= 8) {
      aiRecommendations.push("Responses indicate potential areas of learning or cognitive processing challenges. Exploring strategies for memory enhancement, organization, and communication may be helpful. Consulting with an educational psychologist or a specialist in learning differences could provide valuable insights and support. Techniques like spaced repetition and visual aids might also be beneficial.");
      predictedIssues.push("potential_learning_or_memory_challenges");
    } else if (learningScore >= 5) {
      aiRecommendations.push("You've reported some difficulties with learning or memory. Try implementing strategies such as note-taking, summarizing information, and practicing new skills regularly. Ensuring a good sleep schedule and managing stress can also positively impact cognitive functions.");
      predictedIssues.push("potential_mild_learning_memory_difficulties");
    } else {
      aiRecommendations.push("Continue to be aware of your learning style and seek strategies that work best for you. Regular cognitive exercises and maintaining an active learning approach can support cognitive health.");
    }
  }

  const selfAssessmentsRef = admin.firestore().collection('selfAssessments');
  await selfAssessmentsRef.add({
    userId: userId,
    primaryConcern: primaryConcern,
    ...responses,
    engineeredFeatures: engineeredFeatures,
    aiRecommendations: aiRecommendations.join(" "),
    predictedIssues: predictedIssues,
    assessmentTimestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, recommendations: aiRecommendations.join(" ") };
});