const mongoose = require('mongoose');

const VanSchema = new mongoose.Schema({
  vin: { type: String, required: true, unique: true },
  make: String,
  model: String,
  year: Number,
  licensePlate: String,
  status: {
    type: String,
    enum: ['Active', 'Maintenance', 'Retired'],
    default: 'Active'
  },
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Van', VanSchema);
