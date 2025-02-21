const express = require("express");
const router = express.Router();
const openai = require("../config/openai");
const fs = require("fs").promises;
const path = require("path");

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

router.post("/analyze", checkOracleAccess, async (req, res) => {
  try {
    const { message, image, email, previousMessages } = req.body;

    const onboardingPath = path.join(
      __dirname,
      "..",
      "data",
      "users",
      email,
      "onboarding.json"
    );
    const userData = JSON.parse(await fs.readFile(onboardingPath, "utf8"));

    let conversationContext = "";
    if (previousMessages?.length > 0) {
      conversationContext = previousMessages
        .map((m) => `${m.isUser ? "User" : "Assistant"}: ${m.content}`)
        .join("\n\n");
    }

    const userContext = `User Context:
• Objective: ${userData.objective}
• Time Without Contact: ${userData.timeWithoutContact}
• Separation Cause: ${userData.separationCause}
• Current Interest: ${userData.currentInterest}
• Current Status: ${userData.currentStatus}`;

    const prompt = `${userContext}

${
  conversationContext
    ? `Previous conversation:\n${conversationContext}\n\n`
    : ""
}${image ? "[IMAGE PROVIDED FOR ANALYSIS]\n\n" : ""}${
      message ? `User: ${message}` : ""
    }

As a relationship expert, provide a thoughtful and empathetic response considering the user's context and any provided image. Format your response in a clear and organized way, using line breaks and bullet points when appropriate.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content:
            "You are an empathetic relationship expert providing guidance based on the user's specific situation.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      presence_penalty: 0.3,
      frequency_penalty: 0.3,
    });

    const aiResponse = completion.choices[0].message.content;
    const timestamp = new Date().toISOString();

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
      content: aiResponse,
    };

    await fs.writeFile(
      path.join(chatDir, `${Date.now()}.json`),
      JSON.stringify(chatData, null, 2)
    );

    res.json({
      content: aiResponse,
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
