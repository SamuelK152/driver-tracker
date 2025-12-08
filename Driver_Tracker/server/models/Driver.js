const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  transporterId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  preferredEquipment: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Equipment' }],
  preferredVans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Van' }],
  preferredServiceTypes: [{ type: String }],
  training: [{ type: String }],
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Driver', DriverSchema);
