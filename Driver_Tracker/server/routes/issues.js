const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const IssueLog = require('../models/IssueLog');
const auth = require('../middleware/auth');

// Get all issues
router.get('/', auth, async (req, res) => {
  try {
    const issues = await Issue.find()
      .populate('reportedBy', 'username')
      .populate('relatedId') // This might need specific handling depending on how you want to display the related object
      .sort({ reportedAt: -1 });
    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching issues' });
  }
});

// Create a new issue
router.post('/', auth, async (req, res) => {
  try {
    const issue = new Issue({
      ...req.body,
      reportedBy: req.userData.id
    });
    await issue.save();

    // Log the action
    const log = new IssueLog({
      action: 'Issue Created',
      details: `New issue reported for ${req.body.relatedType}: ${req.body.description}`,
      user: req.userData.id
    });
    await log.save();

    res.status(201).json(issue);
  } catch (error) {
    res.status(500).json({ message: 'Error creating issue', error: error.message });
  }
});

// Update an issue (e.g., resolve it)
router.put('/:id', auth, async (req, res) => {
  try {
    const issue = await Issue.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (req.body.status === 'Resolved' && !issue.resolvedAt) {
      issue.resolvedAt = new Date();
      await issue.save();
    }

    // Log if resolved
    if (req.body.status === 'Resolved') {
      const log = new IssueLog({
        action: 'Issue Resolved',
        details: `Issue resolved: ${issue.description}`,
        user: req.userData.id
      });
      await log.save();
    }

    res.status(200).json(issue);
  } catch (error) {
    res.status(500).json({ message: 'Error updating issue' });
  }
});

// Get issue logs
router.get('/logs', auth, async (req, res) => {
  try {
    const logs = await IssueLog.find().populate('user', 'username').sort({ timestamp: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching logs' });
  }
});

module.exports = router;
