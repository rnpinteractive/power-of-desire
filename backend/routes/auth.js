// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");

router.post("/login", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // APENAS verifica na estrutura nova - pasta do usuário + profile.json
    const userDir = path.join(__dirname, "..", "data", "users", email);
    const profilePath = path.join(userDir, "profile.json");

    await fs.access(profilePath);
    const userData = JSON.parse(await fs.readFile(profilePath, "utf8"));

    // Se encontrou o usuário, tenta carregar onboarding
    try {
      const onboardingPath = path.join(userDir, "onboarding.json");
      const onboardingData = JSON.parse(
        await fs.readFile(onboardingPath, "utf8")
      );
      Object.assign(userData, onboardingData);
    } catch (err) {
      // Ignora se não tiver onboarding
    }

    res.json({ user: userData });
  } catch (error) {
    // Se não encontrou, retorna 404 - NADA é criado
    res
      .status(404)
      .json({ error: "User not registered. Please contact support." });
  }
});

module.exports = router;
