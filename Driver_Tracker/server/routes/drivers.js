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
  let date = null;

  // Handle both array (legacy) and object with date
  if (Array.isArray(req.body)) {
    metrics = req.body;
  } else {
    metrics = req.body.metrics || [];
    date = req.body.date;
  }
  
  try {
    // Filter out invalid rows and format data
    const validMetrics = metrics.filter(m => m["Transporter Id"] && m["Driver name"]);
    
    const formattedMetrics = validMetrics.map(m => ({
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
      createdAt: date ? new Date(date) : new Date()
    }));

    if (formattedMetrics.length === 0) {
      return res.status(400).json({ message: 'No valid driver data found in file' });
    }

    await DriverMetric.insertMany(formattedMetrics);
    res.status(201).json({ message: 'Metrics saved successfully', count: formattedMetrics.length });
  } catch (error) {
    console.error("Error saving metrics:", error);
    res.status(500).json({ message: 'Error saving metrics', error: error.message });
  }
});

// Get all unique drivers
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
