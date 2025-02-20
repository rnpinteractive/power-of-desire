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

    let prompt = `Based on the following user information:
  Objective: ${userData.objective}
  Time Without Contact: ${userData.timeWithoutContact}
  Separation Cause: ${userData.separationCause}
  Current Interest: ${userData.currentInterest}
  Current Status: ${userData.currentStatus}
  
  ${
    image
      ? "Analyze the provided image, focusing on emotional signals, body language, and relationship dynamics. Then, "
      : ""
  }
  respond naturally as a relationship expert. Consider the user's situation and provide appropriate guidance.
  ${message ? `The user says: "${message}"` : ""}
  
  Return ONLY a VALID JSON OBJECT in this format:
  {
    "analysis": "Your conversational response here",
    "strategy": "Additional context or suggestion if relevant",
    "triggers": [
      {
        "type": "emotional response",
        "description": "how they might feel"
      }
    ],
    "warnings": [
      {
        "risk": "potential concern",
        "impact": "why to be careful"
      }
    ]
  }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content:
            "You are a relationship expert who provides responses EXCLUSIVELY in a valid JSON format.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...(image ? [{ type: "image_url", image_url: image }] : []),
          ],
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      presence_penalty: 0.3,
      frequency_penalty: 0.3,
    });

    const response = JSON.parse(completion.choices[0].message.content);
    const timestamp = new Date().toISOString();

    // Salvar no histórico
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
      timestamp,
      message: message || "Image Analysis",
      hasImage: !!image,
      response: {
        // Aqui está a resposta correta que o frontend espera
        analysis: response.analysis,
        strategy: response.strategy,
        triggers: response.triggers,
        warnings: response.warnings,
      },
    };

    await fs.writeFile(
      path.join(chatDir, `${Date.now()}.json`),
      JSON.stringify(chatData, null, 2)
    );

    res.json({
      ...response,
      timestamp,
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
    const chats = await Promise.all(
      files.map(async (file) => {
        const content = await fs.readFile(path.join(chatDir, file), "utf8");
        return JSON.parse(content);
      })
    );

    // Ordenar do mais antigo para o mais novo
    const sortedChats = chats.sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    res.json(sortedChats);
  } catch (error) {
    console.error("History error:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

module.exports = router;
