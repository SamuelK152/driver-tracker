const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const auth = require('../middleware/auth');

// Get all driver profiles
router.get('/', auth, async (req, res) => {
  try {
    const drivers = await Driver.find().populate('preferredEquipment');
    res.status(200).json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching driver profiles' });
  }
});

// Create or Update driver profile
router.post('/', auth, async (req, res) => {
  try {
    const { transporterId } = req.body;
    const driver = await Driver.findOneAndUpdate(
      { transporterId },
      req.body,
      { new: true, upsert: true }
    );
    res.status(200).json(driver);
  } catch (error) {
    res.status(500).json({ message: 'Error saving driver profile' });
  }
});

module.exports = router;
