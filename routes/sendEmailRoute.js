const express = require('express');
const {sendEmail,upload}= require('../controllers/sendEmailController');



const router = express.Router();

// Definir la ruta para subir los archivos y enviar el correo
router.post('/send-email', upload.any(), sendEmail);
module.exports = router;
