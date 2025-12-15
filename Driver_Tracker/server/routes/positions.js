const express = require('express');
const router = express.Router();
const Position = require('../models/Position');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// Get all positions
router.get('/', auth, asyncHandler(async (req, res) => {
  const positions = await Position.find().sort({ name: 1 });
  res.status(200).json(positions);
}));

// Create a new position
router.post('/', auth, asyncHandler(async (req, res) => {
  const { name } = req.body;
  const existing = await Position.findOne({ name });
  if (existing) {
    return res.status(400).json({ message: 'Position already exists' });
  }
  const newPosition = new Position({ name });
  await newPosition.save();
  res.status(201).json(newPosition);
}));

// Delete a position
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  await Position.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: 'Position deleted' });
}));

module.exports = router;
