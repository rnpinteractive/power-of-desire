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

// Rota de reembolso
router.post("/refund", async (req, res) => {
  const { email, reason, requestDate } = req.body;
  const userDir = path.join(__dirname, "..", "data", "users", email);
  const refundPath = path.join(userDir, "refund.json");

  try {
    // Verifica se já existe arquivo de reembolso
    try {
      await fs.access(refundPath);
      return res.status(400).json({
        message: "Você já possui uma solicitação de reembolso em andamento.",
      });
    } catch (err) {
      // Se não existe, continua normalmente
    }

    // Cria nova solicitação
    const refundData = {
      email,
      reason,
      requestDate,
      status: "pending",
    };

    await fs.writeFile(refundPath, JSON.stringify(refundData, null, 2));
    return res.status(200).json({
      success: true,
      message: "Solicitação de reembolso enviada com sucesso",
    });
  } catch (error) {
    console.error("Erro no reembolso:", error);
    return res.status(500).json({
      message: "Erro interno ao processar solicitação",
    });
  }
});

// Verifica status do reembolso
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

// Busca dados do usuário
router.get("/:email", async (req, res) => {
  try {
    const userDir = path.join(
      __dirname,
      "..",
      "data",
      "users",
      req.params.email
    );
    const profilePath = path.join(userDir, "profile.json");
    const onboardingPath = path.join(userDir, "onboarding.json");

    // Carrega perfil
    const profile = JSON.parse(await fs.readFile(profilePath, "utf8"));

    // Tenta carregar onboarding se existir
    try {
      const onboarding = JSON.parse(await fs.readFile(onboardingPath, "utf8"));
      res.json({ ...profile, ...onboarding });
    } catch (err) {
      res.json(profile);
    }
  } catch (error) {
    res.status(404).json({ error: "Usuário não encontrado" });
  }
});

// Busca/gera plano do dia
router.get("/:email/plan/:dia", async (req, res) => {
  try {
    const { email, dia } = req.params;
    const { regenerate } = req.query;
    const userDir = path.join(__dirname, "..", "data", "users", email);
    const planPath = path.join(userDir, "plans", `day-${dia}.json`);

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
    const profilePath = path.join(userDir, "profile.json");
    const onboardingPath = path.join(userDir, "onboarding.json");

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
