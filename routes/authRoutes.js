const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const router = express.Router();

// Middleware de validación
const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Email y contraseña son requeridos' 
    });
  }
  
  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      error: 'Formato de email inválido' 
    });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ 
      error: 'La contraseña debe tener al menos 6 caracteres' 
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
const verifyCredentials = async (email, password) => {
  try {
    // Buscar usuario por email en la base de datos
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return null; // Usuario no encontrado
    }
    
    // Verificar contraseña usando bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return null; // Contraseña incorrecta
    }
    
    // Retornar el usuario si las credenciales son válidas
    return user;
    
  } catch (error) {
    console.error('Error verificando credenciales:', error);
    return null;
  }
};

// Ruta de login segura
router.post('/login', validateLoginInput, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Verificar credenciales
    const user = await verifyCredentials(email, password);
    
    if (!user) {
      // Log de intento fallido (sin exponer información sensible)
      console.log(`Intento de login fallido para email: ${email} desde IP: ${req.ip}`);
      
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }
    
    // Generar token seguro con información del usuario
    const token = generateSecureToken({ 
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
      iat: Date.now()
    });
    
    // Log de login exitoso
    console.log(`Login exitoso para usuario: ${user.email} (${user.role}) desde IP: ${req.ip}`);
    
    // Preparar datos del usuario para la respuesta (sin información sensible)
    const userData = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      verified_email: user.verified_email,
      verified_sms: user.verified_sms,
      verified_2fa: user.verified_2fa,
      membresia: user.membresia
    };
    
    res.json({ 
      token,
      expiresIn: '24h',
      user: userData
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
    const { email, password } = req.body;
    
    // Verificar credenciales
    const user = await verifyCredentials(email, password);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }
    
    // Token de corta duración para servicios
    const token = generateSecureToken({ 
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
      iat: Date.now()
    });
    
    res.json({ 
      token,
      expiresIn: '5m',
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role
      }
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
