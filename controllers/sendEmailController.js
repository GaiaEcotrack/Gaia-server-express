const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Configuración de seguridad para archivos
const ALLOWED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

// Verificar si la carpeta 'uploads' existe, si no, crearla
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Función para generar nombre de archivo seguro
const generateSecureFilename = (originalname) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalname).toLowerCase();
  return `${timestamp}-${randomString}${extension}`;
};

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  // Verificar tipo de archivo
  if (!ALLOWED_FILE_TYPES[file.mimetype]) {
    return cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
  }

  // Verificar extensión
  const extension = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = Object.values(ALLOWED_FILE_TYPES);
  if (!allowedExtensions.includes(extension)) {
    return cb(new Error(`Extensión de archivo no permitida: ${extension}`), false);
  }

  // Verificar tamaño
  if (file.size > MAX_FILE_SIZE) {
    return cb(new Error(`Archivo demasiado grande. Máximo: ${MAX_FILE_SIZE / (1024 * 1024)}MB`), false);
  }

  // Sanitizar nombre original
  const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
  file.sanitizedName = sanitizedName;

  cb(null, true);
};

// Configurar el almacenamiento de Multer con validaciones
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const secureFilename = generateSecureFilename(file.originalname);
    cb(null, secureFilename);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES
  }
});

// Middleware de validación de archivos
const validateFiles = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ 
      error: 'No se han subido archivos' 
    });
  }

  if (req.files.length > MAX_FILES) {
    return res.status(400).json({ 
      error: `Máximo ${MAX_FILES} archivos permitidos` 
    });
  }

  // Verificar que todos los archivos sean válidos
  for (const file of req.files) {
    if (!ALLOWED_FILE_TYPES[file.mimetype]) {
      return res.status(400).json({ 
        error: `Tipo de archivo no permitido: ${file.mimetype}` 
      });
    }
  }

  next();
};

const email = process.env.EMAIL_ADMIN;
const appCode = process.env.EMAIL_APP;

// Validar configuración de email
if (!email || !appCode) {
  console.error('ERROR: Variables de entorno EMAIL_ADMIN o EMAIL_APP no configuradas');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: "mail.gaiaecotrack.com",
  port: 465,
  secure: true,
  auth: {
    user: email,
    pass: appCode,
  },
});

// Función para enviar el correo
const sendEmail = async (req, res) => {
  try {
    const { subject, text } = req.body;
    const files = req.files;

    // Validar campos requeridos
    if (!subject || !text) {
      return res.status(400).json({ 
        error: 'Asunto y cuerpo del mensaje son requeridos' 
      });
    }

    // Sanitizar entrada
    const sanitizedSubject = subject.trim().substring(0, 200);
    const sanitizedText = text.trim().substring(0, 5000);

    // Crear los adjuntos para el correo
    const attachments = files.map(file => ({
      filename: file.sanitizedName || file.originalname,
      path: file.path
    }));

    // Configurar el contenido del correo
    const mailOptions = {
      from: 'kyc@gaiaecotrack.com',
      to: 'infogaia@gaiaecotrack.com',
      subject: sanitizedSubject,
      text: sanitizedText,
      attachments: attachments
    };

    // Enviar el correo
    const info = await transporter.sendMail(mailOptions);

    // Log de auditoría
    console.log(`Email enviado exitosamente desde ${req.ip} con ${files.length} archivos`);

    // Eliminar los archivos después de enviarlos
    await Promise.all(files.map(async file => {
      try {
        await fsp.unlink(file.path);
        console.log(`Archivo eliminado: ${file.path}`);
      } catch (error) {
        console.error(`Error al eliminar el archivo ${file.path}:`, error);
      }
    }));

    res.status(200).json({ 
      message: 'Correo enviado y archivos eliminados correctamente', 
      info: {
        messageId: info.messageId,
        filesProcessed: files.length
      }
    });

  } catch (error) {
    console.error('Error al enviar el correo:', error);
    
    // Limpiar archivos en caso de error
    if (req.files) {
      await Promise.all(req.files.map(async file => {
        try {
          await fsp.unlink(file.path);
        } catch (cleanupError) {
          console.error(`Error limpiando archivo ${file.path}:`, cleanupError);
        }
      }));
    }

    res.status(500).json({ 
      error: 'Error al enviar el correo' 
    });
  }
};

module.exports = { sendEmail, upload, validateFiles };
