const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");

// Rota de busca de artigos
router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;
    const articlesDir = path.join(__dirname, "..", "data", "articles");

    // Cria o diretório se não existir
    await fs.mkdir(articlesDir, { recursive: true });

    // Lê todos os arquivos do diretório
    const files = await fs.readdir(articlesDir);

    // Se não houver arquivos, retorna array vazio
    if (files.length === 0) {
      return res.json([]);
    }

    // Lê o conteúdo de cada arquivo
    const articles = await Promise.all(
      files.map(async (file) => {
        try {
          const content = await fs.readFile(
            path.join(articlesDir, file),
            "utf8"
          );
          return JSON.parse(content);
        } catch (error) {
          console.error(`Erro ao ler arquivo ${file}:`, error);
          return null;
        }
      })
    ).then((articles) => articles.filter(Boolean)); // Remove artigos nulos

    // Se tiver query, filtra os artigos
    if (query) {
      const searchResults = articles.filter((article) => {
        const searchString = [
          article.titulo || "",
          article.conteudo || "",
          ...(Array.isArray(article.palavras_chave)
            ? article.palavras_chave
            : []),
        ]
          .join(" ")
          .toLowerCase();

        return searchString.includes(query.toLowerCase());
      });
      res.json(searchResults);
    } else {
      // Se não tiver query, retorna todos
      res.json(articles);
    }
  } catch (error) {
    console.error("Erro ao buscar artigos:", error);
    res.status(500).json({ error: "Erro ao buscar artigos" });
  }
});

// Adicione esta rota junto com a rota de search
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const articlesDir = path.join(__dirname, "..", "data", "articles");
    const files = await fs.readdir(articlesDir);

    // Procura o arquivo do artigo
    for (const file of files) {
      const content = await fs.readFile(path.join(articlesDir, file), "utf8");
      const article = JSON.parse(content);
      if (article.id === id) {
        return res.json(article);
      }
    }

    res.status(404).json({ error: "Artigo não encontrado" });
  } catch (error) {
    console.error("Erro ao buscar artigo:", error);
    res.status(500).json({ error: "Erro ao buscar artigo" });
  }
});

module.exports = router;
