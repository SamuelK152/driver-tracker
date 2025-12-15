const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// Get schedule for a specific date
router.get('/', auth, asyncHandler(async (req, res) => {
  const { date, start, end } = req.query;

  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const schedules = await Schedule.find({
      date: { $gte: startDate, $lte: endDate }
    })
      .populate('roster.driverId')
      .populate('assignments.driverId')
      .populate('assignments.vanId')
      .populate('assignments.phoneId');

    return res.status(200).json(schedules);
  }

  if (date) {
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    const schedule = await Schedule.findOne({ date: queryDate })
      .populate('roster.driverId')
      .populate('assignments.driverId')
      .populate('assignments.vanId')
      .populate('assignments.phoneId');

    return res.status(200).json(schedule || { date: queryDate, roster: [], requirements: {}, assignments: [] });
  }

  return res.status(400).json({ message: 'Date or range required' });
}));

// Update roster for a specific date
router.post('/', auth, asyncHandler(async (req, res) => {
  const { date, roster, requirements, assignments } = req.body;
  if (!date) return res.status(400).json({ message: 'Date is required' });

  const queryDate = new Date(date);
  queryDate.setHours(0, 0, 0, 0);

  const updateData = {};
  if (roster) updateData.roster = roster;
  if (requirements) updateData.requirements = requirements;
  if (assignments) updateData.assignments = assignments;

  const schedule = await Schedule.findOneAndUpdate(
    { date: queryDate },
    { $set: updateData },
    { new: true, upsert: true }
  );
  res.status(200).json(schedule);
}));

module.exports = router;
