const express = require("express");
const router = express.Router();
const {
  processOracleWebhook,
} = require("../controllers/oracleWebhookController");

// Middleware para logging
router.use((req, res, next) => {
  console.log("Oracle Webhook Request:", {
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString(),
  });
  next();
});

router.post("/", processOracleWebhook);

module.exports = router;
