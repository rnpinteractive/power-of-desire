const express = require("express");
const router = express.Router();
const openai = require("../config/openai");
const fs = require("fs").promises;
const path = require("path");

// Middleware para verificar acesso
const checkOracleAccess = async (req, res, next) => {
  try {
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
    console.error("Error in checkOracleAccess:", error);
    return res.status(500).json({ error: "Error checking access" });
  }
};

// Rota de análise
router.post("/analyze", checkOracleAccess, async (req, res) => {
  try {
    const { message, image, email } = req.body;

    // Carrega os dados do onboarding
    const onboardingPath = path.join(
      __dirname,
      "..",
      "data",
      "users",
      email,
      "onboarding.json"
    );
    let onboardingData;
    try {
      onboardingData = JSON.parse(await fs.readFile(onboardingPath, "utf8"));
    } catch (err) {
      console.error("Error reading onboarding file:", err);
      return res.status(500).json({ error: "Failed to load onboarding data" });
    }

    // Cria o contexto para o modelo, separando as informações do perfil e a query do usuário
    const messagesForAI = [
      {
        role: "system",
        content:
          "You are a relationship expert who provides responses EXCLUSIVELY in a valid JSON format.",
      },
      {
        role: "user",
        content: `User Profile:
Objective: ${onboardingData.objective}
Time Without Contact: ${onboardingData.timeWithoutContact}
Separation Cause: ${onboardingData.separationCause}
Current Interest: ${onboardingData.currentInterest}
Current Status: ${onboardingData.currentStatus}`,
      },
      {
        role: "user",
        content: message ? `User Query: ${message}` : "Image Analysis",
      },
    ];

    if (image) {
      messagesForAI.push({
        role: "user",
        content: `Image: ${image}`,
      });
    }

    // Chama o OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: messagesForAI,
      temperature: 0.7,
      max_tokens: 1000,
      presence_penalty: 0.3,
      frequency_penalty: 0.3,
    });

    // Loga a resposta bruta para ajudar no debug
    console.log("OpenAI raw response:", completion.choices[0].message.content);

    let responseObj;
    try {
      responseObj = JSON.parse(completion.choices[0].message.content);
    } catch (err) {
      console.error("JSON parsing error from OpenAI response:", err);
      return res.status(500).json({
        error: "Failed to parse AI response",
        details: completion.choices[0].message.content,
      });
    }

    // Salva a interação completa (mensagem do usuário + resposta da IA) em um único arquivo JSON
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
      response: responseObj,
      imageAnalysis: !!image,
    };

    await fs.writeFile(
      path.join(chatDir, `${Date.now()}.json`),
      JSON.stringify(chatData, null, 2)
    );

    // Retorna os dados formatados para o frontend
    res.json({
      analysis: responseObj.analysis,
      strategy: responseObj.strategy,
      triggers: responseObj.triggers,
      warnings: responseObj.warnings,
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

// Rota de histórico
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
    const chats = [];
    for (const file of files) {
      try {
        const content = await fs.readFile(path.join(chatDir, file), "utf8");
        chats.push(JSON.parse(content));
      } catch (err) {
        console.error("Error reading chat file:", file, err);
        // Aqui, podemos optar por ignorar arquivos inválidos
      }
    }

    // Para cada arquivo, criamos duas mensagens: uma do usuário e outra da IA
    const messagesToReturn = chats.flatMap((chat) => {
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

    // Ordena as mensagens cronologicamente (mais antigo primeiro)
    messagesToReturn.sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    res.json(messagesToReturn);
  } catch (error) {
    console.error("Error in history endpoint:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

module.exports = router;
