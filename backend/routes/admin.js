const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");

router.get("/users", async (req, res) => {
  try {
    const usersDir = path.join(__dirname, "..", "data", "users");
    const userDirs = await fs.readdir(usersDir);
    
    const users = await Promise.all(
      userDirs.map(async (userDir) => {
        try {
          const profilePath = path.join(usersDir, userDir, "profile.json");
          const onboardingPath = path.join(usersDir, userDir, "onboarding.json");
          
          const profile = JSON.parse(await fs.readFile(profilePath, "utf8"));
          try {
            const onboarding = JSON.parse(await fs.readFile(onboardingPath, "utf8"));
            return { ...profile, ...onboarding };
          } catch (err) {
            return profile;
          }
        } catch (error) {
          console.error(`Error reading user ${userDir}:`, error);
          return null;
        }
      })
    ).then(users => users.filter(Boolean));
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar usuários" });
  }
});

router.post("/users", async (req, res) => {
  try {
    const { nome, email, telefone } = req.body;

    if (!nome || !email) {
      return res.status(400).json({ error: "Nome e email são obrigatórios" });
    }

    const userDir = path.join(__dirname, "..", "data", "users", email);
    const profilePath = path.join(userDir, "profile.json");

    await fs.mkdir(userDir, { recursive: true });
    await fs.mkdir(path.join(userDir, "plans"), { recursive: true });

    const userData = {
      nome,
      email,
      telefone: telefone || null,
      createdAt: new Date().toISOString(),
      onboardingCompleted: false,
    };

    await fs.writeFile(profilePath, JSON.stringify(userData, null, 2));
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

router.delete("/users/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const userDir = path.join(__dirname, "..", "data", "users", email);
    
    await fs.rm(userDir, { recursive: true, force: true });
    res.json({ message: "Usuário deletado com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar usuário" });
  }
});

module.exports = router;