const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');

// Configurar el almacenamiento de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Carpeta temporal donde se guardan los archivos
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Nombre único para evitar conflictos
  }
});
const upload = multer({ storage: storage });

const email = process.env.EMAIL_ADMIN;
const appCode = process.env.EMAIL_APP;

const transporter = nodemailer.createTransport({
  service: 'gmail',  // Usamos Gmail como ejemplo
  auth: {
    user: email,  // Tu correo electrónico
    pass: appCode  // app password
  }
});

// Función para enviar el correo
const sendEmail = async (req, res) => {
  const files = req.files;  // Archivos subidos por el formulario

  if (!files || files.length === 0) {
    return res.status(400).json({ message: 'No se han subido archivos' });
  }

  // Crear los adjuntos para el correo
  const attachments = files.map(file => ({
    filename: file.originalname,
    path: file.path
  }));

  // Configurar el contenido del correo
  const mailOptions = {
    from: 'gaiaecotrackkyc@gmail.com',
    to: 'nicovillagra123@gmail.com',  // Correo del destinatario
    subject: 'Nuevo KYC',
    text: 'Aquí están los archivos que solicitaste.',
    attachments: attachments
  };

  try {
    // Enviar el correo
    const info = await transporter.sendMail(mailOptions);

    // Eliminar los archivos después de enviarlos
    files.forEach(file => fs.unlinkSync(file.path));

    res.status(200).json({ message: 'Correo enviado correctamente', info });
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    res.status(500).json({ message: 'Error al enviar el correo', error });
  }
};

module.exports = { sendEmail, upload };
