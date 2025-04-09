router.post("/start-session", authenticate, async (req, res) => {
    const { therapistId, issueType } = req.body;
  
    try {
      const sessionRef = await db.collection("sessions").add({
        userId: req.user.uid,
        therapistId,
        issueType, // Focus, Learning, Anxiety, Depression
        eegData: [],
        status: "active",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  
      res.status(201).json({ message: "Therapy session started!", sessionId: sessionRef.id });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  router.post("/eeg-data", authenticate, async (req, res) => {
    const { sessionId, eegSignal } = req.body;
  
    try {
      const sessionRef = db.collection("sessions").doc(sessionId);
      await sessionRef.update({
        eegData: admin.firestore.FieldValue.arrayUnion({ signal: eegSignal, timestamp: Date.now() }),
      });
  
      if (eegSignal < 50) {
        await sessionRef.update({ focusAlert: "Focus dropped! Please refocus." });
      }
  
      res.status(200).json({ message: "EEG data updated successfully!" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
    