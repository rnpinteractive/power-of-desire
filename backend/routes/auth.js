// auth.js
const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");

router.post("/login", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email é obrigatório" });
  }

  try {
    // 1. Verificar se o diretório do usuário existe
    const userDir = path.join(__dirname, "..", "data", "users", email);

    // 2. Verificar se profile.json existe
    const profilePath = path.join(userDir, "profile.json");

    try {
      // 3. Tentar acessar o arquivo - se não existir, vai lançar erro
      await fs.access(profilePath);
    } catch (err) {
      // 4. Se o arquivo não existe, retorna 404 imediatamente
      return res.status(404).json({
        error: "Usuário não cadastrado. Entre em contato com o suporte.",
      });
    }

    // 5. Se chegou aqui, o arquivo existe - ler os dados
    const profileData = await fs.readFile(profilePath, "utf8");
    const userData = JSON.parse(profileData);

    // 6. Verificar se os dados são válidos
    if (!userData || !userData.email) {
      return res.status(400).json({
        error: "Dados do usuário inválidos",
      });
    }

    // 7. Opcional: Verificar onboarding
    let onboardingData = {};
    try {
      const onboardingPath = path.join(userDir, "onboarding.json");
      const onboardingContent = await fs.readFile(onboardingPath, "utf8");
      onboardingData = JSON.parse(onboardingContent);
    } catch (err) {
      // Se não tem onboarding, assume que não foi completado
      onboardingData = { onboardingCompleted: false };
    }

    // 8. Retornar dados combinados
    res.json({
      user: {
        ...userData,
        ...onboardingData,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({
      error: "Erro ao verificar usuário. Tente novamente.",
    });
  }
});

module.exports = router;
