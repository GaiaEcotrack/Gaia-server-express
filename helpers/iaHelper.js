const OpenAI = require("openai");
const {
  executeCommand,
  executeQueryForAll,
} = require("../controllers/sailsController");

const apiKey = process.env.GEMINI_API_KEY;

const isValidWallet = (wallet) => {
  const isHex64 = /^0x[a-fA-F0-9]{64}$/.test(wallet); // Ethereum long hash
  const isSS58 = /^[1-9A-HJ-NP-Za-km-z]{47,49}$/.test(wallet); // Polkadot SS58 address
  return isHex64 || isSS58;
};

const actions = {
getBalanceEnergy: async (wallet) => {
  if (!isValidWallet(wallet)) {
    return { error: "Dirección de wallet inválida." };
  }

  const balanceEnergy = await executeQueryForAll(
    "GaiaService",
    "TotalTokensEnergy",
    [wallet]
  );

  const result = {
    energyBalance: balanceEnergy,
    summary: `Tienes ${balanceEnergy} tokens Gaia Energy en tu wallet.`
  };

  return { success: true, result };
},

  getBalanceCompany: async (wallet) => {
    if (!isValidWallet(wallet))
      return { error: "Dirección de wallet inválida." };
    const balanceCompany = await executeQueryForAll(
      "GaiaService",
      "TotalTokensCompany",
      [wallet]
    );

      const result = {
    companyBalance: balanceCompany,
    summary: `Tienes ${balanceCompany} tokens Gaia en tu wallet.`
  };


  return { success: true, result };
  },

  swapTokens: async (wallet, amount) => {
    if (!isValidWallet(wallet))
      return { error: "Dirección de wallet inválida." };

    const response = await executeCommand(
      "GaiaService",
      "SwapGaiaEnergyToGaia",
      [wallet, amount]
    );

    // Reestructurar para que sea fácil de entender para la IA
    const tokens = response?.tokensSwapSuccessfullyEnergy;

    if (!tokens) {
      return {
        error: "No se pudo realizar el swap. Intenta de nuevo más tarde.",
      };
    }

    const result = {
      swappedAmount: amount,
      newCompanyBalance: tokens.total_company_tokens,
      summary: `Se hizo swap de ${amount} tokens de energía. Ahora tienes ${tokens.total_company_tokens} tokens de compañía.`,
    };

    return { success: true, result };
  },

  transferTokens: async (user, to, amount) => {
    if (!isValidWallet(user) || !isValidWallet(to))
      return { error: "Dirección de wallet inválida." };
    
    return { success: true, transferredAmount: amount };
  },

  // Agrega las demás acciones aquí si es necesario
};

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

const processAIResponse = async (userQuestion, data) => {
  const prompt = `
Eres un asistente de Gaia Ecotrack. Solo puedes responder preguntas relacionadas con Gaia Ecotrack, sus funcionalidades o el sistema de tokens.

Estos son los datos del usuario:
${JSON.stringify(data)}

La pregunta del usuario es:
"${userQuestion}"

Si el usuario saluda (ej. "Hola", "¿cómo estás?", "buenos días"), puedes responder brevemente con amabilidad.
También te pueden hacer preguntas en inglés; puedes responder en inglés o español.

❌ Si la pregunta no tiene relación con Gaia Ecotrack, responde claramente:
"No puedo responder preguntas que no estén relacionadas con Gaia Ecotrack o Vara Network."

✅ Si el usuario hace una solicitud que corresponde a una función (como hacer swap, transferir tokens, consultar balance, etc.), responde en uno de estos dos formatos:

Funciones disponibles:
1. getBalanceEnergy(wallet)// Consulta el balance de tokens de energía o Gaia Energy
2. getBalanceCompany(wallet) // Consulta el balance de tokens de compañía o cuando solo te piden el balance en Gaia
3. swapTokens(wallet, amount)
4. transferTokens(user, to, amount)
5. stakeTokens(user, amount)
6. getUserStats(user)

1. Si tienes suficiente información:
{
  "action": "nombreDeLaAccion",
  "args": [arg1, arg2, ...]
}

2. Si falta información:
Haz una sola pregunta clara como:
- "¿Cuántos tokens deseas transferir?"
- "¿A qué dirección deseas enviarlos?"
- "¿Cuál es tu dirección de wallet?"

❗No incluyas texto adicional fuera del JSON o de la pregunta. No uses markdown ni formato json.
  `;

  const response = await openai.chat.completions.create({
    model: "gemini-2.0-flash",
    messages: [
      {
        role: "system",
        content: `Eres un asistente que puede ejecutar múltiples acciones y tienes estos datos ${JSON.stringify(
          data
        )}`,
      },
      { role: "user", content: prompt },
    ],
  });

  return response.choices[0].message.content;
};

const executeAction = async (response) => {
  try {
    if (response.includes("¿")) return { question: response };

    if (!response.trim().startsWith("{")) return { message: response.trim() };

    if (response.includes("No puedo responder preguntas"))
      return { message: response };

    const cleaned = response.replace(/```json|```/g, "").trim();
    const parsedResponse = JSON.parse(cleaned);
    const { action, args } = parsedResponse;

    if (actions[action]) {
      const result = await actions[action](...args);

      const summary = await openai.chat.completions.create({
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "system",
            content:
              "Eres un asistente que da respuestas breves y claras sobre acciones completadas.",
          },
          {
            role: "user",
            content: `La acción "${action}" se ejecutó con este resultado: ${JSON.stringify(
              result
            )}. Resume este resultado como si respondieras al usuario en un chatbot.`,
          },
        ],
      });

      const message = summary.choices[0].message.content;
      return { result, message };
    }

    return { error: "Acción no reconocida" };
  } catch (error) {
    console.error("Error al ejecutar acción:", error);
    return { error: "Error al procesar la acción" };
  }
};

module.exports = { processAIResponse, executeAction };
