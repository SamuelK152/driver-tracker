const mongoose = require('mongoose');

const DriverMetricSchema = new mongoose.Schema({
  transporterId: { type: String, required: true },
  driverName: String,
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  routeCode: String,
  progressStatus: String,
  projectedRTS: String,
  deliveryServiceType: String,
  vin: String,
  allStops: Number,
  stopsComplete: Number,
  notStartedStops: Number,
  totalPackages: Number,
  avgPace: Number,
  signIn: String,
  signOut: String,
  lastStopExecution: String,
  breakTimeUsed: Number,
  note: String,
  originalStops: { type: Number, default: 0 },
  rescueStops: { type: Number, default: 0 },
  rescuedStops: { type: Number, default: 0 },
  rescueLog: [{
    type: { type: String, enum: ['GAVE', 'RECEIVED'] },
    count: Number,
    otherDriverName: String,
    timestamp: { type: Date, default: Date.now }
  }],
  vanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Van' },
  assignedEquipment: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Equipment' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DriverMetric', DriverMetricSchema);
