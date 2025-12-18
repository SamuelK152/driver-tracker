const express = require('express');
const router = express.Router();
const ItemPreference = require('../models/ItemPreference');
const asyncHandler = require('../utils/asyncHandler');

// Get all preferences
router.get('/', asyncHandler(async (req, res) => {
    const preferences = await ItemPreference.find()
        .populate('pref')
        .populate('employees');
    res.json(preferences);
}));

// Create preference
router.post('/', asyncHandler(async (req, res) => {
    const { pref, employees, type } = req.body;

    // Map frontend type to model type if needed, or expect correct type
    // Frontend sends: 'van', 'equipment', 'service' (I will update frontend to send 'Van', 'Equipment', 'ServiceType' or map it there)

    const preference = await ItemPreference.create({
        pref,
        employees,
        onModel: type // Expecting 'Van', 'Equipment', or 'ServiceType'
    });

    const populated = await ItemPreference.findById(preference._id)
        .populate('pref')
        .populate('employees');

    res.status(201).json(populated);
}));

// Update preference
router.put('/:id', asyncHandler(async (req, res) => {
    const { employees } = req.body;

    const preference = await ItemPreference.findByIdAndUpdate(
        req.params.id,
        { employees },
        { new: true }
    )
        .populate('pref')
        .populate('employees');

    if (!preference) {
        res.status(404);
        throw new Error('Preference not found');
    }

    res.json(preference);
}));

module.exports = router;
