const express = require('express');
const router = express.Router();
const Van = require('../models/Van');
const Maintenance = require('../models/Maintenance');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// Get all vans
router.get('/', auth, asyncHandler(async (req, res) => {
  const vans = await Van.find().sort({ vanId: 1, vin: 1 });
  res.status(200).json(vans);
}));

// Create a new van
router.post('/', auth, asyncHandler(async (req, res) => {
  const newVan = new Van(req.body);
  await newVan.save();
  res.status(201).json(newVan);
}));

// Update a van
router.put('/:id', auth, asyncHandler(async (req, res) => {
  const updatedVan = await Van.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updatedVan) return res.status(404).json({ message: 'Van not found' });
  res.status(200).json(updatedVan);
}));

// Delete a van
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  await Van.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: 'Van deleted' });
}));

// Get maintenance records for a specific van
router.get('/:id/maintenance', auth, asyncHandler(async (req, res) => {
  const maintenance = await Maintenance.find({ relatedType: 'Van', relatedId: String(req.params.id) }).sort({ reportedAt: -1 });
  res.status(200).json(maintenance);
}));

module.exports = router;
