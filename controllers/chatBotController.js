exports.processUserMessage = async (req, res) => {
  try {
    const { message } = req.body;

    // Preguntas predeterminadas
    const defaultQuestions = [
      "¿Cómo estás?",
      "¿Qué servicios ofreces?",
      "¿Cómo puedo contactarlos?",
      "Dime más sobre Gaia",
    ];

    if (!message) {
      return res.status(200).json({ 
        response: "Hazme una pregunta para ayudarte.",
        defaultQuestions 
      });
    }

    let botResponse;

    switch (true) {
      case /hola/i.test(message):
        botResponse = "¡Hola! ¿En qué puedo ayudarte hoy?";
        break;
      case /cómo estás/i.test(message):
        botResponse = "¡Estoy genial! Gracias por preguntar. 😊";
        break;
      case /qué servicios ofreces/i.test(message):
        botResponse = "Ofrecemos soluciones tecnológicas personalizadas para tus necesidades.";
        break;
      case /cómo puedo contactarlos/i.test(message):
        botResponse = "Puedes contactarnos a través de nuestro correo: contacto@gaia.com.";
        break;
      case /gaia/i.test(message):
        botResponse = "Gaia es una empresa innovadora enfocada en soluciones tecnológicas sostenibles.";
        break;
      default:
        botResponse = "Lo siento, no entiendo tu mensaje. ¿Puedes reformularlo?";
    }

    return res.status(200).json({ 
      response: botResponse,
      defaultQuestions 
    });
  } catch (error) {
    console.error("Error en processUserMessage:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

