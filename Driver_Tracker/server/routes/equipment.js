const express = require('express');
const router = express.Router();
const Equipment = require('../models/Equipment');
const Maintenance = require('../models/Maintenance');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// Get all equipment
router.get('/', auth, asyncHandler(async (req, res) => {
  const equipment = await Equipment.find().sort({ type: 1, serialNumber: 1 }).populate('van', 'vanId vin');
  res.status(200).json(equipment);
}));

// Create new equipment
router.post('/', auth, asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (payload.van === '' || payload.van === undefined) {
    payload.van = null;
  }
  const newEquipment = new Equipment(payload);
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

  const maintenance = new Maintenance({
    description: `Equipment marked as missing: ${equipment.type} ${equipment.serialNumber}`,
    priority: 'High',
    status: 'Open',
    relatedType: 'Equipment',
    relatedId: String(equipment._id),
    reportedBy: req.userData.id
  });
  await maintenance.save();

  res.status(200).json({ equipment, maintenance });
}));

// Delete equipment
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  await Equipment.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: 'Equipment deleted' });
}));

module.exports = router;
