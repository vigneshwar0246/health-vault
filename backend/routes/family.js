const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const FamilyMember = require('../models/FamilyMember');
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

// Get all family members
router.get('/', auth, async (req, res) => {
  try {
    const members = await FamilyMember.find({ userId: req.userId });
    res.json(members.map(m => ({ ...m.toObject(), id: m._id })));
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get family member by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const member = await FamilyMember.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!member) {
      return res.status(404).json({ error: 'Family member not found' });
    }

    res.json({ ...member.toObject(), id: member._id });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create family member
router.post('/', auth, [
  body('name').trim().isLength({ min: 1 }),
  body('dateOfBirth').isISO8601(),
  body('gender').isIn(['male', 'female', 'other']),
  body('bloodGroup').trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const memberData = { ...req.body, userId: req.userId };

    // If this is the first member, make it default
    const existingMembers = await FamilyMember.find({ userId: req.userId });
    if (existingMembers.length === 0) {
      memberData.isDefault = true;
    }

    const member = new FamilyMember(memberData);
    await member.save();

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'create',
      entityType: 'member',
      entityId: member._id.toString(),
      description: `Added family member: ${member.name}`
    });

    res.status(201).json({ ...member.toObject(), id: member._id });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update family member
router.put('/:id', auth, async (req, res) => {
  try {
    const member = await FamilyMember.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!member) {
      return res.status(404).json({ error: 'Family member not found' });
    }

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'update',
      entityType: 'member',
      entityId: member._id.toString(),
      description: `Updated family member profile`
    });

    res.json({ ...member.toObject(), id: member._id });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete family member
router.delete('/:id', auth, async (req, res) => {
  try {
    const member = await FamilyMember.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!member) {
      return res.status(404).json({ error: 'Family member not found' });
    }

    if (member.isDefault) {
      return res.status(400).json({ error: 'Cannot delete default family member' });
    }

    await FamilyMember.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      action: 'delete',
      entityType: 'member',
      entityId: member._id.toString(),
      description: `Removed family member: ${member.name}`
    });

    res.json({ message: 'Family member deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;