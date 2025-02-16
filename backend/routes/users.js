const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");
const planController = require("../controllers/planController");

router.post("/onboarding", async (req, res) => {
  try {
    const { email, ...onboardingData } = req.body;
    const userDir = path.join(__dirname, "..", "data", "users", email);
    const profilePath = path.join(userDir, "profile.json");
    const onboardingPath = path.join(userDir, "onboarding.json");

    // Verifica se o usuário existe
    const userData = JSON.parse(await fs.readFile(profilePath, "utf8"));

    // Salva dados do onboarding
    await fs.writeFile(onboardingPath, JSON.stringify(onboardingData, null, 2));

    // Atualiza status no profile
    userData.onboardingCompleted = true;
    userData.updatedAt = new Date().toISOString();
    await fs.writeFile(profilePath, JSON.stringify(userData, null, 2));

    res.json({ ...userData, ...onboardingData });
  } catch (error) {
    console.error("Erro ao salvar onboarding:", error);
    res.status(500).json({ error: "Erro ao salvar dados do onboarding" });
  }
});

router.get("/refund/:email", async (req, res) => {
  try {
    const refundPath = path.join(
      __dirname,
      "..",
      "data",
      "users",
      req.params.email,
      "refund.json"
    );

    await fs.access(refundPath);
    const refundData = JSON.parse(await fs.readFile(refundPath, "utf8"));
    res.json(refundData);
  } catch {
    res.json({ exists: false });
  }
});

router.get("/:email/plan/:dia", async (req, res) => {
  try {
    const { email, dia } = req.params;
    const { regenerate } = req.query;

    const planPath = path.join(
      __dirname,
      "..",
      "data",
      "users",
      email,
      "plans",
      `day-${dia}.json`
    );

    // Se não é para regenerar e já existe plano, retorna o existente
    if (!regenerate) {
      try {
        const existingPlan = await fs.readFile(planPath, "utf8");
        return res.json(JSON.parse(existingPlan));
      } catch (err) {
        // Continua se o plano não existir
      }
    }

    // Carrega dados do usuário para gerar novo plano
    const profilePath = path.join(
      __dirname,
      "..",
      "data",
      "users",
      email,
      "profile.json"
    );
    const onboardingPath = path.join(
      __dirname,
      "..",
      "data",
      "users",
      email,
      "onboarding.json"
    );

    const profile = JSON.parse(await fs.readFile(profilePath, "utf8"));
    const onboarding = JSON.parse(await fs.readFile(onboardingPath, "utf8"));
    const userData = { ...profile, ...onboarding };

    const novoPlan = await planController.generatePlan(userData, dia);
    res.json(novoPlan);
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).json({ error: "Erro ao buscar/gerar plano" });
  }
});

module.exports = router;
