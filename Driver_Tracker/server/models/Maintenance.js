const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
    body: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

const MaintenanceSchema = new mongoose.Schema({
    description: { type: String, required: true },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Resolved'],
        default: 'Open'
    },
    relatedAsset: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'onModel'
    },
    onModel: {
        type: String,
        required: true,
        enum: ['Van', 'Equipment', 'Phone']
    },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reportedAt: { type: Date, default: Date.now },
    resolvedAt: Date,
    resolutionNotes: String,
    cost: Number,
    notes: { type: [NoteSchema], default: [] }
});

module.exports = mongoose.model('Maintenance', MaintenanceSchema);
