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
    console.error("Access check error:", error);
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
    if (!image && previousMessages?.length > 0) {
      conversationContext = previousMessages
        .slice(-3)
        .map((m) => `${m.isUser ? "User" : "Assistant"}: ${m.content}`)
        .join("\n\n");
    }

    const userContext = `Relationship Context:
• Current Goal: ${userData.objective}
• Time Apart: ${userData.timeWithoutContact}
• Separation Reason: ${userData.separationCause}
• Interest Level: ${userData.currentInterest}
• Current Dynamic: ${userData.currentStatus}`;

    const messageAnalysisPrompt = `${userContext}

[CONVERSATION CONTENT FOR ANALYSIS]

Examine the provided conversation content with strategic precision:

1. Message Dynamics:
- Emotional undertones and intensity levels
- Power dynamics and resistance patterns
- Communication style and response patterns
- Critical turning points in dialogue

2. Behavioral Analysis:
- Clear communication boundaries
- Emotional investment indicators
- Resistance and receptivity signals
- Strategic positioning of both parties

3. Strategic Implications:
- Current stage of detachment/attachment
- Windows of opportunity or closure
- Risk assessment for further action
- Optimal response strategies

${
  message
    ? `Additional Context: ${message}

Based on this exact exchange, provide precise strategic analysis and actionable next steps.`
    : "Deliver specific insights and concrete action steps based on this exact conversation."
}`;

    const standardPrompt = `${userContext}

${conversationContext ? `Recent Interaction:\n${conversationContext}\n\n` : ""}
Current Situation: ${message}

Analyze the current dynamics and provide strategic guidance that addresses:
1. Immediate action steps
2. Risk mitigation strategies
3. Optimal communication approaches
4. Clear progress indicators

Structure the response with actionable precision.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content:
            "You are a strategic relationship expert specializing in reconnection dynamics and complex separations. Provide precise, actionable analysis based on actual evidence and specific situations presented. Focus on concrete details and strategic implications, avoiding theoretical frameworks or generic advice. Every response must be tailored to the exact situation shown.",
        },
        {
          role: "user",
          content: image ? messageAnalysisPrompt : standardPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
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

    const chatHistory = {
      timestamp,
      messages: [
        {
          content: message || "Conversation Analysis",
          isUser: true,
          hasImage: !!image,
        },
        {
          content: aiResponse,
          isUser: false,
        },
      ],
    };

    await fs.writeFile(
      path.join(chatDir, `${Date.now()}.json`),
      JSON.stringify(chatHistory, null, 2)
    );

    res.json({
      success: true,
      content: aiResponse,
      timestamp,
    });
  } catch (error) {
    console.error("Oracle analysis error:", error);
    res.status(500).json({
      success: false,
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

    const messages = chats
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .flatMap((chat) =>
        chat.messages.map((msg) => ({
          ...msg,
          timestamp: chat.timestamp,
        }))
      );

    res.json(messages);
  } catch (error) {
    console.error("History error:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

module.exports = router;
