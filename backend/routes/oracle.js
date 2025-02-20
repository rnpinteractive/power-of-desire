const express = require("express");
const router = express.Router();
const openai = require("../config/openai");
const fs = require("fs").promises;
const path = require("path");

// Middleware de acesso simplificado para debug
const checkOracleAccess = async (req, res, next) => {
  const email = req.body.email || req.params.email;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
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
      return res.status(403).json({ error: "No access to Oracle Prime" });
    }

    req.user = userData;
    next();
  } catch (error) {
    // Log específico para debug
    console.error(`Profile read error for ${email}:`, error);
    return res.status(403).json({ error: "Access verification failed" });
  }
};

router.post("/analyze", checkOracleAccess, async (req, res) => {
  const { message, image, email } = req.body;

  try {
    // 1. Tentar ler onboarding com fallback
    let userData = {
      objective: "Not specified",
      timeWithoutContact: "Not specified",
      separationCause: "Not specified",
      currentInterest: "Not specified",
      currentStatus: "Not specified",
    };

    try {
      const onboardingData = await fs.readFile(
        path.join(__dirname, "..", "data", "users", email, "onboarding.json"),
        "utf8"
      );
      userData = JSON.parse(onboardingData);
    } catch (err) {
      console.warn(`Onboarding not found for ${email}, using defaults`);
    }

    // 2. Preparar o prompt
    const prompt = `Based on the following user information:
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
provide deep psychological insights and strategic guidance. Focus on dark psychology principles, emotional triggers, and specific tactical actions.
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

    // 3. Fazer a chamada para OpenAI
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

    // 4. Processar resposta
    const response = JSON.parse(completion.choices[0].message.content);
    const timestamp = new Date().toISOString();

    // 5. Tentar salvar histórico (não bloqueia resposta se falhar)
    try {
      const chatDir = path.join(
        __dirname,
        "..",
        "data",
        "users",
        email,
        "oracle-chats"
      );
      await fs.mkdir(chatDir, { recursive: true });

      await fs.writeFile(
        path.join(chatDir, `${Date.now()}.json`),
        JSON.stringify({
          message: message || "Image Analysis",
          hasImage: !!image,
          response: response,
          timestamp: timestamp,
        })
      );
    } catch (err) {
      console.error("Error saving chat:", err);
      // Continua mesmo se falhar ao salvar
    }

    // 6. Retorna resposta
    return res.json({
      ...response,
      timestamp,
    });
  } catch (error) {
    console.error("Analyze error details:", error);
    return res.status(500).json({
      error: "Analysis failed",
      message: error.message,
    });
  }
});

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

    try {
      await fs.mkdir(chatDir, { recursive: true });
    } catch (err) {
      console.warn("Chat dir creation failed:", err);
      // Continua mesmo se falhar
    }

    let files = [];
    try {
      files = await fs.readdir(chatDir);
    } catch (err) {
      console.error("Reading chat dir failed:", err);
      return res.json([]); // Retorna array vazio se não encontrar arquivos
    }

    const chats = [];
    for (const file of files) {
      try {
        const content = await fs.readFile(path.join(chatDir, file), "utf8");
        chats.push(JSON.parse(content));
      } catch (err) {
        console.error(`Error reading chat file ${file}:`, err);
        // Continua para o próximo arquivo
      }
    }

    // Ordena por timestamp (mais antigo primeiro)
    chats.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return res.json(chats);
  } catch (error) {
    console.error("History error details:", error);
    return res.status(500).json({
      error: "Failed to fetch history",
      message: error.message,
    });
  }
});

module.exports = router;
