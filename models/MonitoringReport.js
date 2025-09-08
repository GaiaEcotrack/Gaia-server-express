const mongoose = require('mongoose');

const monitoringReportSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  energyGenerated_kWh: {
    type: Number,
    required: true,
    min: 0
  },
  co2Avoided_kg: {
    type: Number,
    required: true,
    min: 0
  },
  emissionFactor: {
    type: Number,
    required: true,
    min: 0
  },
  emissionFactorSource: {
    type: String,
    required: true,
    default: 'Colombia - Resolución oficial'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  verifiedBy: {
    type: String,
    default: null
  },
  certificateHash: {
    type: String,
    default: null,
    unique: true,
    sparse: true
  },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationDate: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  version: {
    type: Number,
    default: 1
  },
  previousVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  metadata: {
    gpsCoordinates: String,
    deviceSerial: String,
    deviceBrand: String,
    technologyType: {
      type: String,
      default: 'fotovoltaico'
    },
    capacityInstalled: Number
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
monitoringReportSchema.index({ projectId: 1, status: 1 });
monitoringReportSchema.index({ userId: 1, createdAt: -1 });
monitoringReportSchema.index({ co2Avoided_kg: 1, status: 1 });

module.exports = mongoose.model('MonitoringReport', monitoringReportSchema);
