const express = require('express');
const router = express.Router();
const Phone = require('../models/Phone');
const asyncHandler = require('../utils/asyncHandler');

router.get('/', asyncHandler(async (req, res) => {
    const phones = await Phone.find();
    res.json(phones);
}));

router.post('/', asyncHandler(async (req, res) => {
    const phone = await Phone.create(req.body);
    res.status(201).json(phone);
}));

router.put('/:id', asyncHandler(async (req, res) => {
    const phone = await Phone.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!phone) {
        res.status(404);
        throw new Error('Phone not found');
    }
    res.json(phone);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
    await Phone.findByIdAndDelete(req.params.id);
    res.json({ message: 'Phone removed' });
}));

module.exports = router;
