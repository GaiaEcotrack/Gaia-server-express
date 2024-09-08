// credenciales.js (modelo)
const mongoose = require('mongoose');

const credencialesSchema = new mongoose.Schema({
  username: { type: String, required: true },
  user_client: { type: String, required: true },
  password: { type: String, required: true }
});

const Credencials = mongoose.model('Credenciales', credencialesSchema);

module.exports = Credencials;
