const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  relationship: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  }
});

const familyMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  bloodGroup: {
    type: String,
    required: true
  },
  allergies: [{
    type: String
  }],
  chronicConditions: [{
    type: String
  }],
  emergencyContacts: [emergencyContactSchema],
  avatarUrl: String,
  isDefault: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('FamilyMember', familyMemberSchema);