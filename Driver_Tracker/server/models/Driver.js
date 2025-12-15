const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  transporterId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  preferredEquipment: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Equipment' }],
  preferredVans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Van' }],
  preferredServiceTypes: [{ type: String }],
  training: [{ type: String }],
  priority: { type: Number, default: 999 },
  schedule: {
    type: {
      type: String,
      enum: ['weekly', 'bi-weekly', 'monthly', 'manual'],
      default: 'weekly'
    },
    days: [{ type: String }], // e.g., ['Sunday', 'Monday', ...]
    startDate: { type: Date }, // Reference for bi-weekly/monthly cycles
    manualDates: [{ type: Date }], // Specific dates for manual scheduling
    excludedDates: [{ type: Date }] // Specific dates to exclude from the schedule
  },
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Driver', DriverSchema);
