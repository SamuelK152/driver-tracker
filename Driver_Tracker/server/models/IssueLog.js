const mongoose = require('mongoose');

const IssueLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  details: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('IssueLog', IssueLogSchema);
