const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const EmployeeTraining = require('../models/EmployeeTraining');
const ItemPreference = require('../models/ItemPreference');
const asyncHandler = require('../utils/asyncHandler');

// Get all employees
router.get('/', asyncHandler(async (req, res) => {
    const employees = await Employee.find().populate('userId', 'name email');
    res.json(employees);
}));

// Get single employee
router.get('/:id', asyncHandler(async (req, res) => {
    const employee = await Employee.findById(req.params.id).populate('userId', 'name email');
    if (!employee) {
        res.status(404);
        throw new Error('Employee not found');
    }
    res.json(employee);
}));

// Create employee
router.post('/', asyncHandler(async (req, res) => {
    const employee = await Employee.create(req.body);
    res.status(201).json(employee);
}));

// Update priorities
router.put('/priority', asyncHandler(async (req, res) => {
    const updates = req.body;
    const operations = updates.map(u => ({
        updateOne: {
            filter: { _id: u._id },
            update: { priority: u.priority }
        }
    }));
    await Employee.bulkWrite(operations);
    res.json({ message: 'Priorities updated' });
}));

// Update employee
router.put('/:id', asyncHandler(async (req, res) => {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!employee) {
        res.status(404);
        throw new Error('Employee not found');
    }
    res.json(employee);
}));

// Delete employee
router.delete('/:id', asyncHandler(async (req, res) => {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
        res.status(404);
        throw new Error('Employee not found');
    }
    res.json({ message: 'Employee removed' });
}));

// Get employee training
router.get('/:id/training', asyncHandler(async (req, res) => {
    const training = await EmployeeTraining.find({ employeeId: req.params.id });
    res.json(training);
}));

// Add employee training
router.post('/:id/training', asyncHandler(async (req, res) => {
    const training = await EmployeeTraining.create({ ...req.body, employeeId: req.params.id });
    res.status(201).json(training);
}));

// Get employee preferences
router.get('/:id/preferences', asyncHandler(async (req, res) => {
    const itemPrefs = await ItemPreference.find({ employees: req.params.id })
        .populate('pref');

    const preferences = {
        preferredVans: [],
        preferredEquipment: [],
        preferredServiceTypes: []
    };

    itemPrefs.forEach(p => {
        if (p.onModel === 'Van') preferences.preferredVans.push(p.pref);
        if (p.onModel === 'Equipment') preferences.preferredEquipment.push(p.pref);
        if (p.onModel === 'ServiceType') preferences.preferredServiceTypes.push(p.pref);
    });

    res.json(preferences);
}));

// Update employee preferences
router.put('/:id/preferences', asyncHandler(async (req, res) => {
    const { preferredVans, preferredEquipment, preferredServiceTypes } = req.body;
    const employeeId = req.params.id;

    const updateTypePreferences = async (newIds, type) => {
        if (!newIds) return;

        // 1. Remove employee from all items of this type NOT in newIds
        const currentPrefs = await ItemPreference.find({
            onModel: type,
            employees: employeeId
        });

        for (const doc of currentPrefs) {
            const prefId = doc.pref.toString();
            if (!newIds.includes(prefId)) {
                doc.employees = doc.employees.filter(e => e.toString() !== employeeId);
                await doc.save();
            }
        }

        // 2. Add employee to all items in newIds
        for (const id of newIds) {
            let doc = await ItemPreference.findOne({ pref: id, onModel: type });
            if (!doc) {
                doc = await ItemPreference.create({
                    pref: id,
                    onModel: type,
                    employees: [employeeId]
                });
            } else {
                if (!doc.employees.map(e => e.toString()).includes(employeeId)) {
                    doc.employees.push(employeeId);
                    await doc.save();
                }
            }
        }
    };

    await updateTypePreferences(preferredVans, 'Van');
    await updateTypePreferences(preferredEquipment, 'Equipment');
    await updateTypePreferences(preferredServiceTypes, 'ServiceType');

    // Return updated structure
    const itemPrefs = await ItemPreference.find({ employees: employeeId }).populate('pref');
    const preferences = {
        preferredVans: [],
        preferredEquipment: [],
        preferredServiceTypes: []
    };
    itemPrefs.forEach(p => {
        if (p.onModel === 'Van') preferences.preferredVans.push(p.pref);
        if (p.onModel === 'Equipment') preferences.preferredEquipment.push(p.pref);
        if (p.onModel === 'ServiceType') preferences.preferredServiceTypes.push(p.pref);
    });

    res.json(preferences);
}));

module.exports = router;
