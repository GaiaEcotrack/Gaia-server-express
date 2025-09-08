#!/usr/bin/env node

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔒 CONFIGURADOR DE SEGURIDAD PARA GAIA SERVER');
console.log('==============================================\n');

// Función para generar contraseña segura
const generateSecurePassword = (length = 32) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Función para generar JWT secret seguro
const generateJWTSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Función para generar contraseña hasheada
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Función para crear archivo .env de ejemplo
const createEnvExample = () => {
  const envExample = `# Configuración de Seguridad - GAIA SERVER
# ===============================================

# Base de Datos
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/gaia?retryWrites=true&w=majority

# Autenticación JWT
JWT_SECRET=${generateJWTSecret()}

# Credenciales de Administrador (CAMBIAR ESTAS CREDENCIALES)
ADMIN_USER=admin
ADMIN_PASSWORD_HASH=REEMPLAZAR_CON_HASH_GENERADO

# CORS - Orígenes permitidos (separados por coma)
ALLOWED_ORIGINS=http://localhost:3000,https://gaiaecotrack.com,https://www.gaiaecotrack.com

# Gear Network
GEAR_PASSWORD=REEMPLAZAR_CON_CONTRASEÑA_GEAR
GEAR_MNEMONIC=REEMPLAZAR_CON_MNEMONIC_GEAR

# Email
EMAIL_ADMIN=admin@gaiaecotrack.com
EMAIL_APP=REEMPLAZAR_CON_CONTRASEÑA_EMAIL

# IPFS
PINATA_JWT=REEMPLAZAR_CON_JWT_PINATA
PINATA_GATEWAY=gateway.pinata.cloud

# OpenAI
GEMINI_API_KEY=REEMPLAZAR_CON_API_KEY_GEMINI

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=REEMPLAZAR_CON_ACCESS_TOKEN

# Vara Network
VARA_NETWORK=wss://testnet.vara.network
GAIA_CONTRACT_ID=REEMPLAZAR_CON_CONTRACT_ID

# Web3 Storage
WEB3_STORAGE_TOKEN=REEMPLAZAR_CON_TOKEN_WEB3

# Redis (opcional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=REEMPLAZAR_CON_CONTRASEÑA_REDIS
REDIS_DB=0

# Entorno
NODE_ENV=production

# Puertos
PORT=8080
METRICS_PORT=9090

# Logging
AUDIT_LOG_LEVEL=info
EMAIL_NOTIFICATIONS=true
PUSH_NOTIFICATIONS=false
CACHE_ENABLED=true
MONITORING_ENABLED=true
METRICS_ENABLED=true

# Límites de seguridad
MAX_FILE_SIZE=10485760
MAX_FILES=5
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5
`;

  const envPath = path.join(process.cwd(), '.env.example');
  fs.writeFileSync(envPath, envExample);
  console.log('✅ Archivo .env.example creado');
  return envExample;
};

// Función principal
const main = async () => {
  try {
    console.log('1. Generando contraseña segura para administrador...');
    const adminPassword = generateSecurePassword(16);
    const hashedPassword = await hashPassword(adminPassword);
    
    console.log('2. Generando JWT secret...');
    const jwtSecret = generateJWTSecret();
    
    console.log('3. Generando contraseña para Gear Network...');
    const gearPassword = generateSecurePassword(32);
    
    console.log('4. Generando mnemonic para Gear Network...');
    const gearMnemonic = crypto.randomBytes(32).toString('hex');
    
    console.log('5. Creando archivo .env.example...');
    const envContent = createEnvExample();
    
    console.log('\n🔐 CREDENCIALES GENERADAS:');
    console.log('============================');
    console.log(`Admin Password: ${adminPassword}`);
    console.log(`Admin Password Hash: ${hashedPassword}`);
    console.log(`JWT Secret: ${jwtSecret}`);
    console.log(`Gear Password: ${gearPassword}`);
    console.log(`Gear Mnemonic: ${gearMnemonic}`);
    
    console.log('\n📝 INSTRUCCIONES:');
    console.log('==================');
    console.log('1. Copia el archivo .env.example a .env');
    console.log('2. Reemplaza las credenciales generadas en tu archivo .env');
    console.log('3. NUNCA compartas o subas el archivo .env a Git');
    console.log('4. Cambia las contraseñas por defecto en producción');
    console.log('5. Configura los orígenes CORS permitidos');
    console.log('6. Configura las API keys de servicios externos');
    
    console.log('\n⚠️  ADVERTENCIAS DE SEGURIDAD:');
    console.log('================================');
    console.log('• Cambia TODAS las contraseñas por defecto');
    console.log('• Usa HTTPS en producción');
    console.log('• Configura firewall y acceso restringido');
    console.log('• Monitorea logs de acceso');
    console.log('• Haz backup regular de la base de datos');
    console.log('• Mantén todas las dependencias actualizadas');
    
    console.log('\n✅ Configuración de seguridad completada!');
    
  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message);
    process.exit(1);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = {
  generateSecurePassword,
  generateJWTSecret,
  hashPassword,
  createEnvExample
};
