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
    const { message, image, email, previousMessages } = req.body;

    // Load onboarding data
    const onboardingPath = path.join(
      __dirname,
      "..",
      "data",
      "users",
      email,
      "onboarding.json"
    );
    const userData = JSON.parse(await fs.readFile(onboardingPath, "utf8"));

    // Create context-aware prompt
    let prompt = `Based on the following user information:
  Objective: ${userData.objective}
  Time Without Contact: ${userData.timeWithoutContact}
  Separation Cause: ${userData.separationCause}
  Current Interest: ${userData.currentInterest}
  Current Status: ${userData.currentStatus}
  
  Previous context:
  ${
    previousMessages
      ?.map((msg) => `${msg.isUser ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n") || "No previous context"
  }
  
  ${
    image
      ? "Analyze the provided image, focusing on emotional signals, body language, and relationship dynamics. Then, "
      : ""
  }
  Analyze the current situation and provide guidance based on the user's message and previous context.
  ${message ? `Current message: "${message}"` : ""}
  
  Your response must include:
  1. A clear analysis considering all previous context
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
            "You are a relationship expert who provides responses EXCLUSIVELY in a valid JSON format. Consider all previous context when providing advice.",
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

    // Save complete interaction to history
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
      userMessage: {
        content: message || "Image Analysis",
        hasImage: !!image,
        timestamp,
      },
      aiResponse: {
        content: response,
        timestamp,
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

    // Sort by timestamp in ascending order (oldest to newest)
    const sortedChats = chats.sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    // Transform to frontend message format
    const messages = sortedChats.flatMap((chat) => [
      {
        content: chat.userMessage.content,
        isUser: true,
        timestamp: chat.userMessage.timestamp,
        hasImage: chat.userMessage.hasImage,
      },
      {
        content: `Analysis:\n${
          chat.aiResponse.content.analysis
        }\n\nStrategic Approach:\n${
          chat.aiResponse.content.strategy
        }\n\nKey Triggers:\n${chat.aiResponse.content.triggers
          .map((t) => `• ${t.type}: ${t.description}`)
          .join("\n")}\n\n⚠️ Warnings:\n${chat.aiResponse.content.warnings
          .map((w) => `• ${w.risk}: ${w.impact}`)
          .join("\n")}`,
        isUser: false,
        timestamp: chat.aiResponse.timestamp,
      },
    ]);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

module.exports = router;
