const express = require("express");
const router = express.Router();
const { processOracleWebhook } = require("../controllers/oracle-webhook");

router.post("/", processOracleWebhook);

module.exports = router;
