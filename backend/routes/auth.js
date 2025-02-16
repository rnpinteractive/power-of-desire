const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");

router.post("/login", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const userFilePath = path.join(
    __dirname,
    "..",
    "data",
    "users",
    `${email}.json`
  );

  try {
    // Verifica se o arquivo existe
    await fs.access(userFilePath);
    // Se existe, retorna os dados do usuário
    const userData = await fs.readFile(userFilePath, "utf8");
    const user = JSON.parse(userData);
    res.json({
      user,
      isNew: false,
    });
  } catch (error) {
    // Se o arquivo não existe, retorna erro
    res.status(404).json({
      error: "User not found. Please contact support to register.",
      isNew: true,
    });
  }
});

module.exports = router;
