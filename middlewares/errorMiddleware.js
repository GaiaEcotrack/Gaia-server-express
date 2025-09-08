const errorHandler = (err, req, res, next) => {
  // Log del error para debugging (sin exponer información sensible al cliente)
  console.error('Error en servidor:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Determinar el tipo de error y responder apropiadamente
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      details: err.details || 'Datos de entrada inválidos'
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'ID inválido',
      details: 'El formato del ID proporcionado no es válido'
    });
  }

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Archivo demasiado grande',
        details: 'El archivo excede el tamaño máximo permitido'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Demasiados archivos',
        details: 'Se excedió el número máximo de archivos permitidos'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Campo de archivo inesperado',
        details: 'El nombre del campo de archivo no es válido'
      });
    }
    return res.status(400).json({
      error: 'Error al procesar archivo',
      details: 'Hubo un problema al procesar el archivo subido'
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      details: 'El token de autenticación no es válido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
      details: 'El token de autenticación ha expirado'
    });
  }

  if (err.code === 'ENOENT') {
    return res.status(404).json({
      error: 'Recurso no encontrado',
      details: 'El archivo o recurso solicitado no existe'
    });
  }

  if (err.code === 'EACCES') {
    return res.status(403).json({
      error: 'Acceso denegado',
      details: 'No tienes permisos para acceder a este recurso'
    });
  }

  // Error de MongoDB
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Conflicto de datos',
      details: 'Ya existe un registro con los datos proporcionados'
    });
  }

  // Error de conexión a base de datos
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    return res.status(503).json({
      error: 'Servicio no disponible',
      details: 'Error de conexión con la base de datos'
    });
  }

  // Error de validación de MongoDB
  if (err.name === 'MongoError' && err.code === 121) {
    return res.status(400).json({
      error: 'Error de validación',
      details: 'Los datos proporcionados no cumplen con las reglas de validación'
    });
  }

  // Error de CORS
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      error: 'Acceso denegado',
      details: 'El origen de la petición no está permitido'
    });
  }

  // Error de rate limiting
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Demasiadas peticiones',
      details: 'Has excedido el límite de peticiones. Intenta de nuevo más tarde.'
    });
  }

  // Error genérico (no exponer detalles internos en producción)
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: 'Error interno del servidor',
    details: isDevelopment ? err.message : 'Ha ocurrido un error inesperado',
    ...(isDevelopment && { stack: err.stack })
  });
};

// Middleware para manejar rutas no encontradas
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    details: `La ruta ${req.method} ${req.url} no existe`,
    timestamp: new Date().toISOString()
  });
};

// Middleware para manejar errores de parsing JSON
const jsonErrorHandler = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'JSON inválido',
      details: 'El cuerpo de la petición no contiene JSON válido'
    });
  }
  next(err);
};

// Middleware para validar contenido de requests
const validateContentType = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        error: 'Tipo de contenido no soportado',
        details: 'Se requiere application/json para esta operación'
      });
    }
  }
  next();
};

module.exports = {
  errorHandler,
  notFoundHandler,
  jsonErrorHandler,
  validateContentType
};
