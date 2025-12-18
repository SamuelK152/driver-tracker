const mongoose = require('mongoose');

const ServiceTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // e.g., 'Standard', 'XL', 'SameDay'
    description: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ServiceType', ServiceTypeSchema);
