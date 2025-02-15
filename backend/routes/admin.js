const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");

// Listar todos usuários
router.get("/users", async (req, res) => {
  try {
    const usersDir = path.join(__dirname, "..", "data", "users");
    const files = await fs.readdir(usersDir);
    const users = await Promise.all(
      files.map(async (file) => {
        const content = await fs.readFile(path.join(usersDir, file), "utf8");
        return JSON.parse(content);
      })
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar usuários" });
  }
});

// Criar artigo
router.post("/articles", async (req, res) => {
  try {
    const { titulo, conteudo, palavras_chave } = req.body;
    const id = titulo.toLowerCase().replace(/\s+/g, "-");
    const articlePath = path.join(
      __dirname,
      "..",
      "data",
      "articles",
      `${id}.json`
    );

    const article = {
      id,
      titulo,
      conteudo,
      palavras_chave,
      createdAt: new Date().toISOString(),
    };

    await fs.writeFile(articlePath, JSON.stringify(article, null, 2));
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar artigo" });
  }
});

// Rota para criar usuário
router.post("/users", async (req, res) => {
  try {
    const { nome, email, telefone } = req.body;

    if (!nome || !email) {
      return res.status(400).json({ error: "Nome e email são obrigatórios" });
    }

    const userPath = path.join(
      __dirname,
      "..",
      "data",
      "users",
      `${email}.json`
    );

    const userData = {
      nome,
      email,
      telefone: telefone || null,
      createdAt: new Date().toISOString(),
      onboardingCompleted: false,
    };

    await fs.writeFile(userPath, JSON.stringify(userData, null, 2));
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});
module.exports = router;
