const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');  // Importar el fs sin promesas para usar existsSync
const fsp = require('fs').promises;  // Usar fs.promises para las operaciones asíncronas
const path = require('path');

// Verificar si la carpeta 'uploads' existe, si no, crearla
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {  // fs.existsSync es parte del fs sincrónico
  fs.mkdirSync(uploadsDir);
}

// Configurar el almacenamiento de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir); // Ruta absoluta a la carpeta 'uploads'
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Nombre único para evitar conflictos
  }
});
const upload = multer({ storage: storage });

const email = process.env.EMAIL_ADMIN;
const appCode = process.env.EMAIL_APP;

const transporter = nodemailer.createTransport({
  host: "mail.gaiaecotrack.com",
  port: 465,
  secure: true, // upgrade later with STARTTLS
  auth: {
    user: email,
    pass: appCode,
  },
});

// Función para enviar el correo
const sendEmail = async (req, res) => {
  const { subject, text } = req.body; // Extraer asunto y cuerpo del correo desde el req.body
  const files = req.files;  // Archivos subidos por el formulario

  if (!subject || !text) {
    return res.status(400).json({ message: 'Asunto y cuerpo del mensaje son requeridos' });
  }

  if (!files || files.length === 0) {
    return res.status(400).json({ message: 'No se han subido archivos' });
  }

  // Crear los adjuntos para el correo
  const attachments = files.map(file => ({
    filename: file.originalname,
    path: file.path  // Esta ruta debe ser la correcta
  }));

  // Configurar el contenido del correo
  const mailOptions = {
    from: 'kyc@gaiaecotrack.com',
    to: 'infogaia@gaiaecotrack.com',  // Correo del destinatario
    subject: subject,  // Asunto del correo
    text: text,        // Cuerpo del correo
    attachments: attachments
  };

  try {
    // Enviar el correo
    const info = await transporter.sendMail(mailOptions);

    // Eliminar los archivos después de enviarlos de forma asíncrona
    await Promise.all(files.map(async file => {
      const filePath = path.resolve(__dirname, file.path);
      try {
        await fsp.unlink(filePath);  // Usar fs.promises para eliminar el archivo
        console.log(`Archivo eliminado: ${filePath}`);
      } catch (error) {
        console.error(`Error al eliminar el archivo ${filePath}:`, error);
      }
    }));

    res.status(200).json({ message: 'Correo enviado y archivos eliminados correctamente', info });
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    res.status(500).json({ message: 'Error al enviar el correo', error });
  }
};

module.exports = { sendEmail, upload };
