const mongoose = require('mongoose');

const VanSchema = new mongoose.Schema({
  vanId: { type: String, required: true, unique: true },
  vin: { type: String, required: true, unique: true },
  make: String,
  model: String,
  year: Number,
  licensePlate: String,
  serviceType: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceType' },
  status: {
    type: String,
    enum: ['Active', 'Maintenance', 'Retired'],
    default: 'Active'
  },
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Van', VanSchema);
