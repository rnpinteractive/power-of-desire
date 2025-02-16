const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");

router.post("/login", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Define o caminho da pasta do usuário e do profile.json
  const userDir = path.join(__dirname, "..", "data", "users", email);
  const profilePath = path.join(userDir, "profile.json");

  try {
    // Verifica se o caminho existe e se é um diretório
    const stats = await fs.stat(userDir);
    if (!stats.isDirectory()) {
      return res
        .status(404)
        .json({ error: "Email not registered.", isNew: false });
    }

    // Tenta ler o profile.json do usuário
    try {
      const profileData = await fs.readFile(profilePath, "utf8");
      const userData = JSON.parse(profileData);

      // Tenta carregar o onboarding, se existir
      try {
        const onboardingPath = path.join(userDir, "onboarding.json");
        const onboardingData = JSON.parse(
          await fs.readFile(onboardingPath, "utf8")
        );
        Object.assign(userData, onboardingData);
      } catch (err) {
        // Se não houver onboarding, ignora o erro
      }

      return res.json({
        user: userData,
        isNew: false,
      });
    } catch (error) {
      return res.status(500).json({
        error: "User profile is corrupted.",
        isNew: false,
      });
    }
  } catch (error) {
    // Se o diretório não existir ou não for um diretório válido
    return res.status(404).json({
      error: "Email not registered.",
      isNew: false,
    });
  }
});

module.exports = router;
