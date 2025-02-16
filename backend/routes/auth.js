const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");

router.post("/login", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const userProfilePath = path.join(
    __dirname,
    "..",
    "data",
    "users",
    email,
    "profile.json"
  );

  try {
    await fs.access(userProfilePath);
    const userData = await fs.readFile(userProfilePath, "utf8");
    const user = JSON.parse(userData);

    // Tenta carregar dados do onboarding se existirem
    try {
      const onboardingPath = path.join(
        __dirname,
        "..",
        "data",
        "users",
        email,
        "onboarding.json"
      );
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
    // Não cria novo usuário, apenas retorna 404
    res.status(404).json({
      error: "Email não cadastrado. Entre em contato com o suporte.",
    });
  }
});

module.exports = router;
