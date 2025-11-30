const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ result: user, token });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Get User Settings
router.get('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userData.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.status(200).json(user.settings);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Update User Settings
router.put('/settings', auth, async (req, res) => {
  const { timezone, targetClockOutTime } = req.body;
  try {
    const user = await User.findById(req.userData.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (timezone) user.settings.timezone = timezone;
    if (targetClockOutTime) user.settings.targetClockOutTime = targetClockOutTime;

    await user.save();
    
    res.status(200).json({ message: 'Settings updated successfully', settings: user.settings });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

module.exports = router;
