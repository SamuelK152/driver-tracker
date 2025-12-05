const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const IssueLog = require('../models/IssueLog');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// Get all issues
router.get('/', auth, asyncHandler(async (req, res) => {
  const issues = await Issue.find()
    .populate('reportedBy', 'username')
    .populate('relatedId')
    .sort({ reportedAt: -1 });
  res.status(200).json(issues);
}));

// Create a new issue
router.post('/', auth, asyncHandler(async (req, res) => {
  const issue = new Issue({
    ...req.body,
    reportedBy: req.userData.id
  });
  await issue.save();

  const log = new IssueLog({
    action: 'Issue Created',
    details: `New issue reported for ${req.body.relatedType}: ${req.body.description}`,
    user: req.userData.id
  });
  await log.save();

  res.status(201).json(issue);
}));

// Update an issue (e.g., resolve it)
router.put('/:id', auth, asyncHandler(async (req, res) => {
  const issue = await Issue.findByIdAndUpdate(req.params.id, req.body, { new: true });

  if (req.body.status === 'Resolved' && !issue.resolvedAt) {
    issue.resolvedAt = new Date();
    await issue.save();
  }

  if (req.body.status === 'Resolved') {
    const log = new IssueLog({
      action: 'Issue Resolved',
      details: `Issue resolved: ${issue.description}`,
      user: req.userData.id
    });
    await log.save();
  }

  res.status(200).json(issue);
}));

// Get issue logs
router.get('/logs', auth, asyncHandler(async (req, res) => {
  const logs = await IssueLog.find().populate('user', 'username').sort({ timestamp: -1 });
  res.status(200).json(logs);
}));

module.exports = router;
