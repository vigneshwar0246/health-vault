const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Symptom = require('../models/Symptom');
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

// Get symptoms for a member
router.get('/:memberId', auth, async (req, res) => {
  try {
    const symptoms = await Symptom.find({ memberId: req.params.memberId })
      .sort({ recordedAt: -1 });
    res.json(symptoms);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create symptom
router.post('/', auth, [
  body('memberId').isMongoId(),
  body('name').trim().isLength({ min: 1 }),
  body('severity').isInt({ min: 1, max: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const symptom = new Symptom(req.body);
    await symptom.save();

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'create',
      entityType: 'symptom',
      entityId: symptom._id.toString(),
      description: `Recorded symptom: ${symptom.name}`
    });

    res.status(201).json(symptom);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update symptom
router.put('/:id', auth, async (req, res) => {
  try {
    const symptom = await Symptom.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!symptom) {
      return res.status(404).json({ error: 'Symptom not found' });
    }

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'update',
      entityType: 'symptom',
      entityId: symptom._id.toString(),
      description: `Updated symptom: ${symptom.name}`
    });

    res.json(symptom);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete symptom
router.delete('/:id', auth, async (req, res) => {
  try {
    const symptom = await Symptom.findById(req.params.id);

    if (!symptom) {
      return res.status(404).json({ error: 'Symptom not found' });
    }

    await Symptom.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'delete',
      entityType: 'symptom',
      entityId: symptom._id.toString(),
      description: `Removed symptom: ${symptom.name}`
    });

    res.json({ message: 'Symptom deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;