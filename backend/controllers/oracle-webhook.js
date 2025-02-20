const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

const HOTMART_WEBHOOK_SECRET = "jxw4V0smfdPwstXOrdNxkzAkwcyhOA2167811"; // Mesmo do outro webhook

const verifySignature = (rawBody, hottok) => {
  return true; // Para testes, igual ao outro
};

const activateOraclePrime = async (email) => {
  try {
    const userDir = path.join(__dirname, "..", "data", "users", email);
    const profilePath = path.join(userDir, "profile.json");

    const userData = JSON.parse(await fs.readFile(profilePath, "utf8"));

    userData.oraclePrime = {
      isActive: true,
      activatedAt: new Date().toISOString(),
    };

    await fs.writeFile(profilePath, JSON.stringify(userData, null, 2));
    return true;
  } catch (error) {
    console.error("Erro ao ativar Oracle Prime:", error);
    return false;
  }
};

const deactivateOraclePrime = async (email) => {
  try {
    const profilePath = path.join(
      __dirname,
      "..",
      "data",
      "users",
      email,
      "profile.json"
    );

    const userData = JSON.parse(await fs.readFile(profilePath, "utf8"));

    userData.oraclePrime = {
      isActive: false,
      deactivatedAt: new Date().toISOString(),
      wasActive: true,
    };

    await fs.writeFile(profilePath, JSON.stringify(userData, null, 2));
    return true;
  } catch (error) {
    console.error("Erro ao desativar Oracle Prime:", error);
    return false;
  }
};

const processOracleWebhook = async (req, res) => {
  try {
    console.log("Oracle Webhook recebido:", JSON.stringify(req.body, null, 2));

    if (!verifySignature(req.rawBody, req.body.hottok)) {
      return res.status(403).json({ error: "Invalid hottok" });
    }

    const { event, data } = req.body;
    console.log("Evento Oracle recebido:", event);

    switch (event.toUpperCase()) {
      case "PURCHASE_APPROVED": {
        const success = await activateOraclePrime(data.buyer.email);
        if (!success) {
          throw new Error(
            `Falha ao ativar Oracle Prime para ${data.buyer.email}`
          );
        }
        break;
      }

      case "REFUND":
      case "PURCHASE_PROTEST":
      case "PURCHASE_CHARGEBACK":
      case "CHARGEBACK": {
        const success = await deactivateOraclePrime(data.buyer.email);
        if (!success) {
          throw new Error(
            `Falha ao desativar Oracle Prime para ${data.buyer.email}`
          );
        }
        break;
      }

      default:
        console.log("Evento não processado:", event);
        return res.status(200).json({ message: "Evento não reconhecido" });
    }

    return res
      .status(200)
      .json({ message: "Oracle webhook processado com sucesso" });
  } catch (error) {
    console.error("Erro ao processar oracle webhook:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};

module.exports = { processOracleWebhook };
