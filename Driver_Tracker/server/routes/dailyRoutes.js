const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const asyncHandler = require('../utils/asyncHandler');

// Get routes (optional date filter)
router.get('/', asyncHandler(async (req, res) => {
    const { date } = req.query;
    let query = {};
    if (date) {
        query.date = date;
    }
    const routes = await Route.find(query)
        .populate('driverId', 'name')
        .populate('vanId', 'vanId vin')
        .populate('phoneId', 'serialNumber phoneNumber')
        .populate('equipmentIds', 'type serialNumber');
    res.json(routes);
}));

// Create route
router.post('/', asyncHandler(async (req, res) => {
    const route = await Route.create(req.body);
    res.status(201).json(route);
}));

// Update route
router.put('/:id', asyncHandler(async (req, res) => {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!route) {
        res.status(404);
        throw new Error('Route not found');
    }
    res.json(route);
}));

// Delete route
router.delete('/:id', asyncHandler(async (req, res) => {
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) {
        res.status(404);
        throw new Error('Route not found');
    }
    res.json({ message: 'Route removed' });
}));

module.exports = router;
