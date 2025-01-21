const express = require("express");
const { processUserMessage } = require("../controllers/chatBotController");

const router = express.Router();

// Ruta POST para el chatbot
router.post("/", processUserMessage);

module.exports = router;
