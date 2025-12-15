const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('Config', ConfigSchema);
