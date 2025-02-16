const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");

router.post("/login", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Define os caminhos para a pasta do usuário e para o profile.json
  const userDir = path.join(__dirname, "..", "data", "users", email);
  const profilePath = path.join(userDir, "profile.json");

  // VERIFICA se a pasta do usuário existe e se é realmente um diretório
  try {
    const userDirStats = await fs.stat(userDir);
    if (!userDirStats.isDirectory()) {
      // Se existir algo com esse nome, mas não for diretório, trata como não encontrado
      return res.status(404).json({ error: "Email not registered." });
    }
  } catch (err) {
    // Se a pasta não existir, retorna 404 sem criar nenhum arquivo
    return res.status(404).json({ error: "Email not registered." });
  }

  // VERIFICA se o arquivo profile.json existe e se é realmente um arquivo
  try {
    const profileStats = await fs.stat(profilePath);
    if (!profileStats.isFile()) {
      return res.status(500).json({ error: "User profile is corrupted." });
    }
  } catch (err) {
    return res.status(500).json({ error: "User profile is corrupted." });
  }

  // Lê o profile.json
  let userData;
  try {
    const profileData = await fs.readFile(profilePath, "utf8");
    userData = JSON.parse(profileData);
  } catch (err) {
    return res.status(500).json({ error: "Failed to read user profile." });
  }

  // Tenta ler o onboarding.json (opcional)
  try {
    const onboardingPath = path.join(userDir, "onboarding.json");
    const onboardingStats = await fs.stat(onboardingPath);
    if (onboardingStats.isFile()) {
      const onboardingData = JSON.parse(
        await fs.readFile(onboardingPath, "utf8")
      );
      userData = { ...userData, ...onboardingData };
    }
  } catch (err) {
    // Se não existir o onboarding.json, ignora
  }

  // Retorna os dados do usuário sem criar arquivos desnecessários
  return res.json({ user: userData });
});

module.exports = router;
