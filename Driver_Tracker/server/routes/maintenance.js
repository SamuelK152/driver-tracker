const express = require('express');
const router = express.Router();
const Maintenance = require('../models/Maintenance');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// Get all maintenance records
router.get('/', auth, asyncHandler(async (req, res) => {
    const records = await Maintenance.find()
        .populate('relatedAsset') // Polymorphic populate
        .populate('reportedBy', 'username')
        .populate('notes.user', 'username')
        .sort({ reportedAt: -1 });
    res.status(200).json(records);
}));

// Create a maintenance record
router.post('/', auth, asyncHandler(async (req, res) => {
    const maintenance = new Maintenance({
        ...req.body,
        reportedBy: req.userData.id
    });
    await maintenance.save();

    res.status(201).json(maintenance);
}));

// Update a maintenance record
router.put('/:id', auth, asyncHandler(async (req, res) => {
    const maintenance = await Maintenance.findById(req.params.id);
    if (!maintenance) return res.status(404).json({ message: 'Maintenance not found' });

    maintenance.description = req.body.description ?? maintenance.description;
    maintenance.priority = req.body.priority ?? maintenance.priority;
    maintenance.status = req.body.status ?? maintenance.status;
    maintenance.resolutionNotes = req.body.resolutionNotes ?? maintenance.resolutionNotes;
    maintenance.cost = req.body.cost ?? maintenance.cost;

    if (maintenance.status === 'Resolved' && !maintenance.resolvedAt) {
        maintenance.resolvedAt = new Date();
    }

    await maintenance.save();
    res.status(200).json(maintenance);
}));

// Add note
router.post('/:id/notes', auth, asyncHandler(async (req, res) => {
    const maintenance = await Maintenance.findById(req.params.id);
    if (!maintenance) return res.status(404).json({ message: 'Maintenance not found' });

    maintenance.notes.push({
        body: req.body.body,
        user: req.userData.id
    });

    await maintenance.save();
    res.status(201).json(maintenance);
}));

module.exports = router;
