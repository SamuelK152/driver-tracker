const express = require('express');
const router = express.Router();
const Equipment = require('../models/Equipment');
const Issue = require('../models/Issue');
const IssueLog = require('../models/IssueLog');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// Get all equipment
router.get('/', auth, asyncHandler(async (req, res) => {
  const equipment = await Equipment.find().sort({ type: 1, serialNumber: 1 });
  res.status(200).json(equipment);
}));

// Create new equipment
router.post('/', auth, asyncHandler(async (req, res) => {
  const newEquipment = new Equipment(req.body);
  await newEquipment.save();
  res.status(201).json(newEquipment);
}));

// Update equipment
router.put('/:id', auth, asyncHandler(async (req, res) => {
  const updatedEquipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.status(200).json(updatedEquipment);
}));

// Mark equipment as missing
router.post('/:id/missing', auth, asyncHandler(async (req, res) => {
  const equipment = await Equipment.findById(req.params.id);
  if (!equipment) return res.status(404).json({ message: 'Equipment not found' });

  equipment.status = 'Missing';
  await equipment.save();

  const issue = new Issue({
    description: `Equipment marked as missing: ${equipment.type} ${equipment.serialNumber}`,
    priority: 'High',
    status: 'Open',
    relatedType: 'Equipment',
    relatedId: equipment._id,
    reportedBy: req.userData.id
  });
  await issue.save();

  const log = new IssueLog({
    action: 'Equipment Missing',
    details: `Equipment ${equipment.serialNumber} marked missing. Issue created.`,
    user: req.userData.id
  });
  await log.save();

  res.status(200).json({ equipment, issue });
}));

// Delete equipment
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  await Equipment.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: 'Equipment deleted' });
}));

module.exports = router;
