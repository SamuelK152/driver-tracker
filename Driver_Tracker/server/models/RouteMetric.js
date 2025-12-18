const mongoose = require('mongoose');

const RouteMetricSchema = new mongoose.Schema({
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
    date: { type: Date, required: true },

    // Snapshot fields for History
    routeCode: String,
    transporterId: String,
    vanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Van' },
    phoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Phone' },
    equipmentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Equipment' }],

    allStops: Number,
    stopsComplete: Number,
    totalPackages: Number,
    avgPace: Number,
    progressStatus: String,
    breakTimeUsed: Number,
    netScore: Number,
    rescueLog: [{
        type: { type: String, enum: ['GAVE', 'RECEIVED'] },
        count: Number,
        otherDriverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        timestamp: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RouteMetric', RouteMetricSchema);
