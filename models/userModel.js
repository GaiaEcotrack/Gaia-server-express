const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Esquema para el monedero (wallet)
const WalletSchema = new Schema({
  gaia_token_balance: { type: Number, default: 0 },
  transactions: { type: Array, default: [] },
  vara_balance: { type: Number, default: 0 },
  willing_to_sell_excess: { type: Boolean, default: false },
  amount_kwh_to_sell: { type: Number, default: 0 }
});

// Esquema principal del usuario
const UserSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  full_name: { type: String, required: true },
  identification_number: { type: String, required: true, unique: true },
  address: { type: String },
  phone: { type: String },
  identity_document: { type: String }, // Podría ser un URL si almacenas el documento en S3 o similar
  bank_account_status: { type: String },
  tax_declarations: { type: String },
  other_financial_documents: { type: String },
  device_brand: { type: String },
  username: { type: String, unique: true, sparse: true },
  installation_company: { type: String },
  devices: { type: Array, default: [] },
  membresia: { type: Boolean, default: false },
  key_auth: { type: String, default: '' },
  verified_email: { type: Boolean, default: false },
  verified_sms: { type: Boolean, default: false },
  verified_2fa: { type: Boolean, default: false },
  status_documents: { 
    type: String, 
    default: 'pending',
    enum: ['pending', 'approved', 'rejected', 'under_review']
  },
  photo_profile: { type: String }, // URL de la imagen
  location: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number] // [longitude, latitude]
  },
  role: { 
    type: String, 
    default: 'Generator',
    enum: ['Generator', 'Installer', 'Admin', 'Comercial'] // Ajusta según tus necesidades
  },
  wallet: { type: WalletSchema, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Índice para búsquedas geolocalizadas
UserSchema.index({ location: '2dsphere' });

// Middleware para actualizar la fecha de modificación
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Método para ocultar información sensible al convertir a JSON
UserSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.key_auth;
  delete user.wallet.transactions; // O ajusta según lo que quieras mostrar
  return user;
};

const User = mongoose.model('User', UserSchema);

module.exports = User;