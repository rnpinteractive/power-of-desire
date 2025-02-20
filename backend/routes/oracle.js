const express = require("express");
const router = express.Router();
const openai = require("../config/openai");
const fs = require("fs").promises;
const path = require("path");

// Middleware para verificar acesso ao Oracle Prime
const checkOracleAccess = async (req, res, next) => {
  try {
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

    const userData = JSON.parse(await fs.readFile(userProfilePath, "utf8"));

    if (!userData.oraclePrime?.isActive) {
      return res.status(403).json({
        error: "No access to Oracle Prime",
        upgrade: true,
      });
    }

    req.user = userData;
    next();
  } catch (error) {
    res.status(500).json({ error: "Error checking access" });
  }
};

// Rota principal de análise
router.post("/analyze", checkOracleAccess, async (req, res) => {
  try {
    const { message, image, email } = req.body;

    // Carregar dados do onboarding para contexto
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

`;

    // Se tiver imagem, adiciona ao prompt
    if (image) {
      prompt += `Analyze the provided image, focusing on emotional signals, body language, and relationship dynamics. Then,`;
    }

    prompt += `provide deep psychological insights and strategic guidance. Focus on dark psychology principles, emotional triggers, and specific tactical actions.
${message ? `Consider this context: "${message}"` : ""}

Your response must include:
1. A clear analysis of the current situation
2. Specific psychological triggers to employ
3. Strategic actions to take
4. Potential risks to avoid

Return ONLY a VALID JSON OBJECT in this format:
{
  "analysis": "Your in-depth psychological analysis",
  "strategy": "Specific tactical approach to take",
  "triggers": [
    {
      "type": "The type of psychological trigger",
      "description": "How to implement it"
    }
  ],
  "warnings": [
    {
      "risk": "Potential risk to avoid",
      "impact": "Why it's dangerous"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content:
            "You are a relationship expert who provides responses EXCLUSIVELY in a valid JSON format. Never include text or explanations outside the JSON.",
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

    const responseContent = completion.choices[0].message.content.trim();
    const analysis = JSON.parse(responseContent);

    // Salvar análise
    const analysisDir = path.join(
      __dirname,
      "..",
      "data",
      "users",
      email,
      "oracle-analyses"
    );

    await fs.mkdir(analysisDir, { recursive: true });

    await fs.writeFile(
      path.join(analysisDir, `${Date.now()}.json`),
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          input: { message, hasImage: !!image },
          analysis,
        },
        null,
        2
      )
    );

    res.json(analysis);
  } catch (error) {
    console.error("Oracle analysis error:", error);
    if (error instanceof SyntaxError) {
      res
        .status(500)
        .json({ error: "Error processing AI response: Invalid JSON" });
    } else {
      res.status(500).json({
        error: "Failed to process analysis",
        details: error.message,
      });
    }
  }
});

// Rota para histórico
router.get("/history/:email", checkOracleAccess, async (req, res) => {
  try {
    const analysisDir = path.join(
      __dirname,
      "..",
      "data",
      "users",
      req.params.email,
      "oracle-analyses"
    );

    const files = await fs.readdir(analysisDir);
    const analyses = await Promise.all(
      files.map(async (file) => {
        const content = await fs.readFile(path.join(analysisDir, file), "utf8");
        return JSON.parse(content);
      })
    );

    res.json(
      analyses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch analysis history" });
  }
});

// Rota para buscar histórico de conversas
router.get("/history/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const chatDir = path.join(
      __dirname,
      "..",
      "data",
      "users",
      email,
      "oracle-chats"
    );

    // Cria diretório se não existir
    await fs.mkdir(chatDir, { recursive: true });

    const files = await fs.readdir(chatDir);
    const chats = await Promise.all(
      files.map(async (file) => {
        const content = await fs.readFile(path.join(chatDir, file), "utf8");
        return JSON.parse(content);
      })
    );

    // Retorna ordenado por data, mais recente primeiro
    res.json(
      chats.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

// Modificar a rota de análise para salvar histórico
router.post("/analyze", checkOracleAccess, async (req, res) => {
  try {
    const { message, image, email } = req.body;

    // ... resto do código de análise existente ...

    // Após processar a análise, salvar no histórico
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
      message,
      hasImage: !!image,
      response: completion.choices[0].message.content,
      imageAnalysis: imageAnalysis || null,
    };

    await fs.writeFile(
      path.join(chatDir, `${Date.now()}.json`),
      JSON.stringify(chatData, null, 2)
    );

    res.json(chatData);
  } catch (error) {
    console.error("Oracle analysis error:", error);
    res.status(500).json({ error: "Failed to process analysis" });
  }
});

module.exports = router;
