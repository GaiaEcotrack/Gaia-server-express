const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'project_created',
      'project_updated',
      'project_deleted',
      'report_generated',
      'report_submitted',
      'report_verified',
      'report_rejected',
      'carbon_credit_tokenized',
      'carbon_credit_transferred',
      'emission_factor_updated',
      'device_added',
      'device_removed',
      'user_registered',
      'user_verified',
      'admin_action'
    ]
  },
  entityType: {
    type: String,
    required: true,
    enum: ['project', 'report', 'carbon_credit', 'device', 'user', 'system']
  },
  entityId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userType: {
    type: String,
    enum: ['user', 'admin', 'verifier', 'system'],
    default: 'user'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  ipAddress: String,
  userAgent: String,
  blockchainTxHash: String,
  blockchainBlockNumber: Number,
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success'
  },
  errorMessage: String,
  metadata: {
    browser: String,
    os: String,
    device: String,
    location: String
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

// Método estático para crear logs de auditoría
auditLogSchema.statics.logAction = function(data) {
  return this.create({
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    userId: data.userId,
    userType: data.userType || 'user',
    details: data.details,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    blockchainTxHash: data.blockchainTxHash,
    blockchainBlockNumber: data.blockchainBlockNumber,
    status: data.status || 'success',
    errorMessage: data.errorMessage,
    metadata: data.metadata
  });
};

// Método para obtener logs por entidad
auditLogSchema.statics.getEntityLogs = function(entityType, entityId, limit = 100) {
  return this.find({
    entityType,
    entityId
  })
  .sort({ timestamp: -1 })
  .limit(limit)
  .select('-__v');
};

// Método para obtener logs por usuario
auditLogSchema.statics.getUserLogs = function(userId, limit = 100) {
  return this.find({ userId })
  .sort({ timestamp: -1 })
  .limit(limit)
  .select('-__v');
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
