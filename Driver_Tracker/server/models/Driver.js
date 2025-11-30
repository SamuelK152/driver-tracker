const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  transporterId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  preferredEquipment: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Equipment' }],
  training: [{ type: String }],
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Driver', DriverSchema);
