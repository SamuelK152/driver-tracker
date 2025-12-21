const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
    date: { type: Date, required: true, unique: true },
    routeCommitment: { type: Number, default: 0 },
    requirements: { type: Map, of: Number, default: {} },
    startTime: Date,
    roster: [{
        employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        position: { type: String, default: 'Driver' }, // e.g., 'Driver', 'Lead', 'Sweeper'
        status: { type: String, enum: ['Confirmed', 'Standby', 'Call_Out'], default: 'Confirmed' }
    }],
    notes: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Plan', PlanSchema);
