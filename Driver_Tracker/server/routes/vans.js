const express = require('express');
const router = express.Router();
const Van = require('../models/Van');
const Issue = require('../models/Issue');
const auth = require('../middleware/auth');

// Get all vans
router.get('/', auth, async (req, res) => {
  try {
    const vans = await Van.find().sort({ vin: 1 });
    res.status(200).json(vans);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vans' });
  }
});

// Create a new van
router.post('/', auth, async (req, res) => {
  try {
    const newVan = new Van(req.body);
    await newVan.save();
    res.status(201).json(newVan);
  } catch (error) {
    res.status(500).json({ message: 'Error creating van', error: error.message });
  }
});

// Update a van
router.put('/:id', auth, async (req, res) => {
  try {
    const updatedVan = await Van.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedVan);
  } catch (error) {
    res.status(500).json({ message: 'Error updating van' });
  }
});

// Delete a van
router.delete('/:id', auth, async (req, res) => {
  try {
    await Van.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Van deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting van' });
  }
});

// Get issues for a specific van
router.get('/:id/issues', auth, async (req, res) => {
  try {
    const issues = await Issue.find({ relatedType: 'Van', relatedId: req.params.id }).sort({ reportedAt: -1 });
    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching van issues' });
  }
});

module.exports = router;
