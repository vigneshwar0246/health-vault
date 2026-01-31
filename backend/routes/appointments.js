const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const ActivityLog = require('../models/ActivityLog');

const router = express.Router();

// Middleware to verify token
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get appointments for a member
router.get('/:memberId', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ memberId: req.params.memberId })
      .sort({ dateTime: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create appointment
router.post('/', auth, [
  body('memberId').isMongoId(),
  body('doctorName').trim().isLength({ min: 1 }),
  body('dateTime').isISO8601(),
  body('duration').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const appointment = new Appointment(req.body);
    await appointment.save();

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'create',
      entityType: 'appointment',
      entityId: appointment._id.toString(),
      description: `Scheduled appointment with ${appointment.doctorName}`
    });

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update appointment
router.put('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'update',
      entityType: 'appointment',
      entityId: appointment._id.toString(),
      description: `Updated appointment with ${appointment.doctorName}`
    });

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete appointment
router.delete('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    await Appointment.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'delete',
      entityType: 'appointment',
      entityId: appointment._id.toString(),
      description: `Cancelled appointment with ${appointment.doctorName}`
    });

    res.json({ message: 'Appointment deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;