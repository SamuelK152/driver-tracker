const express = require('express');
const router = express.Router();
const Config = require('../models/Config');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// Get config by key
router.get('/:key', auth, asyncHandler(async (req, res) => {
    const config = await Config.findOne({ key: req.params.key });
    res.status(200).json(config ? config.value : null);
}));

// Update config
router.post('/', auth, asyncHandler(async (req, res) => {
    const { key, value } = req.body;
    const config = await Config.findOneAndUpdate(
        { key },
        { value },
        { new: true, upsert: true }
    );
    res.status(200).json(config);
}));

module.exports = router;
