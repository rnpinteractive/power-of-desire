const fs = require("fs");
const path = require("path");

// Caminho para a pasta dos JSONs (ajuste conforme necessário)
const articlesDir = path.join(__dirname, "data", "articles");

// Mapeamento dos arquivos para suas novas categorias
const categoryMapping = {
  "elogio-vislumbre-tentador.json": "Initial Activation",
  "elogio-obsessao-total.json": "Intensification & Amplification",
  "elogio-esquecimento-silencioso.json": "Intensification & Amplification",
  "elogio-conexao-profunda.json": "Intensification & Amplification",
  "elogio-dependencia-total.json": "Intensification & Amplification",
  "elogio-exclusividade.json": "Maintenance & Permanence",
  "qualidade-amnesia-secreta.json": "Intensification & Amplification",
  "gatilho-amnesia-total.json": "Initial Activation",
  "elogio-revelador.json": "Intensification & Amplification",
  "return-compliment.json": "Maintenance & Permanence",
  "commitment-compliment.json": "Maintenance & Permanence",
  "4-magic-words-compliment.json": "Initial Activation",
  "progressive-amnesia-compliment.json": "Maintenance & Permanence",
  "total-attention-compliment.json": "Intensification & Amplification",
};

function updateCategories() {
  Object.entries(categoryMapping).forEach(([fileName, newCategory]) => {
    const filePath = path.join(articlesDir, fileName);

    try {
      // Lê o arquivo JSON atual
      const rawData = fs.readFileSync(filePath, "utf8");
      const jsonData = JSON.parse(rawData);

      // Atualiza a propriedade "categoria"
      jsonData.categoria = newCategory;

      // Sobrescreve o arquivo com a nova categoria
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), "utf8");

      console.log(`✔ ${fileName} atualizado para categoria: "${newCategory}"`);
    } catch (error) {
      console.error(`✖ Erro ao atualizar ${fileName}: ${error.message}`);
    }
  });
}

// Executa a atualização
updateCategories();
