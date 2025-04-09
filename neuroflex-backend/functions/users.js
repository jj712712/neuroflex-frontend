router.post("/select-therapist", authenticate, async (req, res) => {
    const { therapistId } = req.body;
  
    try {
      const userRef = db.collection("users").doc(req.user.uid);
      await userRef.update({ therapistId });
  
      res.status(200).json({ message: "Therapist assigned successfully!" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  