const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

const HOTMART_WEBHOOK_SECRET = "jxw4V0smfdPwstXOrdNxkzAkwcyhOA2167811";

const verifySignature = (rawBody, hottok) => {
  // Para ambiente de produção, implementar verificação real
  return true;
};

const activateOraclePrime = async (email) => {
  try {
    if (!email) {
      throw new Error("Email não fornecido para ativação");
    }

    const userDir = path.join(__dirname, "..", "data", "users", email);
    const profilePath = path.join(userDir, "profile.json");

    // Verifica se o diretório existe
    try {
      await fs.access(userDir);
    } catch (error) {
      throw new Error(`Diretório do usuário não encontrado para: ${email}`);
    }

    // Lê e atualiza o perfil
    const userData = JSON.parse(await fs.readFile(profilePath, "utf8"));

    userData.oraclePrime = {
      isActive: true,
      activatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    await fs.writeFile(profilePath, JSON.stringify(userData, null, 2));
    console.log(`Oracle Prime ativado com sucesso para: ${email}`);
    return true;
  } catch (error) {
    console.error("Erro ao ativar Oracle Prime:", error);
    throw error;
  }
};

const deactivateOraclePrime = async (email) => {
  try {
    if (!email) {
      throw new Error("Email não fornecido para desativação");
    }

    const profilePath = path.join(
      __dirname,
      "..",
      "data",
      "users",
      email,
      "profile.json"
    );

    // Verifica se o arquivo existe
    try {
      await fs.access(profilePath);
    } catch (error) {
      throw new Error(`Perfil não encontrado para: ${email}`);
    }

    const userData = JSON.parse(await fs.readFile(profilePath, "utf8"));

    userData.oraclePrime = {
      isActive: false,
      deactivatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      wasActive: true,
    };

    await fs.writeFile(profilePath, JSON.stringify(userData, null, 2));
    console.log(`Oracle Prime desativado com sucesso para: ${email}`);
    return true;
  } catch (error) {
    console.error("Erro ao desativar Oracle Prime:", error);
    throw error;
  }
};

const processOracleWebhook = async (req, res) => {
  try {
    console.log("Oracle Webhook payload:", JSON.stringify(req.body, null, 2));

    // Validação básica do payload
    if (
      !req.body ||
      !req.body.event ||
      !req.body.data ||
      !req.body.data.buyer
    ) {
      return res.status(400).json({
        error: "Payload inválido",
        message: "O webhook requer event e data.buyer",
      });
    }

    if (!verifySignature(req.rawBody, req.body.hottok)) {
      console.warn("Tentativa de acesso com hottok inválido");
      return res.status(403).json({ error: "Invalid hottok" });
    }

    const { event, data } = req.body;
    console.log("Processando evento Oracle:", event);

    switch (event.toUpperCase()) {
      case "PURCHASE_APPROVED": {
        await activateOraclePrime(data.buyer.email);
        break;
      }

      case "REFUND":
      case "PURCHASE_PROTEST":
      case "PURCHASE_CHARGEBACK":
      case "CHARGEBACK": {
        await deactivateOraclePrime(data.buyer.email);
        break;
      }

      default:
        console.log("Evento não processado:", event);
        return res.status(200).json({
          message: "Evento não reconhecido",
          event: event,
        });
    }

    return res.status(200).json({
      message: "Oracle webhook processado com sucesso",
      event: event,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro ao processar oracle webhook:", error);
    return res.status(500).json({
      error: "Erro interno no servidor",
      message: error.message,
    });
  }
};

module.exports = {
  processOracleWebhook,
  // Exportando para testes
  activateOraclePrime,
  deactivateOraclePrime,
};
