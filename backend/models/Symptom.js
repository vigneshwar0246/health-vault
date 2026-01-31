const mongoose = require('mongoose');

const symptomSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  severity: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  notes: String,
  recordedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Symptom', symptomSchema);