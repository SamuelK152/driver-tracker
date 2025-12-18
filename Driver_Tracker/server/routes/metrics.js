const express = require('express');
const router = express.Router();
const RouteMetric = require('../models/RouteMetric');
const Route = require('../models/Route');
const Employee = require('../models/Employee');
const Van = require('../models/Van');
const asyncHandler = require('../utils/asyncHandler');

// Get metrics (optional date range or routeId filter)
router.get('/', asyncHandler(async (req, res) => {
    const { startDate, endDate, routeId } = req.query;
    let query = {};
    if (routeId) {
        query.routeId = routeId;
    }
    if (startDate && endDate) {
        query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const metrics = await RouteMetric.find(query).populate('routeId');
    res.json(metrics);
}));

// Get list of drivers with metrics
router.get('/list', asyncHandler(async (req, res) => {
    const drivers = await RouteMetric.aggregate([
        {
            $group: {
                _id: "$transporterId",
                lastDate: { $max: "$date" }
            }
        }
    ]);

    // Populate names
    const transporterIds = drivers.map(d => d._id);
    const employees = await Employee.find({ transporterId: { $in: transporterIds } });
    const empMap = new Map(employees.map(e => [e.transporterId, e.name]));

    const result = drivers.map(d => ({
        transporterId: d._id,
        driverName: empMap.get(d._id) || d._id,
        lastDate: d.lastDate
    }));

    res.json(result);
}));

// Get list of routes
router.get('/routes', asyncHandler(async (req, res) => {
    const routes = await RouteMetric.distinct('routeCode');
    res.json(routes);
}));

// Get list of dates
router.get('/dates', asyncHandler(async (req, res) => {
    const dates = await RouteMetric.distinct('date');
    // Sort dates
    dates.sort((a, b) => new Date(b) - new Date(a));
    res.json(dates);
}));

// Get summary
router.get('/summary', asyncHandler(async (req, res) => {
    const { start, end } = req.query;
    const query = {};
    if (start && end) {
        query.date = { $gte: new Date(start), $lte: new Date(end) };
    }
    const metrics = await RouteMetric.find(query);

    // Populate driver names
    const transporterIds = [...new Set(metrics.map(m => m.transporterId))];
    const employees = await Employee.find({ transporterId: { $in: transporterIds } });
    const empMap = new Map(employees.map(e => [e.transporterId, e.name]));

    const result = metrics.map(m => ({
        ...m.toObject(),
        driverName: empMap.get(m.transporterId) || m.transporterId
    }));

    res.json(result);
}));

// Get driver history
router.get('/driver/:id', asyncHandler(async (req, res) => {
    const metrics = await RouteMetric.find({ transporterId: req.params.id }).sort({ date: -1 });
    // Populate driver name for convenience
    const employee = await Employee.findOne({ transporterId: req.params.id });
    const result = metrics.map(m => ({
        ...m.toObject(),
        driverName: employee ? employee.name : m.transporterId
    }));
    res.json(result);
}));

// Get route history
router.get('/route/:code', asyncHandler(async (req, res) => {
    const metrics = await RouteMetric.find({ routeCode: req.params.code }).sort({ date: -1 });
    // We might want driver names here too
    const transporterIds = [...new Set(metrics.map(m => m.transporterId))];
    const employees = await Employee.find({ transporterId: { $in: transporterIds } });
    const empMap = new Map(employees.map(e => [e.transporterId, e.name]));

    const result = metrics.map(m => ({
        ...m.toObject(),
        driverName: empMap.get(m.transporterId) || m.transporterId
    }));
    res.json(result);
}));

// Get date details
router.get('/date/:date', asyncHandler(async (req, res) => {
    const dateStr = req.params.date;
    // Handle YYYY-MM-DD
    const start = new Date(dateStr);
    // Ensure it's treated as UTC or local correctly. 
    // The import uses startOfDay based on input date.
    // Let's assume the date string is YYYY-MM-DD.
    // We need to cover the whole day.
    // If dateStr is "2023-10-01", new Date("2023-10-01") is UTC midnight.

    const startDate = new Date(dateStr);
    const endDate = new Date(dateStr);
    endDate.setHours(23, 59, 59, 999);

    // Adjust for timezone if needed, but usually dates are stored as UTC midnight in this app (based on import logic)
    // Import logic:
    // const startOfDay = new Date(queryDate); startOfDay.setUTCHours(0, 0, 0, 0);

    // So we should query for that exact date or range.
    // Let's use a range to be safe.

    const metrics = await RouteMetric.find({
        date: {
            $gte: startDate,
            $lte: endDate
        }
    });

    // Populate driver names
    const transporterIds = [...new Set(metrics.map(m => m.transporterId))];
    const employees = await Employee.find({ transporterId: { $in: transporterIds } });
    const empMap = new Map(employees.map(e => [e.transporterId, e.name]));

    const result = metrics.map(m => ({
        ...m.toObject(),
        driverName: empMap.get(m.transporterId) || m.transporterId
    }));
    res.json(result);
}));

// Create metric
router.post('/', asyncHandler(async (req, res) => {
    const metric = await RouteMetric.create(req.body);
    res.status(201).json(metric);
}));

// Update metric
router.put('/:id', asyncHandler(async (req, res) => {
    const metric = await RouteMetric.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!metric) {
        res.status(404);
        throw new Error('Metric not found');
    }
    res.json(metric);
}));

// Import metrics (Bulk with validation)
router.post('/import', asyncHandler(async (req, res) => {
    const { metrics, date, newEntities } = req.body;
    // metrics: [{ transporterId, vin, routeCode, ... }]
    // newEntities: { transporters: [{ name, transporterId }], vins: [{ vin, name, serviceType }] }

    // 1. Identify Unique IDs
    const transporterIds = [...new Set(metrics.map(m => m.transporterId ? String(m.transporterId) : null).filter(Boolean))];
    const vins = [...new Set(metrics.map(m => m.vin ? String(m.vin) : null).filter(Boolean))];

    // 2. Find Existing
    const existingEmployees = await Employee.find({ transporterId: { $in: transporterIds } });
    const existingVans = await Van.find({ vin: { $in: vins } });

    const foundTransporterIds = new Set(existingEmployees.map(e => e.transporterId));
    const foundVins = new Set(existingVans.map(v => v.vin));

    // 3. Identify Missing
    const missingTransporterIds = transporterIds.filter(id => !foundTransporterIds.has(id));
    const missingVins = vins.filter(v => !foundVins.has(v));

    // 4. Handle New Entities Creation (if confirmed)
    if (newEntities) {
        // Create Employees
        if (newEntities.transporters && newEntities.transporters.length > 0) {
            const toCreate = newEntities.transporters.filter(t => missingTransporterIds.includes(String(t.transporterId)));
            if (toCreate.length > 0) {
                await Employee.insertMany(toCreate.map(t => ({ name: t.name || String(t.transporterId), transporterId: String(t.transporterId) })));
                toCreate.forEach(t => foundTransporterIds.add(String(t.transporterId)));
            }
        }
        // Create Vans
        if (newEntities.vins && newEntities.vins.length > 0) {
            const toCreate = newEntities.vins.filter(v => missingVins.includes(String(v.vin)));
            if (toCreate.length > 0) {
                // Assuming serviceType is an ID passed from frontend
                await Van.insertMany(toCreate.map(v => ({
                    name: v.name, // Assuming 'name' maps to something or is just used for display? Van model has 'vanId' (required).
                    // Wait, Van model has 'vanId' (required) and 'vin' (required).
                    // The user prompt says "name and serviceType for the vans".
                    // I'll assume 'name' -> 'vanId' (e.g. "Van 101").
                    vanId: v.name || String(v.vin),
                    vin: String(v.vin),
                    serviceType: v.serviceType || undefined
                })));
                toCreate.forEach(v => foundVins.add(String(v.vin)));
            }
        }
    }

    // 5. Re-check Missing
    const finalMissingTransporters = transporterIds.filter(id => !foundTransporterIds.has(id));
    const finalMissingVins = vins.filter(v => !foundVins.has(v));

    if (finalMissingTransporters.length > 0 || finalMissingVins.length > 0) {
        // Map back to names if available
        const unknownTransportersWithNames = finalMissingTransporters.map(id => {
            const metric = metrics.find(m => String(m.transporterId) === id);
            return { transporterId: id, name: metric?.driverName || '' };
        });

        return res.json({
            status: 'unknown_entities',
            unknownTransporters: unknownTransportersWithNames,
            unknownVins: finalMissingVins
        });
    }

    // 6. Process Data
    const queryDate = new Date(date);
    const startOfDay = new Date(queryDate); startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(queryDate); endOfDay.setUTCHours(23, 59, 59, 999);

    const today = new Date();
    const todayStart = new Date(today); todayStart.setUTCHours(0, 0, 0, 0);
    const isToday = startOfDay.getTime() === todayStart.getTime();

    // Refetch all needed entities to get ObjectIds
    const allEmployees = await Employee.find({ transporterId: { $in: transporterIds } });
    const allVans = await Van.find({ vin: { $in: vins } });

    const empMap = new Map(allEmployees.map(e => [e.transporterId, e._id]));
    const vanMap = new Map(allVans.map(v => [v.vin, v._id]));

    if (isToday) {
        // Clear Routes not from today
        await Route.deleteMany({
            $or: [
                { date: { $lt: startOfDay } },
                { date: { $gt: endOfDay } }
            ]
        });
    }

    const safeNum = (val) => {
        const n = Number(val);
        return isNaN(n) ? 0 : n;
    };

    const parseTime = (timeStr, dateBase) => {
        if (!timeStr || typeof timeStr !== 'string' || timeStr.toLowerCase() === 'missing') return null;

        // Try to match "7:54pm" or "07:54 PM" etc.
        const match = timeStr.match(/(\d+):(\d+)\s*(am|pm)/i);
        if (!match) return null;

        let [_, hours, minutes, modifier] = match;
        hours = parseInt(hours, 10);
        minutes = parseInt(minutes, 10);
        modifier = modifier.toLowerCase();

        if (hours === 12 && modifier === 'am') {
            hours = 0;
        } else if (hours !== 12 && modifier === 'pm') {
            hours += 12;
        }

        const d = new Date(dateBase);
        d.setHours(hours, minutes, 0, 0);
        return d;
    };

    const results = [];
    for (const item of metrics) {
        const empId = empMap.get(String(item.transporterId));
        const vanId = vanMap.get(String(item.vin));

        // Prepare common data
        const metricData = {
            date: startOfDay,
            routeCode: item.routeCode,
            transporterId: String(item.transporterId),
            vanId: vanId,
            allStops: safeNum(item.allStops),
            stopsComplete: safeNum(item.stopsComplete),
            totalPackages: safeNum(item.totalPackages),
            avgPace: safeNum(item.avgPace),
            progressStatus: item.status,
            breakTimeUsed: safeNum(item.breakTimeUsed),
        };

        let routeId = null;

        if (isToday) {
            // Upsert Route
            const route = await Route.findOneAndUpdate(
                { routeCode: item.routeCode, date: { $gte: startOfDay, $lte: endOfDay } },
                {
                    date: startOfDay,
                    routeCode: item.routeCode,
                    driverId: empId,
                    vanId: vanId,
                    status: item.status === 'COMPLETE' ? 'Completed' : 'In_Progress',
                    allStops: safeNum(item.allStops),
                    stopsComplete: safeNum(item.stopsComplete),
                    totalPackages: safeNum(item.totalPackages),
                    avgPace: safeNum(item.avgPace),
                    breakTimeUsed: safeNum(item.breakTimeUsed),
                    projectedRTS: parseTime(item.projectedRTS, startOfDay),
                    signOutTime: parseTime(item.signOut, startOfDay)
                },
                { new: true, upsert: true }
            );
            routeId = route._id;
        }

        // Upsert Metric
        // Note: If isToday is false, routeId will be null.
        // We find metric by routeCode + date.
        const metric = await RouteMetric.findOneAndUpdate(
            { routeCode: item.routeCode, date: { $gte: startOfDay, $lte: endOfDay } },
            {
                ...metricData,
                routeId: routeId
            },
            { new: true, upsert: true }
        );
        results.push(metric);
    }

    res.json({ status: 'success', count: results.length });
}));

// Rescue
router.post('/rescue', asyncHandler(async (req, res) => {
    const { rescuerId, rescueeId, stopCount } = req.body;

    const today = new Date();
    const startOfDay = new Date(today.setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setUTCHours(23, 59, 59, 999));

    // Find Routes for today
    const [rescuerRoute, rescueeRoute] = await Promise.all([
        Route.findOne({ driverId: rescuerId, date: { $gte: startOfDay, $lte: endOfDay } }),
        Route.findOne({ driverId: rescueeId, date: { $gte: startOfDay, $lte: endOfDay } })
    ]);

    if (!rescuerRoute || !rescueeRoute) {
        res.status(404);
        throw new Error('Active routes not found for one or both drivers');
    }

    // Update Metrics
    const [rescuerMetric, rescueeMetric] = await Promise.all([
        RouteMetric.findOne({ routeId: rescuerRoute._id }),
        RouteMetric.findOne({ routeId: rescueeRoute._id })
    ]);

    if (!rescuerMetric || !rescueeMetric) {
        res.status(404);
        throw new Error('Metrics not found for active routes');
    }

    // Update logs
    rescuerMetric.rescueLog.push({
        type: 'GAVE', // Rescuer GAVE help? No, Rescuer RECEIVED stops? 
        // Usually "Rescue" means A takes stops from B.
        // A is Rescuer. B is Rescuee.
        // A "Gives" a rescue? Or "Receives" stops?
        // Let's stick to: Rescuer performed a rescue.
        // If I am the Rescuer, I did the work.
        // If I am the Rescuee, I was helped.
        // Let's use 'GAVE' for "Gave Help" (Rescuer) and 'RECEIVED' for "Received Help" (Rescuee).
        type: 'GAVE',
        count: parseInt(stopCount),
        otherDriverId: rescueeRoute.driverId
    });

    rescueeMetric.rescueLog.push({
        type: 'RECEIVED',
        count: parseInt(stopCount),
        otherDriverId: rescuerRoute.driverId
    });

    await Promise.all([rescuerMetric.save(), rescueeMetric.save()]);

    res.json({ message: 'Rescue recorded successfully' });
}));

module.exports = router;
