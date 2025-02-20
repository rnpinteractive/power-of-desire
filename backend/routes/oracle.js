const express = require("express");
const router = express.Router();
const openai = require("../config/openai");
const fs = require("fs").promises;
const path = require("path");

// Middleware para verificar acesso
const checkOracleAccess = async (req, res, next) => {
  try {
    // Pega email do body ou params
    const email = req.body.email || req.params.email;
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
    const userData = JSON.parse(await fs.readFile(userProfilePath, "utf8"));

    if (!userData.oraclePrime?.isActive) {
      return res
        .status(403)
        .json({ error: "No access to Oracle Prime", upgrade: true });
    }

    req.user = userData;
    next();
  } catch (error) {
    res.status(500).json({ error: "Error checking access" });
  }
};

// Rota de análise
router.post("/analyze", checkOracleAccess, async (req, res) => {
  try {
    const { message, image, email } = req.body;

    // Carregar dados do onboarding
    const onboardingPath = path.join(
      __dirname,
      "..",
      "data",
      "users",
      email,
      "onboarding.json"
    );
    const userData = JSON.parse(await fs.readFile(onboardingPath, "utf8"));

    // Cria um array de mensagens para estruturar melhor o contexto:
    const messages = [
      {
        role: "system",
        content:
          "You are a relationship expert who provides responses EXCLUSIVELY in a valid JSON format.",
      },
      {
        role: "user",
        content: `User Profile:
Objective: ${userData.objective}
Time Without Contact: ${userData.timeWithoutContact}
Separation Cause: ${userData.separationCause}
Current Interest: ${userData.currentInterest}
Current Status: ${userData.currentStatus}`,
      },
      {
        role: "user",
        content: message ? `User Query: ${message}` : "Image Analysis",
      },
    ];

    if (image) {
      messages.push({
        role: "user",
        content: `Image: ${image}`,
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
      presence_penalty: 0.3,
      frequency_penalty: 0.3,
    });

    // A resposta da IA deve ser um JSON válido conforme solicitado
    const response = JSON.parse(completion.choices[0].message.content);

    // Salva a interação (mensagem do usuário e resposta da IA) em um único arquivo
    const chatDir = path.join(
      __dirname,
      "..",
      "data",
      "users",
      email,
      "oracle-chats"
    );
    await fs.mkdir(chatDir, { recursive: true });

    const chatData = {
      timestamp: new Date().toISOString(),
      message: message || "Image Analysis",
      hasImage: !!image,
      response: response, // Armazena a resposta completa da IA
      imageAnalysis: !!image,
    };

    await fs.writeFile(
      path.join(chatDir, `${Date.now()}.json`),
      JSON.stringify(chatData, null, 2)
    );

    // Retorna no formato que o frontend espera
    res.json({
      analysis: response.analysis,
      strategy: response.strategy,
      triggers: response.triggers,
      warnings: response.warnings,
      timestamp: chatData.timestamp,
    });
  } catch (error) {
    console.error("Oracle analysis error:", error);
    res.status(500).json({
      error: "Failed to process analysis",
      details: error.message,
    });
  }
});

// Rota de histórico - agora retorna uma lista de mensagens (user + IA) em ordem cronológica
router.get("/history/:email", checkOracleAccess, async (req, res) => {
  try {
    const chatDir = path.join(
      __dirname,
      "..",
      "data",
      "users",
      req.params.email,
      "oracle-chats"
    );
    await fs.mkdir(chatDir, { recursive: true });

    const files = await fs.readdir(chatDir);
    const chats = await Promise.all(
      files.map(async (file) => {
        const content = await fs.readFile(path.join(chatDir, file), "utf8");
        return JSON.parse(content);
      })
    );

    // Para cada arquivo, cria 2 mensagens (user e assistant)
    const messages = chats.flatMap((chat) => {
      const userMessage = {
        content: chat.message || "Image Analysis",
        isUser: true,
        timestamp: chat.timestamp,
        hasImage: chat.hasImage,
      };
      const assistantMessage = {
        content: `Analysis:
${chat.response.analysis}

Strategic Approach:
${chat.response.strategy}

Key Triggers:
${chat.response.triggers.map((t) => `• ${t.type}: ${t.description}`).join("\n")}

⚠️ Warnings:
${chat.response.warnings.map((w) => `• ${w.risk}: ${w.impact}`).join("\n")}`,
        isUser: false,
        timestamp: chat.timestamp,
      };
      return [userMessage, assistantMessage];
    });

    // Ordena cronologicamente (mais antigo primeiro)
    messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

module.exports = router;
