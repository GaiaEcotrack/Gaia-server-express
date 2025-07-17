const { processAIResponse,executeAction} = require("../helpers/iaHelper");


exports.processUserMessage = async (req, res) => {
  try {
    const { message, data } = req.body; // Asegúrate de que el cuerpo de la solicitud contenga 'userQuestion' y 'data'
    const aiResponse = await processAIResponse(message, data);
    console.log(message);
    

    const actionResult = await executeAction(aiResponse);

    if (actionResult.question) {
      return res.status(200).send({ message: actionResult.question });
    }
    
    if (actionResult.message) {
      return res.status(200).send({ message: actionResult.message });
    }
    // Si la IA ejecutó una acción, devolver el resultado
    return res.status(200).send(actionResult);
  } catch (error) {
    console.error("Error en processUserMessage:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

