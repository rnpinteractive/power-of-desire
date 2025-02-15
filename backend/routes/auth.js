const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");

router.post("/login", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email é obrigatório" });
  }

  const userFilePath = path.join(
    __dirname,
    "..",
    "data",
    "users",
    `${email}.json`
  );

  try {
    await fs.access(userFilePath);
    // Usuário existe
    const userData = await fs.readFile(userFilePath, "utf8");
    const user = JSON.parse(userData);
    res.json({
      user,
      isNew: false,
    });
  } catch (error) {
    // Novo usuário
    const newUser = {
      email,
      createdAt: new Date().toISOString(),
      onboardingCompleted: false,
    };

    await fs.writeFile(userFilePath, JSON.stringify(newUser, null, 2));
    res.json({
      user: newUser,
      isNew: true,
    });
  }
});

module.exports = router;
