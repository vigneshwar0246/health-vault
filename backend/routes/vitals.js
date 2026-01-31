const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const VitalReading = require('../models/VitalReading');
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

// Get vitals for a member
router.get('/:memberId', auth, async (req, res) => {
  try {
    const vitals = await VitalReading.find({ memberId: req.params.memberId })
      .sort({ recordedAt: -1 });
    res.json(vitals.map(v => ({ ...v.toObject(), id: v._id })));
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create vital reading
router.post('/', auth, [
  body('memberId').isMongoId(),
  body('type').isIn(['blood_pressure', 'heart_rate', 'temperature', 'weight', 'blood_sugar', 'oxygen_saturation', 'bmi', 'cholesterol', 'custom']),
  body('value').isNumeric(),
  body('unit').trim().isLength({ min: 1 })
], async (req, res) => {
  console.log('POST /vitals called with body:', req.body);
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const vital = new VitalReading(req.body);
    await vital.save();
    console.log('Vital saved:', vital);

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'create',
      entityType: 'vital',
      entityId: vital._id.toString(),
      description: `Recorded ${vital.type} reading`
    });

    res.status(201).json({ ...vital.toObject(), id: vital._id });
  } catch (error) {
    console.error('Error saving vital:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update vital reading
router.put('/:id', auth, async (req, res) => {
  try {
    const vital = await VitalReading.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!vital) {
      return res.status(404).json({ error: 'Vital reading not found' });
    }

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'update',
      entityType: 'vital',
      entityId: vital._id.toString(),
      description: `Updated ${vital.type} reading`
    });

    res.json({ ...vital.toObject(), id: vital._id });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete vital reading
router.delete('/:id', auth, async (req, res) => {
  try {
    const vital = await VitalReading.findById(req.params.id);

    if (!vital) {
      return res.status(404).json({ error: 'Vital reading not found' });
    }

    await VitalReading.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'delete',
      entityType: 'vital',
      entityId: vital._id.toString(),
      description: `Deleted ${vital.type} reading`
    });

    res.json({ message: 'Vital reading deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;