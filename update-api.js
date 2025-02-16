const fs = require("fs").promises;
const path = require("path");

const files = {
  "frontend/src/components/AdminPanel.jsx": [
    {
      from: /fetch\(\s*`http:\/\/localhost:3000\/api\/admin\/users\/\${selectedUser\.email}`/g,
      to: "api.fetch(`/admin/users/${selectedUser.email}`",
    },
    {
      from: /fetch\(\s*`http:\/\/localhost:3000\/api\/admin\/users\/\${user\.email}`/g,
      to: "api.fetch(`/admin/users/${user.email}`",
    },
    {
      from: /fetch\(\s*`http:\/\/localhost:3000\/api\/admin\/users\/\${user\.email}\/reset-onboarding`/g,
      to: "api.fetch(`/admin/users/${user.email}/reset-onboarding`",
    },
  ],
  "frontend/src/components/Dashboard.jsx": [
    {
      from: /fetch\(\s*"http:\/\/localhost:3000\/api\/articles\/search"/g,
      to: 'api.fetch("/articles/search"',
    },
    {
      from: /fetch\(\s*`http:\/\/localhost:3000\/api\/users\/refund\/\${user\.email}`/g,
      to: "api.fetch(`/users/refund/${user.email}`",
    },
  ],
  "frontend/src/components/Onboarding.jsx": [
    {
      from: /fetch\(\s*"http:\/\/localhost:3000\/api\/users\/onboarding"/g,
      to: 'api.fetch("/users/onboarding"',
    },
  ],
  "frontend/src/components/RefundModal.jsx": [
    {
      from: /fetch\(\s*`http:\/\/localhost:3000\/api\/users\/refund\/\${userEmail}`/g,
      to: "api.fetch(`/users/refund/${userEmail}`",
    },
    {
      from: /fetch\(\s*"http:\/\/localhost:3000\/api\/users\/refund"/g,
      to: 'api.fetch("/users/refund"',
    },
  ],
  "frontend/src/pages/ArticlePage.jsx": [
    {
      from: /fetch\(\s*`http:\/\/localhost:3000\/api\/articles\/\${id}`/g,
      to: "api.fetch(`/articles/${id}`",
    },
  ],
};

const addImport = (content) => {
  if (!content.includes("import { api }")) {
    return "import { api } from '../services/api';\n" + content;
  }
  return content;
};

const updateFile = async (filePath, replacements) => {
  try {
    console.log(`📝 Processando ${filePath}...`);
    let content = await fs.readFile(filePath, "utf-8");

    // Adicionar import se necessário
    content = addImport(content);

    // Fazer substituições
    replacements.forEach(({ from, to }) => {
      content = content.replace(from, to);
    });

    await fs.writeFile(filePath, content);
    console.log(`✅ Atualizado: ${filePath}`);
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error);
  }
};

const main = async () => {
  console.log("🚀 Iniciando atualizações das chamadas API...\n");

  for (const [file, replacements] of Object.entries(files)) {
    await updateFile(file, replacements);
  }

  console.log("\n✨ Processo concluído!");
  console.log("\nPróximos passos:");
  console.log("1. Verifique as alterações");
  console.log("2. Faça commit e push para o GitHub");
  console.log("3. Execute o deploy.sh no servidor");
};

main();
