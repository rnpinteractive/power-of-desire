const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");

// Listar todos os usuários
router.get("/users", async (req, res) => {
  try {
    const usersDir = path.join(__dirname, "..", "data", "users");
    const userDirs = await fs.readdir(usersDir);

    const users = await Promise.all(
      userDirs
        .filter((dir) => !dir.endsWith(".json"))
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
    );
    res.json(users.filter(Boolean));
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar usuários" });
  }
});

// Criar usuário
router.post("/users", async (req, res) => {
  try {
    const { nome, email, telefone, oraclePrime } = req.body;
    if (!nome || !email) {
      return res.status(400).json({ error: "Nome e email são obrigatórios" });
    }

    const userDir = path.join(__dirname, "..", "data", "users", email);

    try {
      await fs.access(userDir);
      return res.status(400).json({ error: "Usuário já existe" });
    } catch {
      // Se não existir, continua
    }

    await fs.mkdir(userDir, { recursive: true });
    await fs.mkdir(path.join(userDir, "plans"), { recursive: true });

    const userData = {
      nome,
      email,
      telefone: telefone || null,
      createdAt: new Date().toISOString(),
      onboardingCompleted: false,
      ...(oraclePrime
        ? {
            oraclePrime: {
              isActive: true,
              activatedAt: new Date().toISOString(),
            },
          }
        : {}),
    };

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

// Oracle Prime status
router.post("/users/:email/oracle-status", async (req, res) => {
  try {
    const { email } = req.params;
    const { isActive } = req.body;
    const profilePath = path.join(
      __dirname,
      "..",
      "data",
      "users",
      email,
      "profile.json"
    );

    const userData = JSON.parse(await fs.readFile(profilePath, "utf8"));

    userData.oraclePrime = {
      isActive,
      activatedAt: isActive
        ? new Date().toISOString()
        : userData.oraclePrime?.activatedAt,
      deactivatedAt: !isActive ? new Date().toISOString() : null,
    };

    await fs.writeFile(profilePath, JSON.stringify(userData, null, 2));
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar status" });
  }
});

module.exports = router;
