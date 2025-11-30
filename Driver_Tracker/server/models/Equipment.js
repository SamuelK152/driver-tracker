const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Phone', 'Gas Card', 'Dolly', 'Other']
  },
  serialNumber: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ['Available', 'In Use', 'Missing', 'Broken'],
    default: 'Available'
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'DriverMetric', default: null },
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Equipment', EquipmentSchema);
