const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

// Token Hotmart direto no código
const HOTMART_WEBHOOK_SECRET = "jxw4V0smfdPwstXOrdNxkzAkwcyhOA2167811";

const verifySignature = (rawBody, signature) => {
  if (!signature) return false;

  const computedSignature = crypto
    .createHmac("sha256", HOTMART_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return computedSignature === signature;
};

const processWebhook = async (req, res) => {
  try {
    if (!verifySignature(req.rawBody, req.headers["x-hotmart-signature"])) {
      return res.status(403).send("Forbidden: Assinatura inválida.");
    }

    const { event, data } = req.body;

    switch (event.toUpperCase()) {
      case "PURCHASE": {
        const buyer = data.buyer;
        const userData = {
          email: buyer.email,
          nome: buyer.name,
          telefone: buyer.phone || "",
          createdAt: new Date().toISOString(),
          onboardingCompleted: false,
        };

        const userPath = path.join(
          __dirname,
          "..",
          "data",
          "users",
          `${buyer.email}.json`
        );
        await fs.writeFile(userPath, JSON.stringify(userData, null, 2));
        break;
      }

      case "REFUND": {
        const userEmail = data.buyer.email;
        const userPath = path.join(
          __dirname,
          "..",
          "data",
          "users",
          `${userEmail}.json`
        );
        const newEmail = `refund-${userEmail}`;

        const userData = JSON.parse(await fs.readFile(userPath, "utf8"));
        userData.email = newEmail;

        await fs.writeFile(
          path.join(__dirname, "..", "data", "users", `${newEmail}.json`),
          JSON.stringify(userData, null, 2)
        );
        await fs.unlink(userPath);
        break;
      }

      case "CHARGEBACK": {
        const userEmail = data.buyer.email;
        const userPath = path.join(
          __dirname,
          "..",
          "data",
          "users",
          `${userEmail}.json`
        );
        const newEmail = `chargeback-${userEmail}`;

        const userData = JSON.parse(await fs.readFile(userPath, "utf8"));
        userData.email = newEmail;

        await fs.writeFile(
          path.join(__dirname, "..", "data", "users", `${newEmail}.json`),
          JSON.stringify(userData, null, 2)
        );
        await fs.unlink(userPath);
        break;
      }

      default:
        return res.status(400).json({ error: "Tipo de evento não suportado." });
    }

    return res.status(200).json({ message: "Webhook processado com sucesso." });
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
};

module.exports = { processWebhook };
