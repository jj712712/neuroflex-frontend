router.post("/generate-report", authenticate, async (req, res) => {
    const { sessionId } = req.body;
  
    try {
      const sessionDoc = await db.collection("sessions").doc(sessionId).get();
      const sessionData = sessionDoc.data();
      const avgFocus = sessionData.eegData.reduce((sum, data) => sum + data.signal, 0) / sessionData.eegData.length;
  
      const report = {
        sessionId,
        userId: sessionData.userId,
        avgFocus,
        status: avgFocus > 60 ? "Good Progress" : "Needs Improvement",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
  
      await db.collection("reports").add(report);
  
      res.status(200).json({ message: "Report generated!", report });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  