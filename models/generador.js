const mongoose = require("mongoose");

const generadorSchema = new mongoose.Schema({
  name: String,
  generatedKW: { type: Number, default: 0 },
  tokens: { type: Number, default: 0 },
  c02: { type: Number, default: 0 },
  rated_power: { type: Number, default: 0 },
  secret_name: String,
  wallet: String,
  installation_company: String,
  tokenised_today: { type: Boolean, default: false },
  brand: { type: String, required: true },
  country: { type: String, required: true },
  departament: { type: String, required: true },
  municipality: { type: String, required: true },
});

const Generador = mongoose.model("Generador", generadorSchema);

module.exports = Generador;
