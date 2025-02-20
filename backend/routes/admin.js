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

    // Verifica se o usuário já existe
    try {
      await fs.access(userDir);
      return res.status(400).json({ error: "Usuário já existe" });
    } catch {
      // Se não existir, continua
    }

    // Cria a estrutura de diretórios
    await fs.mkdir(userDir, { recursive: true });
    await fs.mkdir(path.join(userDir, "plans"), { recursive: true });

    const userData = {
      nome,
      email,
      telefone: telefone || null,
      createdAt: new Date().toISOString(),
      onboardingCompleted: false,
      ...(oraclePrime && {
        oraclePrime: {
          isActive: true,
          activatedAt: new Date().toISOString(),
        },
      }),
    };

    // Salva o profile.json
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

// Atualizar usuário
router.put("/users/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const updates = req.body;
    const userDir = path.join(__dirname, "..", "data", "users", email);
    const profilePath = path.join(userDir, "profile.json");

    // Verifica se o usuário existe
    try {
      await fs.access(profilePath);
    } catch {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Lê o perfil atual
    const currentProfile = JSON.parse(await fs.readFile(profilePath, "utf8"));

    // Atualiza os dados
    const updatedProfile = {
      ...currentProfile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Salva as alterações
    await fs.writeFile(profilePath, JSON.stringify(updatedProfile, null, 2));

    res.json(updatedProfile);
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
});

// Reset Onboarding
router.post("/users/:email/reset-onboarding", async (req, res) => {
  try {
    const { email } = req.params;
    const userDir = path.join(__dirname, "..", "data", "users", email);
    const profilePath = path.join(userDir, "profile.json");
    const onboardingPath = path.join(userDir, "onboarding.json");

    // Verifica se o usuário existe
    const userData = JSON.parse(await fs.readFile(profilePath, "utf8"));

    // Remove onboarding se existir
    try {
      await fs.unlink(onboardingPath);
    } catch {
      // Ignora se não existir
    }

    // Atualiza status no profile
    userData.onboardingCompleted = false;
    userData.updatedAt = new Date().toISOString();

    await fs.writeFile(profilePath, JSON.stringify(userData, null, 2));

    res.json(userData);
  } catch (error) {
    console.error("Erro ao resetar onboarding:", error);
    res.status(500).json({ error: "Erro ao resetar onboarding" });
  }
});

// Atualizar status do Oracle Prime
router.post("/users/:email/oracle-status", async (req, res) => {
  try {
    const { email } = req.params;
    const { isActive } = req.body;
    const userDir = path.join(__dirname, "..", "data", "users", email);
    const profilePath = path.join(userDir, "profile.json");

    // Verifica se o usuário existe
    const userData = JSON.parse(await fs.readFile(profilePath, "utf8"));

    // Atualiza o status do Oracle Prime
    userData.oraclePrime = {
      isActive,
      activatedAt: isActive ? new Date().toISOString() : null,
      // Mantém histórico se estava ativo antes
      ...(userData.oraclePrime?.isActive && !isActive
        ? { wasActive: true }
        : {}),
    };

    await fs.writeFile(profilePath, JSON.stringify(userData, null, 2));

    res.json(userData);
  } catch (error) {
    console.error("Erro ao atualizar status Oracle Prime:", error);
    res.status(500).json({ error: "Erro ao atualizar status Oracle Prime" });
  }
});

module.exports = router;
