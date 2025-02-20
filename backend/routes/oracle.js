const express = require("express");
const router = express.Router();
const openai = require("../config/openai");
const fs = require("fs").promises;
const path = require("path");

// Middleware para verificar acesso
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

`;

    if (image) {
      prompt += `Analyze the provided image, focusing on emotional signals, body language, and relationship dynamics. Then,`;
    }

    prompt += `provide deep psychological insights and strategic guidance...`; // resto do prompt

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
    };

    await fs.writeFile(
      path.join(chatDir, `${Date.now()}.json`),
      JSON.stringify(chatData, null, 2)
    );

    res.json({ response: JSON.parse(completion.choices[0].message.content) });
  } catch (error) {
    console.error("Oracle analysis error:", error);
    res.status(500).json({ error: "Failed to process analysis" });
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

    res.json(
      chats.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

module.exports = router;
