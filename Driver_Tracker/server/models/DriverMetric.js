const mongoose = require('mongoose');

const DriverMetricSchema = new mongoose.Schema({
  transporterId: { type: String, required: true },
  driverName: { type: String, required: true },
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
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DriverMetric', DriverMetricSchema);
