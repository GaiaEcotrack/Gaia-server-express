module.exports = {
  // Configuración de Gold Standard
  goldStandard: {
    minCO2Threshold: 1000, // kg CO2 mínimo para generar reporte
    maxReportPeriod: 365, // días máximo para un reporte
    emissionFactors: {
      colombia: 0.4, // kg CO2/kWh
      mexico: 0.45,
      chile: 0.35,
      argentina: 0.5,
      peru: 0.38,
      ecuador: 0.42,
      default: 0.4
    },
    emissionFactorSources: {
      colombia: 'Resolución CREG 123 de 2024',
      mexico: 'SENER - Factor de Emisión 2024',
      chile: 'CNE - Factor de Emisión 2024',
      argentina: 'ENRE - Factor de Emisión 2024',
      peru: 'OSINERGMIN - Factor de Emisión 2024',
      ecuador: 'ARCERNNR - Factor de Emisión 2024'
    }
  },

  // Configuración de validación
  validation: {
    minProjectScore: 80, // Score mínimo para proyecto válido
    minReportScore: 80, // Score mínimo para reporte válido
    maxEnergyPerHour: 10000, // kWh máximo por hora
    maxEnergyPerDay: 240000, // kWh máximo por día
    maxEnergyPerMonth: 7200000 // kWh máximo por mes
  },

  // Configuración de blockchain
  blockchain: {
    network: process.env.VARA_NETWORK || 'wss://testnet.vara.network',
    contractId: process.env.GAIA_CONTRACT_ID || '0xc403513f83a6d232d8508358b3c4c9f5f03f7cd7241e69ffb657b13bc024b8e6',
    gasLimit: 1000000000,
    maxRetries: 3,
    retryDelay: 1000 // ms
  },

  // Configuración de IPFS
  ipfs: {
    provider: process.env.IPFS_PROVIDER || 'web3.storage',
    web3StorageToken: process.env.WEB3_STORAGE_TOKEN,
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataSecretKey: process.env.PINATA_SECRET_KEY,
    maxFileSize: 100 * 1024 * 1024, // 100 MB
    supportedFormats: ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt', 'json', 'xml', 'csv']
  },

  // Configuración de PDF
  pdf: {
    defaultFont: 'Helvetica',
    fontSize: {
      title: 24,
      subtitle: 16,
      section: 14,
      body: 10,
      small: 8
    },
    margins: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50
    },
    qrCode: {
      width: 100,
      margin: 2
    }
  },

  // Configuración de auditoría
  audit: {
    enabled: true,
    logLevel: process.env.AUDIT_LOG_LEVEL || 'info',
    retentionDays: 365, // días de retención de logs
    sensitiveFields: ['password', 'token', 'secret', 'key']
  },

  // Configuración de límites del sistema
  limits: {
    maxProjectsPerUser: 10,
    maxReportsPerProject: 100,
    maxDevicesPerProject: 50,
    maxDocumentsPerProject: 20,
    maxFileSizePerDocument: 10 * 1024 * 1024 // 10 MB
  },

  // Configuración de notificaciones
  notifications: {
    email: {
      enabled: process.env.EMAIL_NOTIFICATIONS === 'true',
      provider: process.env.EMAIL_PROVIDER || 'nodemailer',
      templates: {
        reportGenerated: 'report-generated',
        reportVerified: 'report-verified',
        reportRejected: 'report-rejected',
        carbonCreditTokenized: 'carbon-credit-tokenized'
      }
    },
    push: {
      enabled: process.env.PUSH_NOTIFICATIONS === 'true',
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
      vapidPrivateKey: process.env.VAPID_PRIVATE_KEY
    }
  },

  // Configuración de caché
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    ttl: 300, // segundos
    maxKeys: 1000,
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0
    }
  },

  // Configuración de monitoreo
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    metrics: {
      enabled: process.env.METRICS_ENABLED === 'true',
      port: process.env.METRICS_PORT || 9090
    },
    healthCheck: {
      enabled: true,
      interval: 30000, // ms
      timeout: 5000 // ms
    }
  }
};
