const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");

router.post("/login", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const userDir = path.join(__dirname, "..", "data", "users", email);
  const userProfilePath = path.join(userDir, "profile.json");

  try {
    // Verifica se o diretório do usuário existe
    await fs.access(userDir);

    // Verifica e carrega o profile.json
    try {
      const profileData = await fs.readFile(userProfilePath, "utf8");
      const user = JSON.parse(profileData);

      // Tenta carregar dados do onboarding se existirem
      try {
        const onboardingPath = path.join(userDir, "onboarding.json");
        const onboardingData = JSON.parse(
          await fs.readFile(onboardingPath, "utf8")
        );
        Object.assign(user, onboardingData);
      } catch (err) {
        // Ignora se não tiver dados de onboarding
      }

      res.json({
        user,
        isNew: false,
      });
    } catch (error) {
      // Se profile.json não existir ou estiver corrompido
      res.status(500).json({
        error: "User profile is corrupted. Please contact support.",
        isNew: false,
      });
    }
  } catch (error) {
    // Se o diretório do usuário não existir
    res.status(404).json({
      error: "Email not registered. Please contact support.",
      isNew: true,
    });
  }
});

module.exports = router;
