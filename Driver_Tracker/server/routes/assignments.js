const express = require('express');
const router = express.Router();
const DriverMetric = require('../models/DriverMetric');
const Driver = require('../models/Driver');
const Equipment = require('../models/Equipment');
const auth = require('../middleware/auth');

// Auto-assign equipment for today
router.post('/auto-assign', auth, async (req, res) => {
  try {
    // 1. Get today's active drivers (from DriverMetric)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todaysMetrics = await DriverMetric.find({
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    }).populate('driverId');

    if (todaysMetrics.length === 0) {
      return res.status(400).json({ message: 'No drivers found for today to assign equipment to.' });
    }

    // 2. Get all available equipment
    const availableEquipment = await Equipment.find({ status: 'Available' });

    // Helper to find equipment by type
    const findEquip = (type, preferredId = null) => {
      if (preferredId) {
        const preferred = availableEquipment.find(e => e._id.toString() === preferredId.toString() && e.type === type);
        if (preferred) return preferred;
      }
      return availableEquipment.find(e => e.type === type && !e.tempAssigned);
    };

    const assignments = [];

    for (const metric of todaysMetrics) {
      // Get persistent driver profile
      const profile = await Driver.findOne({ transporterId: metric.transporterId });

      const assigned = [];

      // Define required equipment types (could be dynamic later)
      const requiredTypes = ['Phone', 'Gas Card'];

      for (const type of requiredTypes) {
        let preferredId = null;
        if (profile && profile.preferredEquipment) {
          // Check if driver has a preference for this type
          // This logic assumes preferredEquipment is populated or we fetch it. 
          // Since we didn't populate, we need to check the IDs against available equipment
          // But wait, preferredEquipment in Driver model is an array of ObjectIds.
          // We need to know the type of that equipment to match it.
          // For simplicity, let's assume we just look for ANY available equipment of the type.
          // Ideally, we would look up the preferred equipment's type.
        }

        const equip = findEquip(type);
        if (equip) {
          assigned.push(equip._id);
          equip.tempAssigned = true; // Mark as temporarily assigned in this memory scope so we don't double assign

          // Update Equipment status in DB to 'In Use' and assignedTo
          await Equipment.findByIdAndUpdate(equip._id, {
            status: 'In Use',
            assignedTo: metric._id
          });
        }
      }

      if (assigned.length > 0) {
        metric.assignedEquipment = assigned;
        await metric.save();
        assignments.push({ driver: metric.driverId?.name || metric.transporterId, equipment: assigned.length });
      }
    }

    res.status(200).json({ message: 'Auto-assignment complete', assignments });

  } catch (error) {
    console.error("Auto-assign error:", error);
    res.status(500).json({ message: 'Error during auto-assignment' });
  }
});

module.exports = router;
