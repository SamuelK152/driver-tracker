const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');
const asyncHandler = require('../utils/asyncHandler');

// Get plans (optional date range filter)
router.get('/', asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    let query = {};
    if (startDate && endDate) {
        query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const plans = await Plan.find(query).populate('roster.employeeId', 'name');
    res.json(plans);
}));

// Get single plan by date
router.get('/:date', asyncHandler(async (req, res) => {
    const plan = await Plan.findOne({ date: req.params.date }).populate('roster.employeeId', 'name');
    if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
    }
    res.json(plan);
}));

// Create or Update Plan
router.post('/', asyncHandler(async (req, res) => {
    const { date, ...rest } = req.body;
    const plan = await Plan.findOneAndUpdate(
        { date: date },
        { ...rest, date },
        { new: true, upsert: true }
    );
    res.json(plan);
}));

module.exports = router;
