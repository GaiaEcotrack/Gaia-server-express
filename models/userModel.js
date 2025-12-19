const mongoose = require('mongoose');

const { Schema } = mongoose;

const WalletSchema = new Schema({
  gaia_token_balance: { type: Number, default: 0 },
  transactions: { type: Array, default: [] },
  vara_balance: { type: Number, default: 0 },
  willing_to_sell_excess: { type: Boolean, default: false },
  amount_kwh_to_sell: { type: Number, default: 0 }
}, { _id: false });

const DeviceSchema = new Schema({
  serial: { type: String, required: true, trim: true },
  model: { type: String, required: true, trim: true },
  capacity: { type: Number, required: true, min: 0 }
}, { _id: true });

const LocationSchema = new Schema({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: {
    type: [Number],
    validate: {
      validator: (coords) => Array.isArray(coords) && coords.length === 2,
      message: 'La localización debe tener [longitud, latitud]'
    }
  }
}, { _id: false });

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  full_name: { type: String, required: true },
  identification_number: { type: String, required: true, unique: true, trim: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  identity_document: { type: String, required: true },
  bank_account_status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  tax_declarations: { type: String, required: true },
  other_financial_documents: { type: String },
  device_brand: { type: String, required: true },
  username: { type: String, required: true, unique: true, sparse: true, trim: true },
  installation_company: { type: String, required: true },
  devices: { type: [DeviceSchema], default: [] },
  membresia: { type: Boolean, default: false },
  key_auth: { type: String, default: '' },
  wallet_address: { type: String, default: '' },
  verified_email: { type: Boolean, default: false },
  verified_sms: { type: Boolean, default: false },
  verified_2fa: { type: Boolean, default: false },
  status_documents: {
    type: String,
    default: 'pending',
    enum: ['pending', 'verified', 'rejected', 'approved', 'under_review']
  },
  photo_profile: { type: String },
  location: { type: LocationSchema, required: true },
  role: {
    type: String,
    default: 'Generator',
    enum: ['Generator', 'Installer', 'Admin', 'Comercial']
  },
  wallet: { type: WalletSchema, default: {} }
}, { timestamps: true });

UserSchema.index({ location: '2dsphere' });

UserSchema.methods.toJSON = function toJSON() {
  const user = this.toObject();
  delete user.key_auth;
  delete user.wallet?.transactions;
  return user;
};

module.exports = mongoose.model('User', UserSchema);