const mongoose = require('mongoose');

const vitalReadingSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember',
    required: true
  },
  type: {
    type: String,
    enum: ['blood_pressure', 'heart_rate', 'temperature', 'weight', 'blood_sugar', 'oxygen_saturation', 'bmi', 'cholesterol', 'custom'],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  secondaryValue: Number, // For blood pressure (diastolic)
  notes: String,
  recordedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['normal', 'warning', 'critical'],
    default: 'normal'
  }
});

module.exports = mongoose.model('VitalReading', vitalReadingSchema);