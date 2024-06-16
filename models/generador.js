const mongoose = require('mongoose');

const generadorSchema = new mongoose.Schema({
  name: String,
  generatedKW: { type: Number, default: 0 },
  tokens: { type: Number, default: 0 },
  device_id:{type : Number,default:0},
  secret_name:String,
  wallet:String
});

const Generador = mongoose.model('Generador', generadorSchema);

module.exports = Generador;
