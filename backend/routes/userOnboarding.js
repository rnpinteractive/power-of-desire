const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");

router.post("/onboarding", async (req, res) => {
  const { email, onboardingCompleted, ...onboardingData } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Check user directory and profile.json existence
  const userDir = path.join(__dirname, "..", "data", "users", email);
  const profilePath = path.join(userDir, "profile.json");
  const onboardingPath = path.join(userDir, "onboarding.json");

  try {
    // Verify user exists by checking profile.json
    await fs.access(profilePath);

    // Save onboarding data
    const dataToWrite = {
      onboardingCompleted: true,
      completedAt: new Date().toISOString(),
      ...onboardingData,
    };

    await fs.writeFile(onboardingPath, JSON.stringify(dataToWrite, null, 2));

    res.json({ success: true, data: dataToWrite });
  } catch (err) {
    if (err.code === "ENOENT") {
      return res.status(404).json({ error: "User not found" });
    }
    console.error("Error saving onboarding:", err);
    res.status(500).json({ error: "Failed to save onboarding data" });
  }
});

module.exports = router;
