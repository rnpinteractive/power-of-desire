const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");

router.post("/login", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Verifica a PASTA do usuário, não o arquivo .json
  const userDir = path.join(__dirname, "..", "data", "users", email);
  const profilePath = path.join(userDir, "profile.json");

  try {
    // Primeiro verifica se a pasta existe
    await fs.access(userDir);

    // Depois verifica se tem o profile.json
    try {
      const profileData = await fs.readFile(profilePath, "utf8");
      const userData = JSON.parse(profileData);

      // Tenta carregar onboarding se existir
      try {
        const onboardingPath = path.join(userDir, "onboarding.json");
        const onboardingData = JSON.parse(
          await fs.readFile(onboardingPath, "utf8")
        );
        Object.assign(userData, onboardingData);
      } catch (err) {
        // Ignora se não tiver onboarding
      }

      res.json({
        user: userData,
        isNew: false,
      });
    } catch (error) {
      // Se não conseguir ler o profile.json
      res.status(500).json({
        error: "User profile is corrupted.",
        isNew: false,
      });
    }
  } catch (error) {
    // Se a pasta não existir
    res.status(404).json({
      error: "Email not registered.",
      isNew: false,
    });
  }
});

module.exports = router;
