const express = require('express');
const router = express.Router();
const ServiceType = require('../models/ServiceType');
const asyncHandler = require('../utils/asyncHandler');

router.get('/', asyncHandler(async (req, res) => {
    const types = await ServiceType.find();
    res.json(types);
}));

router.post('/', asyncHandler(async (req, res) => {
    const type = await ServiceType.create(req.body);
    res.status(201).json(type);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
    await ServiceType.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service Type removed' });
}));

module.exports = router;
