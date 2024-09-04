const mongoose = require('mongoose');

// Define el esquema del usuario
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  full_name: {
    type: String,
    default: 'User',
    trim: true,
  },
  company_name: {
    type: String,
    trim: true,
  },
  nit: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  company_phone: {
    type: String,
    trim: true,
  },
  company_email: {
    type: String,
    trim: true,
  },
  website: {
    type: String,
    trim: true,
  },
  legal_representative_name: {
    type: String,
    trim: true,
  },
  legal_representative_id: {
    type: String,
    trim: true,
  },
  legal_representative_email: {
    type: String,
    trim: true,
  },
  legal_representative_phone: {
    type: String,
    trim: true,
  },
});

// Crea el modelo basado en el esquema
const User = mongoose.model('User', userSchema);

module.exports = User;
