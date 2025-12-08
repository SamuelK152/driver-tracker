const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema({
  type: { type: String, required: true },
  serialNumber: {
    type: String,
    required: function () {
      return this.type !== 'Gas Card';
    }
  },
  phoneNumber: String,
  van: { type: mongoose.Schema.Types.ObjectId, ref: 'Van', default: null },
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
