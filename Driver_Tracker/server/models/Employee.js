const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Link to Auth User
    transporterId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Terminated'],
        default: 'Active'
    },
    employmentType: {
        type: String,
        enum: ['Full_Time', 'Part_Time', 'Seasonal'],
        default: 'Full_Time'
    },
    startDate: Date,
    terminationDate: Date,
    priority: { type: Number, default: 999 },
    notes: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Employee', EmployeeSchema);
