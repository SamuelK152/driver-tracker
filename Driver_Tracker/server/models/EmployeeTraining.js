const mongoose = require('mongoose');

const EmployeeTrainingSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    trainingName: { type: String, required: true },
    completedDate: { type: Date, default: Date.now },
    expiryDate: Date,
    certificateUrl: String,
    notes: String
});

module.exports = mongoose.model('EmployeeTraining', EmployeeTrainingSchema);
