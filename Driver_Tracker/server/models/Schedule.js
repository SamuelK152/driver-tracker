const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  roster: [{
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    position: { type: String, default: 'Driver' }
  }],
  requirements: {
    type: Map,
    of: Number,
    default: {}
  },
  assignments: [{
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    vanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Van' },
    phoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment' }
  }]
});

module.exports = mongoose.model('Schedule', ScheduleSchema);
