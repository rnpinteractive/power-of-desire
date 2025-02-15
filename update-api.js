const fs = require("fs").promises;
const path = require("path");

// Criar o serviço de API
const createApiService = async () => {
  const apiServiceContent = `const API_BASE_URL = import.meta.env.PROD 
  ? 'https://pod.makehimbeg.com/api'
  : 'http://localhost:3000/api';

export const api = {
  baseURL: API_BASE_URL,
  async fetch(endpoint, options = {}) {
    const response = await fetch(\`\${API_BASE_URL}\${endpoint}\`, options);
    return response;
  }
};
`;

  const servicesDir = path.join(__dirname, "frontend", "src", "services");
  await fs.mkdir(servicesDir, { recursive: true });
  await fs.writeFile(path.join(servicesDir, "api.js"), apiServiceContent);
  console.log("✅ Created api.js service");
};

// Função para ler e atualizar um arquivo
const updateFile = async (filePath, replacements) => {
  try {
    let content = await fs.readFile(filePath, "utf-8");

    // Adicionar import do serviço de API se necessário
    if (content.includes("http://localhost:3000/api")) {
      const importStatement = `import { api } from '../services/api';\n`;
      if (!content.includes(importStatement)) {
        content = importStatement + content;
      }
    }

    // Fazer as substituições
    replacements.forEach(({ from, to }) => {
      content = content.replace(new RegExp(from, "g"), to);
    });

    await fs.writeFile(filePath, content);
    console.log(`✅ Updated ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error);
  }
};

// Lista de arquivos e suas substituições
const updates = [
  {
    file: "frontend/src/components/Login.jsx",
    replacements: [
      {
        from: 'fetch\\("http://localhost:3000/api/auth/login"',
        to: 'api.fetch("/auth/login"',
      },
    ],
  },
  {
    file: "frontend/src/components/ArticleSearch.jsx",
    replacements: [
      {
        from: 'fetch\\("http://localhost:3000/api/articles/search"',
        to: 'api.fetch("/articles/search"',
      },
    ],
  },
  {
    file: "frontend/src/pages/ArticlePage.jsx",
    replacements: [
      {
        from: "fetch\\(`http://localhost:3000/api/articles/\\${id}`",
        to: "api.fetch(`/articles/${id}`",
      },
    ],
  },
  {
    file: "frontend/src/components/Dashboard.jsx",
    replacements: [
      {
        from: 'fetch\\("http://localhost:3000/api/articles/search"',
        to: 'api.fetch("/articles/search"',
      },
      {
        from: "fetch\\(`http://localhost:3000/api/users/refund/\\${user.email}`",
        to: "api.fetch(`/users/refund/${user.email}`",
      },
    ],
  },
  {
    file: "frontend/src/components/WeekPlan.jsx",
    replacements: [
      {
        from: "`http://localhost:3000/api/users/\\${user.email}/plan/\\${dia}`",
        to: "`/users/${user.email}/plan/${dia}`",
      },
    ],
  },
  {
    file: "frontend/src/components/Onboarding.jsx",
    replacements: [
      {
        from: 'fetch\\("http://localhost:3000/api/users/onboarding"',
        to: 'api.fetch("/users/onboarding"',
      },
    ],
  },
  {
    file: "frontend/src/components/AdminPanel.jsx",
    replacements: [
      {
        from: 'fetch\\("http://localhost:3000/api/admin/users"',
        to: 'api.fetch("/admin/users"',
      },
    ],
  },
  {
    file: "frontend/src/components/RefundModal.jsx",
    replacements: [
      {
        from: "fetch\\(`http://localhost:3000/api/users/refund/\\${userEmail}`",
        to: "api.fetch(`/users/refund/${userEmail}`",
      },
    ],
  },
];

// Função principal
const main = async () => {
  try {
    // Criar serviço de API
    await createApiService();

    // Atualizar todos os arquivos
    for (const update of updates) {
      await updateFile(path.join(__dirname, update.file), update.replacements);
    }

    console.log("\n✨ All files updated successfully!");
  } catch (error) {
    console.error("❌ Error:", error);
  }
};

main();
