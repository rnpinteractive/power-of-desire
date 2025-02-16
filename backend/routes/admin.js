const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");

// Listar todos usuários
router.get("/users", async (req, res) => {
  try {
    const usersDir = path.join(__dirname, "..", "data", "users");
    const userDirs = await fs.readdir(usersDir);

    const users = await Promise.all(
      userDirs
        .filter((dir) => !dir.endsWith(".json")) // Ignora arquivos .json soltos
        .map(async (userDir) => {
          try {
            const profilePath = path.join(usersDir, userDir, "profile.json");
            const onboardingPath = path.join(
              usersDir,
              userDir,
              "onboarding.json"
            );

            const profile = JSON.parse(await fs.readFile(profilePath, "utf8"));
            try {
              const onboarding = JSON.parse(
                await fs.readFile(onboardingPath, "utf8")
              );
              return { ...profile, ...onboarding };
            } catch (err) {
              return profile;
            }
          } catch (error) {
            console.error(`Error reading user ${userDir}:`, error);
            return null;
          }
        })
    ).then((users) => users.filter(Boolean));

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar usuários" });
  }
});

// Criar usuário
router.post("/users", async (req, res) => {
  try {
    const { nome, email, telefone } = req.body;

    if (!nome || !email) {
      return res.status(400).json({ error: "Nome e email são obrigatórios" });
    }

    const userDir = path.join(__dirname, "..", "data", "users", email);

    // Verifica se usuário já existe
    try {
      await fs.access(userDir);
      return res.status(400).json({ error: "Usuário já existe" });
    } catch {
      // Continua se o usuário não existir
    }

    // Criar estrutura de diretórios
    await fs.mkdir(userDir, { recursive: true });
    await fs.mkdir(path.join(userDir, "plans"), { recursive: true });

    // Dados do perfil
    const userData = {
      nome,
      email,
      telefone: telefone || null,
      createdAt: new Date().toISOString(),
      onboardingCompleted: false,
    };

    // Salvar profile.json
    await fs.writeFile(
      path.join(userDir, "profile.json"),
      JSON.stringify(userData, null, 2)
    );

    res.json(userData);
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

// Deletar usuário
router.delete("/users/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const userDir = path.join(__dirname, "..", "data", "users", email);

    // Verifica se o diretório existe
    try {
      await fs.access(userDir);
      await fs.rm(userDir, { recursive: true, force: true });
      res.json({ message: "Usuário deletado com sucesso" });
    } catch {
      res.status(404).json({ error: "Usuário não encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar usuário" });
  }
});

module.exports = router;
