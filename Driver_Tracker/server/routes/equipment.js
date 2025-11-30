const express = require('express');
const router = express.Router();
const Equipment = require('../models/Equipment');
const Issue = require('../models/Issue');
const IssueLog = require('../models/IssueLog');
const auth = require('../middleware/auth');

// Get all equipment
router.get('/', auth, async (req, res) => {
  try {
    const equipment = await Equipment.find().sort({ type: 1, serialNumber: 1 });
    res.status(200).json(equipment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching equipment' });
  }
});

// Create new equipment
router.post('/', auth, async (req, res) => {
  try {
    const newEquipment = new Equipment(req.body);
    await newEquipment.save();
    res.status(201).json(newEquipment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating equipment', error: error.message });
  }
});

// Update equipment
router.put('/:id', auth, async (req, res) => {
  try {
    const updatedEquipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedEquipment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating equipment' });
  }
});

// Mark equipment as missing
router.post('/:id/missing', auth, async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) return res.status(404).json({ message: 'Equipment not found' });

    equipment.status = 'Missing';
    await equipment.save();

    // Create an issue automatically
    const issue = new Issue({
      description: `Equipment marked as missing: ${equipment.type} ${equipment.serialNumber}`,
      priority: 'High',
      status: 'Open',
      relatedType: 'Equipment',
      relatedId: equipment._id,
      reportedBy: req.userData.id
    });
    await issue.save();

    // Log the action
    const log = new IssueLog({
      action: 'Equipment Missing',
      details: `Equipment ${equipment.serialNumber} marked missing. Issue created.`,
      user: req.userData.id
    });
    await log.save();

    res.status(200).json({ equipment, issue });
  } catch (error) {
    res.status(500).json({ message: 'Error marking equipment as missing' });
  }
});

// Delete equipment
router.delete('/:id', auth, async (req, res) => {
  try {
    await Equipment.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Equipment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting equipment' });
  }
});

module.exports = router;
