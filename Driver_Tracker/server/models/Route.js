const mongoose = require('mongoose');

const RouteSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    routeCode: { type: String, required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    vanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Van' },
    phoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Phone' },
    equipmentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Equipment' }],
    status: {
        type: String,
        default: 'Pending'
    },
    // Metrics Snapshot for "Present" view
    allStops: Number,
    stopsComplete: Number,
    totalPackages: Number,
    avgPace: Number,
    breakTimeUsed: Number,

    notes: String,
    projectedRTS: Date,
    actualRTS: Date,
    signOutTime: Date,
    signInTime: Date,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Route', RouteSchema);
