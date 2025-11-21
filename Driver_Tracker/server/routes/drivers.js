const express = require('express');
const router = express.Router();
const DriverMetric = require('../models/DriverMetric');

// Middleware to verify token (optional, but requested "login to gain access")
const auth = (req, res, next) => {
  // Simple check for now, can be expanded
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Auth failed" });
  // Verify token logic here if needed, or just assume presence for now
  next();
};

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

    // Get list of transporter IDs to check
    const transporterIds = validMetrics.map(m => m["Transporter Id"]);

    // Find existing records for these drivers on this date
    const existingRecords = await DriverMetric.find({
      transporterId: { $in: transporterIds },
      createdAt: { $gte: queryStartDate, $lt: queryEndDate }
    });

    const existingTransporterIds = new Set(existingRecords.map(r => r.transporterId));

    const formattedMetrics = validMetrics
      .filter(m => !existingTransporterIds.has(m["Transporter Id"]))
      .map(m => ({
        transporterId: m["Transporter Id"],
        driverName: m["Driver name"],
        routeCode: m["Route code"],
        projectedRTS: m["Projected Return to Station"],
        deliveryServiceType: m["Delivery Service Type"],
        vin: m["cortex_vin_number"],
        allStops: Number(m["All stops"]) || 0,
        stopsComplete: Number(m["Stops complete"]) || 0,
        notStartedStops: Number(m["not started stops"]) || 0,
        totalPackages: Number(m["total packages"]) || 0,
        avgPace: Number(m["cortex_avg_pace_stops_per_hour"]) || 0,
        signIn: m["App sign in:"],
        signOut: m["App sign out:"],
        lastStopExecution: m["cortex_last_stop_execution_time"],
        breakTimeUsed: Number(m["cortex_total_break_time_used"]) || 0,
        createdAt: saveDate
      })); if (formattedMetrics.length === 0) {
        if (validMetrics.length > 0) {
          return res.status(200).json({ message: 'All provided metrics already exist for this date.', count: 0, skipped: validMetrics.length });
        }
        return res.status(400).json({ message: 'No valid driver data found in file' });
      }

    await DriverMetric.insertMany(formattedMetrics);
    res.status(201).json({
      message: 'Metrics saved successfully',
      count: formattedMetrics.length,
      skipped: validMetrics.length - formattedMetrics.length
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
          _id: { transporterId: "$transporterId", driverName: "$driverName" },
          lastUpdate: { $max: "$createdAt" }
        }
      },
      {
        $project: {
          transporterId: "$_id.transporterId",
          driverName: "$_id.driverName",
          lastUpdate: 1,
          _id: 0
        }
      }
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

// Get history for a specific route
router.get('/route/:routeCode', auth, async (req, res) => {
  const { routeCode } = req.params;
  try {
    const history = await DriverMetric.find({ routeCode }).sort({ createdAt: -1 });
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
    }).sort({ driverName: 1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching date history' });
  }
});

// Get history for a specific driver
router.get('/:transporterId', auth, async (req, res) => {
  const { transporterId } = req.params;
  try {
    const history = await DriverMetric.find({ transporterId }).sort({ createdAt: -1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching history' });
  }
});

module.exports = router;
