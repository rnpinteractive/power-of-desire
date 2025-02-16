const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");

router.post("/onboarding", async (req, res) => {
  const { email, onboardingCompleted, ...onboardingData } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Caminho para a pasta do usuário e para o onboarding.json
  const userDir = path.join(__dirname, "..", "data", "users", email);
  const onboardingPath = path.join(userDir, "onboarding.json");

  // Verifica se a pasta do usuário existe e é um diretório
  try {
    const userStats = await fs.stat(userDir);
    if (!userStats.isDirectory()) {
      return res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    return res.status(404).json({ error: "User not found" });
  }

  // Grava os dados no arquivo onboarding.json
  try {
    const dataToWrite = { onboardingCompleted, ...onboardingData };
    await fs.writeFile(onboardingPath, JSON.stringify(dataToWrite, null, 2));
    res.json(dataToWrite);
  } catch (err) {
    console.error("Error saving onboarding:", err);
    res.status(500).json({ error: "Failed to save onboarding data" });
  }
});

module.exports = router;
