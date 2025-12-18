const mongoose = require('mongoose');

const ItemPreferenceSchema = new mongoose.Schema({
    pref: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'onModel' },
    onModel: { type: String, required: true, enum: ['Van', 'Equipment', 'ServiceType'] },
    employees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }]
});

module.exports = mongoose.model('ItemPreference', ItemPreferenceSchema);
