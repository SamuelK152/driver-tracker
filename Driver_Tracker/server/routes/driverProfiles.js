const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// Get all driver profiles
router.get('/', auth, asyncHandler(async (req, res) => {
  const drivers = await Driver.find()
    .populate('preferredEquipment')
    .populate('preferredVans');
  res.status(200).json(drivers);
}));

// Create or Update driver profile
router.post('/', auth, asyncHandler(async (req, res) => {
  const { transporterId } = req.body;
  const driver = await Driver.findOneAndUpdate(
    { transporterId },
    req.body,
    { new: true, upsert: true }
  );
  res.status(200).json(driver);
}));

module.exports = router;
