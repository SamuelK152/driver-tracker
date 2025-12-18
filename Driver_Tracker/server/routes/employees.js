const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const EmployeeTraining = require('../models/EmployeeTraining');
const EmployeePreferences = require('../models/EmployeePreferences');
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
    const preferences = await EmployeePreferences.findOne({ employeeId: req.params.id })
        .populate('preferredVans')
        .populate('preferredEquipment')
        .populate('preferredServiceTypes');
    res.json(preferences || {});
}));

// Update employee preferences
router.put('/:id/preferences', asyncHandler(async (req, res) => {
    const preferences = await EmployeePreferences.findOneAndUpdate(
        { employeeId: req.params.id },
        req.body,
        { new: true, upsert: true }
    );
    res.json(preferences);
}));

module.exports = router;
