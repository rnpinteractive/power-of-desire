const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/users");
const articlesRoutes = require("./routes/articles");
const webhookRoutes = require("./routes/webhook");
const authRoutes = require("./routes/auth"); // Add auth routes
const oracleRoutes = require("./routes/oracle");
const oracleWebhookRoutes = require("./routes/oracle-webhook"); // Nova linha

// Before app.use(express.json())
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(cors());

// Routes
app.use("/api/auth", authRoutes); // Add auth routes
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/articles", articlesRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/oracle-prime", oracleRoutes);
app.use("/api/oracle-webhook", oracleWebhookRoutes); // Nova linha

// Create necessary directories
const createDirectories = async () => {
  const dirs = ["users", "articles", "plans"];
  for (const dir of dirs) {
    await fs.mkdir(path.join(__dirname, "data", dir), { recursive: true });
  }
};

createDirectories();

// Articles route
app.get("/api/articles", async (req, res) => {
  const articlesPath = path.join(__dirname, "data", "articles");
  try {
    const files = await fs.readdir(articlesPath);
    const articles = await Promise.all(
      files.map(async (file) => {
        const content = await fs.readFile(
          path.join(articlesPath, file),
          "utf8"
        );
        return JSON.parse(content);
      })
    );
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: "Error fetching articles" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
