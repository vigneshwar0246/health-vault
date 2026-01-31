const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Medication = require('../models/Medication');
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

// Get medications for a member
router.get('/:memberId', auth, async (req, res) => {
  try {
    const medications = await Medication.find({ memberId: req.params.memberId })
      .sort({ startDate: -1 });
    res.json(medications);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create medication
router.post('/', auth, [
  body('memberId').isMongoId(),
  body('name').trim().isLength({ min: 1 }),
  body('dosage').trim().isLength({ min: 1 }),
  body('frequency').trim().isLength({ min: 1 }),
  body('startDate').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const medication = new Medication(req.body);
    await medication.save();

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'create',
      entityType: 'medication',
      entityId: medication._id.toString(),
      description: `Added medication: ${medication.name}`
    });

    res.status(201).json(medication);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update medication
router.put('/:id', auth, async (req, res) => {
  try {
    const medication = await Medication.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'update',
      entityType: 'medication',
      entityId: medication._id.toString(),
      description: `Updated medication: ${medication.name}`
    });

    res.json(medication);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete medication
router.delete('/:id', auth, async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);

    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    await Medication.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'delete',
      entityType: 'medication',
      entityId: medication._id.toString(),
      description: `Removed medication: ${medication.name}`
    });

    res.json({ message: 'Medication deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;