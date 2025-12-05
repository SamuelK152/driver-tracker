const express = require('express');
const router = express.Router();
const DriverMetric = require('../models/DriverMetric');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Save metrics
router.post('/', auth, async (req, res) => {
  let metrics = [];
  let dateStr = null;

  // Handle both array (legacy) and object with date
  if (Array.isArray(req.body)) {
    metrics = req.body;
  } else {
    metrics = req.body.metrics || [];
    dateStr = req.body.date;
  }

  try {
    // Determine the date range for duplicate checking
    // If dateStr is provided, use it. Otherwise use today.
    // We assume dateStr is YYYY-MM-DD
    const queryStartDate = dateStr ? new Date(dateStr) : new Date();
    if (!dateStr) queryStartDate.setUTCHours(0, 0, 0, 0);

    const queryEndDate = new Date(queryStartDate);
    queryEndDate.setDate(queryStartDate.getDate() + 1);

    // Use 8:00 UTC for saving. This corresponds to Midnight PST (UTC-8).
    // This ensures the date is recorded as the start of the day in Pacific Time.
    const saveDate = new Date(queryStartDate);
    saveDate.setUTCHours(8, 0, 0, 0);

    // Filter out invalid rows
    const validMetrics = metrics.filter(m => m["Transporter Id"] && m["Driver name"]);

    if (validMetrics.length === 0) {
      return res.status(400).json({ message: 'No valid driver data found in file' });
    }

    const operations = validMetrics.map(m => {
      const filter = {
        transporterId: m["Transporter Id"],
        createdAt: { $gte: queryStartDate, $lt: queryEndDate }
      };

      const updateData = {
        driverName: m["Driver name"],
        routeCode: m["Route code"],
        progressStatus: m["Progress Status"],
        projectedRTS: m["Projected Return to Station"],
        deliveryServiceType: m["Delivery Service Type"],
        vin: m["cortex_vin_number"],
        allStops: Number(m["All stops"]) || 0,
        stopsComplete: Number(m["Stops complete"]) || 0,
        notStartedStops: Number(m["not started stops"]) || 0,
        totalPackages: Number(m["total packages"]) || 0,
        avgPace: Number(m["cortex_avg_pace_stops_per_hour"]) || 0,
        signOut: m["App sign out:"],
        breakTimeUsed: Number(m["cortex_total_break_time_used"]) || 0,
      };

      return {
        updateOne: {
          filter: filter,
          update: {
            $set: updateData,
            $setOnInsert: { createdAt: saveDate, transporterId: m["Transporter Id"] }
          },
          upsert: true
        }
      };
    });

    const result = await DriverMetric.bulkWrite(operations);

    res.status(201).json({
      message: 'Metrics saved successfully',
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error saving metrics:", error);
    res.status(500).json({ message: 'Error saving metrics', error: error.message });
  }
});// Get all unique drivers
router.get('/list', auth, async (req, res) => {
  try {
    const drivers = await DriverMetric.aggregate([
      {
        $group: {
          _id: "$transporterId",
          driverName: { $first: "$driverName" },
          lastUpdate: { $max: "$createdAt" }
        }
      },
      {
        $lookup: {
          from: "drivers",
          localField: "_id",
          foreignField: "transporterId",
          as: "driverDetails"
        }
      },
      {
        $project: {
          transporterId: "$_id",
          driverName: {
            $ifNull: [
              "$driverName",
              { $arrayElemAt: ["$driverDetails.name", 0] }
            ]
          },
          lastUpdate: 1,
          _id: 0
        }
      },
      { $sort: { driverName: 1 } }
    ]);
    res.status(200).json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching drivers' });
  }
});

// Get all unique routes
router.get('/routes', auth, async (req, res) => {
  try {
    const routes = await DriverMetric.distinct('routeCode');
    res.status(200).json(routes.filter(r => r).sort());
  } catch (error) {
    res.status(500).json({ message: 'Error fetching routes' });
  }
});

// Get all unique dates
router.get('/dates', auth, async (req, res) => {
  try {
    const dates = await DriverMetric.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
        }
      },
      { $sort: { _id: -1 } }
    ]);
    res.status(200).json(dates.map(d => d._id));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dates' });
  }
});

// Get metrics for today
router.get('/today', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userData.id);
    const targetTime = user?.settings?.targetClockOutTime || "20:05";
    const [targetHours, targetMinutes] = targetTime.split(':').map(Number);
    const deadlineMinutes = targetHours * 60 + targetMinutes;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const metrics = await DriverMetric.find({
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    }).sort({ driverName: 1 });

    // Calculate start of the week (Sunday)
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Get all metrics for the current week for the drivers in today's list
    const transporterIds = metrics.map(m => m.transporterId);

    const weeklyMetrics = await DriverMetric.find({
      transporterId: { $in: transporterIds },
      createdAt: { $gte: startOfWeek, $lte: endOfToday }
    });

    // Group by transporterId
    const weeklyDataByDriver = {};
    weeklyMetrics.forEach(m => {
      if (!weeklyDataByDriver[m.transporterId]) {
        weeklyDataByDriver[m.transporterId] = [];
      }
      weeklyDataByDriver[m.transporterId].push(m);
    });

    // Calculate summary for each driver and attach to today's metrics
    const metricsWithSummary = metrics.map(m => {
      const driverWeekly = weeklyDataByDriver[m.transporterId] || [];
      let netMinutes = 0;

      driverWeekly.forEach(r => {
        if (!r.signOut) return;
        const timeRegex = /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?/;
        const match = r.signOut.match(timeRegex);
        if (!match) return;

        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const period = match[4] ? match[4].toUpperCase() : null;

        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;

        const currentMinutes = hours * 60 + minutes;
        netMinutes += (currentMinutes - deadlineMinutes);
      });

      return {
        ...m.toObject(),
        weeklyNetMinutes: netMinutes
      };
    });

    res.status(200).json(metricsWithSummary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching today\'s metrics' });
  }
});

// Get history for a specific route
router.get('/route/:routeCode', auth, async (req, res) => {
  const { routeCode } = req.params;
  try {
    const history = await DriverMetric.find({ routeCode })
      .populate('driverId', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching route history' });
  }
});

// Get history for a specific date
router.get('/date/:date', auth, async (req, res) => {
  const { date } = req.params;
  try {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const history = await DriverMetric.find({
      createdAt: { $gte: startDate, $lt: endDate }
    })
      .populate('driverId', 'name')
      .sort({ driverName: 1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching date history' });
  }
});

// Get aggregated summary for a date range
router.get('/summary', auth, async (req, res) => {
  const { start, end } = req.query;
  try {
    const user = await User.findById(req.userData.id);
    const targetTime = user?.settings?.targetClockOutTime || "20:05";
    const [targetHours, targetMinutes] = targetTime.split(':').map(Number);
    const deadlineMinutes = targetHours * 60 + targetMinutes;

    const startDate = new Date(start);
    const endDate = new Date(end);
    // Adjust endDate to include the full day
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);

    const summary = await DriverMetric.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: adjustedEndDate }
        }
      },
      {
        $lookup: {
          from: "drivers",
          localField: "driverId",
          foreignField: "_id",
          as: "driverInfo"
        }
      },
      {
        $unwind: {
          path: "$driverInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: "$transporterId",
          driverName: { $first: "$driverName" },
          driverInfoName: { $first: "$driverInfo.name" },
          totalStops: { $sum: "$stopsComplete" },
          totalPackages: { $sum: "$totalPackages" },
          avgPace: { $avg: "$avgPace" },
          totalRescueStops: { $sum: "$rescueStops" },
          totalRescuedStops: { $sum: "$rescuedStops" },
          totalOriginalStops: { $sum: "$originalStops" },
          totalAllStops: { $sum: "$allStops" },
          records: { $push: { signOut: "$signOut" } }
        }
      },
      {
        $project: {
          transporterId: "$_id",
          driverName: { $ifNull: ["$driverName", "$driverInfoName"] },
          totalStops: 1,
          totalPackages: 1,
          avgPace: 1,
          totalRescueStops: 1,
          totalRescuedStops: 1,
          totalOriginalStops: 1,
          totalAllStops: 1,
          records: 1,
          _id: 0
        }
      },
      { $sort: { driverName: 1 } }
    ]);

    // Calculate target diffs in JS
    const processedSummary = summary.map(driver => {
      let netMinutes = 0;
      driver.records.forEach(r => {
        if (!r.signOut) return;
        const timeRegex = /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?/;
        const match = r.signOut.match(timeRegex);
        if (!match) return;

        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const period = match[4] ? match[4].toUpperCase() : null;

        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;

        const currentMinutes = hours * 60 + minutes;
        netMinutes += (currentMinutes - deadlineMinutes);
      });

      return {
        ...driver,
        targetDiff: netMinutes,
        records: undefined // Remove raw records to save bandwidth
      };
    });

    res.status(200).json(processedSummary);
  } catch (error) {
    console.error("Error fetching summary:", error);
    res.status(500).json({ message: 'Error fetching summary' });
  }
});

// Get history for a specific driver
router.get('/:transporterId', auth, async (req, res) => {
  const { transporterId } = req.params;
  try {
    const history = await DriverMetric.find({ transporterId })
      .populate('driverId', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching history' });
  }
});

// Update driver note
router.patch('/:id/note', auth, async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  try {
    const updatedMetric = await DriverMetric.findByIdAndUpdate(
      id,
      { $set: { note } },
      { new: true }
    );

    if (!updatedMetric) {
      return res.status(404).json({ message: 'Driver metric not found' });
    }

    res.status(200).json(updatedMetric);
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ message: 'Error updating note' });
  }
});

// Process a rescue
router.post('/rescue', auth, async (req, res) => {
  const { rescuerId, rescueeId, stopCount } = req.body;
  const count = parseInt(stopCount);

  if (!rescuerId || !rescueeId || !count || count <= 0) {
    return res.status(400).json({ message: 'Invalid rescue data' });
  }

  try {
    const rescuer = await DriverMetric.findById(rescuerId);
    const rescuee = await DriverMetric.findById(rescueeId);

    if (!rescuer || !rescuee) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Initialize originalStops if not set
    if (!rescuer.originalStops) rescuer.originalStops = rescuer.allStops;
    if (!rescuee.originalStops) rescuee.originalStops = rescuee.allStops;

    // Update Rescuer (Giver)
    rescuer.rescueStops = (rescuer.rescueStops || 0) + count;
    rescuer.allStops = (rescuer.allStops || 0) + count;
    rescuer.rescueLog.push({
      type: 'GAVE',
      count: count,
      otherDriverName: rescuee.driverName || 'Unknown',
      timestamp: new Date()
    });

    // Update Rescuee (Receiver)
    rescuee.rescuedStops = (rescuee.rescuedStops || 0) + count;
    rescuee.allStops = (rescuee.allStops || 0) - count;
    rescuee.rescueLog.push({
      type: 'RECEIVED',
      count: count,
      otherDriverName: rescuer.driverName || 'Unknown',
      timestamp: new Date()
    });

    await rescuer.save();
    await rescuee.save();

    res.status(200).json({ message: 'Rescue processed successfully' });
  } catch (error) {
    console.error("Error processing rescue:", error);
    res.status(500).json({ message: 'Error processing rescue' });
  }
});

module.exports = router;
