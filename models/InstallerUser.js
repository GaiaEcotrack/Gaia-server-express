const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true
  },
  taxId: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  contactPhone: {
    type: String,
    required: true
  },
  companyEmail: {
    type: String,
    required: true
  },
  website: {
    type: String
  },
  legalRepresentative: {
    type: String,
    required: true
  },
  legalRepId: {
    type: String,
    required: true
  },
  legalRepEmail: {
    type: String,
    required: true
  },
  legalRepPhone: {
    type: String,
    required: true
  },
  associatedPartner: {
    type: String
  },
  // Nuevos campos
  kwGenerated: {
    type: Number,
    default: 0 // Valor inicial para usuarios existentes
  },
  Earnings: {
    type: Number,
    default: 0 // Valor inicial para usuarios existentes
  },
  tokens_distributed: {
    type: Number,
    default: 0 // Valor inicial para usuarios existentes
  }
}, {
  timestamps: true
});

const installer = mongoose.model('Installer', userSchema);

module.exports = installer;
