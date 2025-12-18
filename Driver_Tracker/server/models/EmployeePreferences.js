const mongoose = require('mongoose');

const EmployeePreferencesSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, unique: true },
    preferredVans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Van' }],
    preferredEquipment: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Equipment' }],
    preferredServiceTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ServiceType' }],
    notes: String
});

module.exports = mongoose.model('EmployeePreferences', EmployeePreferencesSchema);
