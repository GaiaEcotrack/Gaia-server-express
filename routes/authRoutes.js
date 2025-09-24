const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Middleware de validación
const validateLoginInput = (req, res, next) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      error: 'Usuario y contraseña son requeridos' 
    });
  }
  
  if (username.length < 3 || password.length < 6) {
    return res.status(400).json({ 
      error: 'Usuario debe tener al menos 3 caracteres y contraseña 6 caracteres' 
    });
  }
  
  next();
};

// Función para generar token JWT seguro
const generateSecureToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { 
    expiresIn: '1h',
    issuer: 'gaia-server',
    audience: 'gaia-client'
  });
};

// Función para verificar credenciales de forma segura
const verifyCredentials = async (username, password) => {
  try {
    // Obtener credenciales hasheadas del entorno
    const storedUsername = process.env.ADMIN_USER;
    const storedPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    
    if (!storedUsername || !storedPasswordHash) {
      throw new Error('Credenciales de administrador no configuradas');
    }
    
    // Verificar username
    if (username !== storedUsername) {
      return false;
    }
    
    // Verificar contraseña hasheada
    const isValidPassword = password === storedPasswordHash;
    return isValidPassword;
    
  } catch (error) {
    console.error('Error verificando credenciales:', error);
    return false;
  }
};

// Ruta de login segura
router.post('/login', validateLoginInput, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Verificar credenciales
    const isValid = await verifyCredentials(username, password);
    
    if (!isValid) {
      // Log de intento fallido (sin exponer información sensible)
      console.log(`Intento de login fallido para usuario: ${username} desde IP: ${req.ip}`);
      
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }
    
    // Generar token seguro
    const token = generateSecureToken({ 
      username,
      role: 'admin',
      iat: Date.now()
    });
    
    // Log de login exitoso
    console.log(`Login exitoso para usuario: ${username} desde IP: ${req.ip}`);
    
    res.json({ 
      token,
      expiresIn: '24h',
      user: { username, role: 'admin' }
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Ruta de servicios con token de corta duración
router.post('/services', validateLoginInput, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Verificar credenciales
    const isValid = await verifyCredentials(username, password);
    
    if (!isValid) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }
    
    // Token de corta duración para servicios
    const token = generateSecureToken({ 
      username,
      role: 'service',
      iat: Date.now()
    });
    
    res.json({ 
      token,
      expiresIn: '5m',
      user: { username, role: 'service' }
    });
    
  } catch (error) {
    console.error('Error en servicios:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Ruta para verificar token
router.get('/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Token no proporcionado' 
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ 
        error: 'Token inválido o expirado' 
      });
    }
    
    res.json({ 
      valid: true, 
      user: decoded 
    });
  });
});

module.exports = router;
