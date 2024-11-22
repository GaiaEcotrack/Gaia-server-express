const { number } = require('joi');
const mongoose = require('mongoose');

// Define el esquema de los objetos dentro de accountAsociated
const accountAsociatedSchema = new mongoose.Schema({
  accountName: {
    type: String,
    required: true,
    trim: true,
  },
  associationDate: {
    type: Date,
    default: Date.now,
  },
  Earnigs: {
    type: Number,
    required: true,
    trim: true,
  },
  TotalTokens: {
    type: Number,
    required: true,
    trim: true,
  }
});

// Define el esquema del usuario comercial
const comercialSchema = new mongoose.Schema({
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
  address: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    trim: true,
  },
  accountAsociated: [accountAsociatedSchema] // Definimos el array de objetos con el esquema definido arriba
});

// Crea el modelo basado en el esquema
const User = mongoose.model('Comercial', comercialSchema);

module.exports = User;
