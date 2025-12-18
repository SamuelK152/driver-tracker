const mongoose = require('mongoose');

const PhoneSchema = new mongoose.Schema({
    serialNumber: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    status: {
        type: String,
        enum: ['Available', 'In Use', 'Missing', 'Broken', 'Maintenance'],
        default: 'Available'
    },
    notes: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Phone', PhoneSchema);
