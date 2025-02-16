const fs = require("fs").promises;
const path = require("path");

// Função para criar estrutura de diretórios para um usuário
const createUserStructure = async (userEmail, userData) => {
  const userDir = path.join(__dirname, "backend", "data", "users", userEmail);

  await fs.mkdir(userDir, { recursive: true });
  await fs.mkdir(path.join(userDir, "plans"), { recursive: true });

  const profileData = {
    email: userData.email,
    nome: userData.nome,
    telefone: userData.telefone,
    createdAt: userData.createdAt,
    onboardingCompleted: userData.onboardingCompleted,
    updatedAt: userData.updatedAt,
  };

  const onboardingData = {
    objective: userData.objective,
    timeWithoutContact: userData.timeWithoutContact,
    separationCause: userData.separationCause,
    messagesReaction: userData.messagesReaction,
    lastMessage: userData.lastMessage,
    currentInterest: userData.currentInterest,
    currentStatus: userData.currentStatus,
    routine: userData.routine,
    recentAttempts: userData.recentAttempts,
    desiredOutcome: userData.desiredOutcome,
  };

  await fs.writeFile(
    path.join(userDir, "profile.json"),
    JSON.stringify(profileData, null, 2)
  );

  if (Object.values(onboardingData).some((val) => val)) {
    await fs.writeFile(
      path.join(userDir, "onboarding.json"),
      JSON.stringify(onboardingData, null, 2)
    );
  }

  if (userData.plans) {
    for (const [day, plan] of Object.entries(userData.plans)) {
      await fs.writeFile(
        path.join(userDir, "plans", `day-${day}.json`),
        JSON.stringify(plan, null, 2)
      );
    }
  }

  try {
    const refundPath = path.join(
      __dirname,
      "backend",
      "data",
      "users",
      `${userEmail}_refund.json`
    );
    const refundData = await fs.readFile(refundPath, "utf8");
    await fs.writeFile(path.join(userDir, "refund.json"), refundData);
  } catch (error) {
    // Ignora se não existir arquivo de reembolso
  }
};

const updateFiles = {
  // Rotas e Controllers
  "backend/routes/auth.js": `
const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");

router.post("/login", async (req, res) => {
  const { email } = req.body;
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

  try {
    await fs.access(userProfilePath);
    const userData = await fs.readFile(userProfilePath, "utf8");
    const user = JSON.parse(userData);

    // Carregar dados do onboarding se existirem
    try {
      const onboardingPath = path.join(
        __dirname,
        "..",
        "data",
        "users",
        email,
        "onboarding.json"
      );
      const onboardingData = JSON.parse(await fs.readFile(onboardingPath, "utf8"));
      Object.assign(user, onboardingData);
    } catch (err) {
      // Ignora se não tiver dados de onboarding
    }

    res.json({
      user,
      isNew: false,
    });
  } catch (error) {
    res.status(404).json({
      error: "User not registered. Please contact support.",
      isNew: true,
    });
  }
});

module.exports = router;`,

  "backend/routes/users.js": `
const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");
const planController = require("../controllers/planController");

router.post("/onboarding", async (req, res) => {
  try {
    const { email, ...onboardingData } = req.body;
    const userDir = path.join(__dirname, "..", "data", "users", email);
    const profilePath = path.join(userDir, "profile.json");
    const onboardingPath = path.join(userDir, "onboarding.json");

    // Verifica se o usuário existe
    const userData = JSON.parse(await fs.readFile(profilePath, "utf8"));

    // Salva dados do onboarding
    await fs.writeFile(onboardingPath, JSON.stringify(onboardingData, null, 2));

    // Atualiza status no profile
    userData.onboardingCompleted = true;
    userData.updatedAt = new Date().toISOString();
    await fs.writeFile(profilePath, JSON.stringify(userData, null, 2));

    res.json({ ...userData, ...onboardingData });
  } catch (error) {
    console.error("Erro ao salvar onboarding:", error);
    res.status(500).json({ error: "Erro ao salvar dados do onboarding" });
  }
});

router.get("/:email/plan/:dia", async (req, res) => {
  try {
    const { email, dia } = req.params;
    const { regenerate } = req.query;
    
    const planPath = path.join(
      __dirname,
      "..",
      "data",
      "users",
      email,
      "plans",
      \`day-\${dia}.json\`
    );

    // Se não é para regenerar e já existe plano, retorna o existente
    if (!regenerate) {
      try {
        const existingPlan = await fs.readFile(planPath, "utf8");
        return res.json(JSON.parse(existingPlan));
      } catch (err) {
        // Continua se o plano não existir
      }
    }

    // Carrega dados do usuário para gerar novo plano
    const profilePath = path.join(
      __dirname,
      "..",
      "data",
      "users",
      email,
      "profile.json"
    );
    const onboardingPath = path.join(
      __dirname,
      "..",
      "data",
      "users",
      email,
      "onboarding.json"
    );

    const profile = JSON.parse(await fs.readFile(profilePath, "utf8"));
    const onboarding = JSON.parse(await fs.readFile(onboardingPath, "utf8"));
    const userData = { ...profile, ...onboarding };

    const novoPlan = await planController.generatePlan(userData, dia);
    res.json(novoPlan);
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).json({ error: "Erro ao buscar/gerar plano" });
  }
});

module.exports = router;`,

  "backend/controllers/planController.js": `
const openai = require("../config/openai");
const fs = require("fs").promises;
const path = require("path");

const generatePlan = async (userData, day) => {
  try {
    const prompt = \`Based on the following user information:
Objective: \${userData.objective}
Time Without Contact: \${userData.timeWithoutContact}
Separation Cause: \${userData.separationCause}
Reaction to Messages: \${userData.messagesReaction}
Last Message: \${userData.lastMessage}
Current Interest: \${userData.currentInterest}
Current Status: \${userData.currentStatus}

Now, generate a highly personalized 7-day reconquest plan for DAY \${day}. Do NOT offer generic advice like "be yourself" or "stay confident." Instead, deliver a tactical blueprint that leverages dark psychology and concrete, proven techniques to re-capture his attention and transform your life.

Your strategy must be bold and precise—designed to unsettle his complacency and trigger his primal instincts. Include specific language cues, exact timing recommendations, and behavioral triggers that exploit his vulnerabilities at a deep neurochemical level. Think in terms of environmental triggers, emotional cues, and targeted messaging that force him to re-evaluate his current state and crave your influence.

Return ONLY a VALID JSON OBJECT in the EXACT format below:
{
  "day": \${day},
  "title": "A motivational and assertive title for the day",
  "subtitle": "A subtitle that frames the day's strategy with clarity and intensity",
  "message": {
    "text": "A strategically crafted message designed to be sent, laden with persuasive, dark psychological cues",
    "context": "A brief explanation of the message's objective and optimal timing"
  },
  "tips": [
    {
      "title": "Clear, action-driven title for the first tip",
      "text": "A direct explanation of the first tip, highlighting its strategic value"
    },
    {
      "title": "Clear, action-driven title for the second tip",
      "text": "A direct explanation of the second tip, emphasizing its role in reactivating his desire"
    },
    {
      "title": "Clear, action-driven title for the third tip",
      "text": "A direct explanation of the third tip, focusing on consolidating your influence"
    }
  ],
  "avoid": [
    {
      "title": "First critical point to avoid",
      "text": "An explanation of why this must be avoided and the potential consequences of ignoring it"
    },
    {
      "title": "Second critical point to avoid",
      "text": "An explanation of why this must be avoided and the potential consequences of ignoring it"
    }
  ]
}\`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content:
            "You are a relationship expert who provides responses EXCLUSIVELY in a valid JSON format. Never include text or explanations outside the JSON.",
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

    const responseContent = completion.choices[0].message.content.trim();
    const planDoDia = JSON.parse(responseContent);

    if (
      !planDoDia.day ||
      !planDoDia.title ||
      !planDoDia.message ||
      !Array.isArray(planDoDia.tips) ||
      !Array.isArray(planDoDia.avoid)
    ) {
      throw new Error("The AI response does not contain the expected structure");
    }

    // Salvar o plano na pasta do usuário
    const planDir = path.join(
      __dirname,
      "../data/users",
      userData.email,
      "plans"
    );
    
    await fs.mkdir(planDir, { recursive: true });
    
    const planPath = path.join(planDir, \`day-\${day}.json\`);
    await fs.writeFile(
      planPath,
      JSON.stringify({
        ...planDoDia,
        generatedAt: new Date().toISOString()
      }, null, 2)
    );

    return planDoDia;
  } catch (error) {
    console.error("Error generating plan:", error);
    if (error instanceof SyntaxError) {
      throw new Error("Error processing AI response: Invalid JSON");
    }
    throw error;
  }
};

module.exports = { generatePlan };`,

  "backend/routes/admin.js": `
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
          console.error(\`Error reading user \${userDir}:\`, error);
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

module.exports = router;`,
};

// Função para atualizar os arquivos
const updateCodebase = async () => {
  for (const [file, content] of Object.entries(updateFiles)) {
    try {
      const filePath = path.join(__dirname, file);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content.trim());
      console.log(`✅ Atualizado: ${file}`);
    } catch (error) {
      console.error(`❌ Erro ao atualizar ${file}:`, error);
    }
  }
};

// Continuação do script anterior...

// Execução principal
const main = async () => {
  console.log("🚀 Iniciando reestruturação do projeto...\n");

  // Backup dos dados atuais
  console.log("📦 Fazendo backup dos dados existentes...");
  const backupDir = path.join(
    __dirname,
    "backend",
    "data",
    "_backup_" + Date.now()
  );
  await fs.mkdir(backupDir, { recursive: true });
  await fs.cp(
    path.join(__dirname, "backend", "data", "users"),
    path.join(backupDir, "users"),
    { recursive: true }
  );

  // Migrar dados existentes
  console.log("🔄 Migrando dados para nova estrutura...");
  const usersDir = path.join(__dirname, "backend", "data", "users");
  const files = await fs.readdir(usersDir);

  for (const file of files) {
    if (file.endsWith(".json") && !file.includes("_refund")) {
      try {
        const userData = JSON.parse(
          await fs.readFile(path.join(usersDir, file), "utf8")
        );
        const userEmail = userData.email;

        if (userEmail) {
          await createUserStructure(userEmail, userData);
          console.log(`✅ Migrado: ${userEmail}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao migrar ${file}:`, error);
      }
    }
  }

  // Atualizar código
  console.log("\n📝 Atualizando código fonte...");
  await updateCodebase();

  console.log("\n✨ Reestruturação concluída!");
  console.log("\nPróximos passos:");
  console.log("1. Verifique os dados migrados em backend/data/users/");
  console.log("2. Verifique se o backup foi criado em backend/data/_backup_*");
  console.log("3. Teste o sistema localmente");
  console.log("4. Faça commit das alterações:");
  console.log("   git add .");
  console.log('   git commit -m "Restructure user data and update codebase"');
  console.log("   git push");
  console.log("5. Execute deploy.sh no servidor");
  console.log(
    "\n⚠️  IMPORTANTE: Mantenha o backup até confirmar que tudo está funcionando!"
  );
};

main().catch(console.error);
