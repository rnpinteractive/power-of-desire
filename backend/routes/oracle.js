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

// Função auxiliar para carregar/salvar histórico
const getHistoryPath = (email) => {
  return path.join(__dirname, "..", "data", "users", email, "history.json");
};

const loadHistory = async (email) => {
  try {
    const historyPath = getHistoryPath(email);
    const content = await fs.readFile(historyPath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    // Se o arquivo não existir, retorna array vazio
    return [];
  }
};

const saveHistory = async (email, history) => {
  const historyPath = getHistoryPath(email);
  const userDir = path.dirname(historyPath);
  await fs.mkdir(userDir, { recursive: true });
  await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
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

    let prompt = `You are a conversational AI assistant that helps with relationships. 
Keep in mind this context about the user when responding:

- Their objective: ${userData.objective}
- Time without contact: ${userData.timeWithoutContact}
- Separation cause: ${userData.separationCause}
- Current interest level: ${userData.currentInterest}
- Current status: ${userData.currentStatus}

${
  image
    ? "First analyze this image considering emotional signals, body language, and relationship dynamics. Then "
    : ""
}
respond to the user in a natural, conversational way. Your responses should be direct and in natural language, not in any specific format.

Use this context to provide appropriate advice and guidance while maintaining a natural conversation.

${
  message
    ? `The user's message is: "${message}"`
    : "Please analyze the image provided"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content:
            "You are a relationship expert who maintains natural conversation while providing strategic guidance.",
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

    const aiResponse = completion.choices[0].message.content;
    const timestamp = new Date().toISOString();

    // Carregar histórico existente
    const history = await loadHistory(email);

    // Adicionar nova interação
    const newInteraction = {
      timestamp,
      message: message || "Image Analysis",
      hasImage: !!image,
      response: aiResponse,
    };

    history.push(newInteraction);

    // Salvar histórico atualizado
    await saveHistory(email, history);

    // Enviar resposta
    res.json({
      response: aiResponse,
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
    const history = await loadHistory(req.params.email);

    // Garantir que o histórico está ordenado do mais antigo para o mais novo
    const sortedHistory = history.sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    res.json(sortedHistory);
  } catch (error) {
    console.error("History error:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

module.exports = router;
