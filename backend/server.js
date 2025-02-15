const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/users");
const articlesRoutes = require("./routes/articles");
const webhookRoutes = require("./routes/webhook");

// Antes do app.use(express.json())
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(cors());
app.use(express.json());

app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/articles", articlesRoutes);
app.use("/api/webhook", webhookRoutes);

// Criar diretórios necessários
const createDirectories = async () => {
  const dirs = ["users", "articles", "plans"];
  for (const dir of dirs) {
    await fs.mkdir(path.join(__dirname, "data", dir), { recursive: true });
  }
};

createDirectories();

// Rotas
app.post("/api/auth/login", async (req, res) => {
  const { email } = req.body;
  const userPath = path.join(__dirname, "data", "users", `${email}.json`);

  try {
    await fs.access(userPath);
    const userData = JSON.parse(await fs.readFile(userPath, "utf8"));
    res.json({ user: userData, isNew: false });
  } catch {
    const newUser = { email, createdAt: new Date().toISOString() };
    await fs.writeFile(userPath, JSON.stringify(newUser));
    res.json({ user: newUser, isNew: true });
  }
});

app.post("/api/onboarding", async (req, res) => {
  const { email, ...data } = req.body;
  const userPath = path.join(__dirname, "data", "users", `${email}.json`);

  try {
    const userFile = await fs.readFile(userPath, "utf8");
    const userData = JSON.parse(userFile);
    const updatedUser = { ...userData, ...data, onboardingCompleted: true };
    await fs.writeFile(userPath, JSON.stringify(updatedUser));

    // Gerar plano após onboarding
    const openai = require("./config/openai");
    const generatePlan = require("./controllers/planController");
    const plan = await generatePlan.generateWeekPlan(updatedUser);

    res.json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ error: "Erro ao salvar dados" });
  }
});

// Rota para buscar artigos
app.get("/api/articles", async (req, res) => {
  const articlesPath = path.join(__dirname, "data", "articles");
  try {
    const files = await fs.readdir(articlesPath);
    const articles = await Promise.all(
      files.map(async (file) => {
        const content = await fs.readFile(
          path.join(articlesPath, file),
          "utf8"
        );
        return JSON.parse(content);
      })
    );
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar artigos" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
