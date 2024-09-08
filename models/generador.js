const mongoose = require('mongoose');

const generadorSchema = new mongoose.Schema({
  name: String,
  generatedKW: { type: Number, default: 0 },
  tokens: { type: Number, default: 0 },
  secret_name:String,
  wallet:String,
  installation_company:String,
  tokenised_today:{type : Boolean,default:false}
});

const Generador = mongoose.model('Generador', generadorSchema);

module.exports = Generador;
