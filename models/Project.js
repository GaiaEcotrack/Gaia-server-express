const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: false, // Cambiado a false porque se genera automáticamente
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  companyId: {
    type: String,
    required: false,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  gpsCoordinates: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  technologyType: {
    type: String,
    required: true,
    default: 'fotovoltaico'
  },
  capacityInstalled: {
    type: Number,
    required: true,
    min: 0
  },
  capacityUnit: {
    type: String,
    default: 'kWp'
  },
  startDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed', 'suspended'],
    default: 'active'
  },
  goldStandardStatus: {
    type: String,
    enum: ['pending', 'registered', 'verified', 'certified'],
    default: 'pending'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  verificationDate: Date,
  certificationDate: Date,
  totalEnergyGenerated: {
    type: Number,
    default: 0
  },
  totalCO2Avoided: {
    type: Number,
    default: 0
  },
  emissionFactor: {
    type: Number,
    required: true,
    default: 0.4 // kg CO2/kWh para Colombia
  },
  emissionFactorSource: {
    type: String,
    required: true,
    default: 'Colombia - Resolución oficial'
  },
  devices: [{
    serialNumber: String,
    brand: String,
    model: String,
    capacity: Number,
    installationDate: Date
  }],
  documents: [{
    type: String,
    name: String,
    url: String,
    ipfsHash: String,
    uploadedAt: Date
  }],
  metadata: {
    region: String,
    country: {
      type: String,
      default: 'Colombia'
    },
    timezone: String,
    gridType: String
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
projectSchema.index({ userId: 1, status: 1 });
projectSchema.index({ goldStandardStatus: 1, status: 1 });
projectSchema.index({ 'gpsCoordinates.latitude': 1, 'gpsCoordinates.longitude': 1 });

// Método para generar ID único del proyecto
projectSchema.methods.generateProjectId = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `GS-${this.userId.substring(0, 8)}-${timestamp}-${random}`.toUpperCase();
};

// Pre-save middleware para generar projectId si no existe
projectSchema.pre('save', function(next) {
  try {
    if (!this.projectId) {
      this.projectId = this.generateProjectId();
    }
    // Asegurar que siempre tenga un projectId
    if (!this.projectId) {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substr(2, 5);
      this.projectId = `GS-${timestamp}-${random}`.toUpperCase();
    }
    next();
  } catch (error) {
    console.error('Error generando projectId:', error);
    // Generar un ID de emergencia
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.projectId = `GS-EMERGENCY-${timestamp}-${random}`.toUpperCase();
    next();
  }
});

// Validación personalizada para asegurar que projectId existe
projectSchema.pre('validate', function(next) {
  if (!this.projectId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.projectId = `GS-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
