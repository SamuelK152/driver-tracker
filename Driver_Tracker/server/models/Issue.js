const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
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
  relatedType: {
    type: String,
    enum: ['Van', 'Equipment'],
    required: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'relatedType'
  },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reportedAt: { type: Date, default: Date.now },
  resolvedAt: Date,
  resolutionNotes: String
});

module.exports = mongoose.model('Issue', IssueSchema);
