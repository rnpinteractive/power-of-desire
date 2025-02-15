const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");
const planController = require("../controllers/planController");

router.post("/onboarding", async (req, res) => {
  try {
    const { email, ...onboardingData } = req.body;
    const userPath = path.join(
      __dirname,
      "..",
      "data",
      "users",
      `${email}.json`
    );

    // Lê os dados atuais do usuário
    const userData = JSON.parse(await fs.readFile(userPath, "utf8"));

    // Atualiza os dados com as respostas do onboarding
    const updatedUser = {
      ...userData,
      ...onboardingData,
      onboardingCompleted: true,
      updatedAt: new Date().toISOString(),
    };

    // Salva os dados atualizados
    await fs.writeFile(userPath, JSON.stringify(updatedUser, null, 2));

    res.json(updatedUser);
  } catch (error) {
    console.error("Erro ao salvar onboarding:", error);
    res.status(500).json({ error: "Erro ao salvar dados do onboarding" });
  }
});

// routes/users.js
router.post("/refund", async (req, res) => {
  const { email, reason, requestDate } = req.body;
  const refundPath = path.join(
    __dirname,
    "..",
    "data",
    "users",
    `${email}_refund.json`
  );

  try {
    // Verifica se já existe arquivo de reembolso
    try {
      await fs.access(refundPath);
      // Se existe, retorna erro 400
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

// Adicione uma nova rota para verificar status do reembolso
router.get("/refund/:email", async (req, res) => {
  try {
    const refundPath = path.join(
      __dirname,
      "..",
      "data",
      "users",
      `${req.params.email}_refund.json`
    );

    await fs.access(refundPath);
    const refundData = JSON.parse(await fs.readFile(refundPath, "utf8"));
    res.json(refundData);
  } catch {
    res.json({ exists: false });
  }
});

router.get("/:email", async (req, res) => {
  const userFilePath = path.join(
    __dirname,
    "..",
    "data",
    "users",
    `${req.params.email}.json`
  );

  try {
    const userData = await fs.readFile(userFilePath, "utf8");
    res.json(JSON.parse(userData));
  } catch (error) {
    res.status(404).json({ error: "Usuário não encontrado" });
  }
});

// Rota para buscar/gerar plano do dia
router.get("/:email/plan/:dia", async (req, res) => {
  try {
    const { email, dia } = req.params;
    const { regenerate } = req.query;
    const userPath = path.join(
      __dirname,
      "..",
      "data",
      "users",
      `${email}.json`
    );
    const userData = JSON.parse(await fs.readFile(userPath, "utf8"));

    // Se não é para regenerar e já existe plano, retorna o existente
    if (!regenerate && userData.plans && userData.plans[dia]) {
      return res.json(userData.plans[dia]);
    }

    // Gera novo plano usando a função correta
    const novoPlan = await planController.generatePlan(userData, dia);
    res.json(novoPlan);
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).json({ error: "Erro ao buscar/gerar plano" });
  }
});

module.exports = router;
