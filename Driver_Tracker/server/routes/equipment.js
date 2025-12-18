const express = require('express');
const router = express.Router();
const Equipment = require('../models/Equipment');
const Maintenance = require('../models/Maintenance');
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

    const maintenance = new Maintenance({
        description: `Equipment marked as missing: ${equipment.type} ${equipment.serialNumber}`,
        priority: 'High',
        status: 'Open',
        relatedAsset: equipment._id,
        onModel: 'Equipment',
        reportedBy: req.userData.id
    });
    await maintenance.save();

    res.status(200).json({ equipment, maintenance });
}));

module.exports = router;
