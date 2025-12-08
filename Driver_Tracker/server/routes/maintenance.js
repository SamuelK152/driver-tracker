const express = require('express');
const router = express.Router();
const Maintenance = require('../models/Maintenance');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// Get all maintenance records
router.get('/', auth, asyncHandler(async (req, res) => {
  const records = await Maintenance.find()
    .populate('reportedBy', 'username')
    .populate('notes.user', 'username')
    .sort({ reportedAt: -1 });
  res.status(200).json(records);
}));

// Get maintenance records (log view)
router.get('/logs', auth, asyncHandler(async (req, res) => {
  const logs = await Maintenance.find()
    .populate('reportedBy', 'username')
    .populate('notes.user', 'username')
    .sort({ reportedAt: -1 });
  res.status(200).json(logs);
}));

// Create a maintenance record
router.post('/', auth, asyncHandler(async (req, res) => {
  const maintenance = new Maintenance({
    ...req.body,
    relatedId: String(req.body.relatedId),
    reportedBy: req.userData.id
  });
  await maintenance.save();

  res.status(201).json(maintenance);
}));

// Update a maintenance record (including resolving)
router.put('/:id', auth, asyncHandler(async (req, res) => {
  const maintenance = await Maintenance.findById(req.params.id);
  if (!maintenance) return res.status(404).json({ message: 'Maintenance not found' });

  const prevStatus = maintenance.status;
  maintenance.description = req.body.description ?? maintenance.description;
  maintenance.priority = req.body.priority ?? maintenance.priority;
  maintenance.status = req.body.status ?? maintenance.status;
  maintenance.resolutionNotes = req.body.resolutionNotes ?? maintenance.resolutionNotes;

  if (maintenance.status === 'Resolved' && !maintenance.resolvedAt) {
    maintenance.resolvedAt = new Date();
  }

  await maintenance.save();

  res.status(200).json(maintenance);
}));

// Add a note to maintenance
router.post('/:id/notes', auth, asyncHandler(async (req, res) => {
  const { body } = req.body;
  if (!body) return res.status(400).json({ message: 'Note body is required' });

  const maintenance = await Maintenance.findById(req.params.id);
  if (!maintenance) return res.status(404).json({ message: 'Maintenance not found' });

  maintenance.notes.push({ body, user: req.userData.id });
  await maintenance.save();

  res.status(200).json(maintenance);
}));

module.exports = router;
