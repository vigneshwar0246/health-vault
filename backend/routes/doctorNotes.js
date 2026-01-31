const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const DoctorNote = require('../models/DoctorNote');
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

// Get doctor notes for a member
router.get('/:memberId', auth, async (req, res) => {
  try {
    const notes = await DoctorNote.find({ memberId: req.params.memberId })
      .sort({ date: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create doctor note
router.post('/', auth, [
  body('memberId').isMongoId(),
  body('doctorName').trim().isLength({ min: 1 }),
  body('date').isISO8601(),
  body('content').trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const note = new DoctorNote(req.body);
    await note.save();

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'create',
      entityType: 'note',
      entityId: note._id.toString(),
      description: `Added doctor note from ${note.doctorName}`
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update doctor note
router.put('/:id', auth, async (req, res) => {
  try {
    const note = await DoctorNote.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({ error: 'Doctor note not found' });
    }

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'update',
      entityType: 'note',
      entityId: note._id.toString(),
      description: `Updated doctor note from ${note.doctorName}`
    });

    res.json(note);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete doctor note
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await DoctorNote.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ error: 'Doctor note not found' });
    }

    await DoctorNote.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'delete',
      entityType: 'note',
      entityId: note._id.toString(),
      description: `Deleted doctor note from ${note.doctorName}`
    });

    res.json({ message: 'Doctor note deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;