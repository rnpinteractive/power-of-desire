const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

const HOTMART_WEBHOOK_SECRET = "jxw4V0smfdPwstXOrdNxkzAkwcyhOA2167811";

const verifySignature = (rawBody, hottok) => {
  return true; // Para testes
};

// Função auxiliar para mover usuário
const moveUserDirectory = async (originalEmail, prefix) => {
  const newEmail = `${prefix}-${originalEmail}`;
  const originalDir = path.join(
    __dirname,
    "..",
    "data",
    "users",
    originalEmail
  );
  const newDir = path.join(__dirname, "..", "data", "users", newEmail);

  try {
    // 1. Lê o profile.json atual
    const profilePath = path.join(originalDir, "profile.json");
    const userData = JSON.parse(await fs.readFile(profilePath, "utf8"));

    // 2. Atualiza o email no profile
    userData.email = newEmail;

    // 3. Move a pasta inteira para o novo nome
    await fs.rename(originalDir, newDir);

    // 4. Atualiza o profile.json com o novo email
    await fs.writeFile(
      path.join(newDir, "profile.json"),
      JSON.stringify(userData, null, 2)
    );

    console.log(`Usuário movido para ${prefix}:`, newEmail);
    return true;
  } catch (error) {
    console.error(`Erro ao mover usuário para ${prefix}:`, error);
    return false;
  }
};

const processWebhook = async (req, res) => {
  try {
    console.log("Webhook recebido:", JSON.stringify(req.body, null, 2));

    if (!verifySignature(req.rawBody, req.body.hottok)) {
      return res.status(403).json({ error: "Invalid hottok" });
    }

    const { event, data } = req.body;

    switch (event.toUpperCase()) {
      case "PURCHASE_APPROVED": {
        const buyer = data.buyer;
        const userData = {
          email: buyer.email,
          nome: buyer.name,
          telefone: buyer.checkout_phone || "",
          createdAt: new Date().toISOString(),
          onboardingCompleted: false,
        };

        const userDir = path.join(
          __dirname,
          "..",
          "data",
          "users",
          buyer.email
        );
        await fs.mkdir(userDir, { recursive: true });
        await fs.mkdir(path.join(userDir, "plans"), { recursive: true });

        const profilePath = path.join(userDir, "profile.json");
        await fs.writeFile(profilePath, JSON.stringify(userData, null, 2));
        break;
      }

      case "REFUND":
      case "PURCHASE_PROTEST": // Adicionado tratamento para protest
      case "CHARGEBACK": {
        const originalEmail = data.buyer.email;

        // Define o prefixo baseado no evento
        let prefix = "refund";
        if (event.toUpperCase() === "CHARGEBACK") prefix = "chargeback";
        if (event.toUpperCase() === "PURCHASE_PROTEST") prefix = "refund"; // Protest trata como refund

        const success = await moveUserDirectory(originalEmail, prefix);
        if (!success) {
          throw new Error(`Falha ao processar ${event} para ${originalEmail}`);
        }
        break;
      }

      default:
        console.log("Evento não reconhecido:", event);
        return res.status(200).json({ message: "Evento não processado" });
    }

    return res.status(200).json({ message: "Webhook processado com sucesso" });
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};

module.exports = { processWebhook };
