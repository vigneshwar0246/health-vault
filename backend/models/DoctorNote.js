const mongoose = require('mongoose');

const doctorNoteSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember',
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  specialty: String,
  date: {
    type: Date,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  prescriptions: [{
    type: String
  }],
  followUpDate: Date,
  attachments: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DoctorNote', doctorNoteSchema);