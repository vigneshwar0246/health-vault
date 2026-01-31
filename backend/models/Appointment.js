const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
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
  location: String,
  dateTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  notes: String,
  reminderMinutes: {
    type: Number,
    default: 15
  },
  status: {
    type: String,
    enum: ['upcoming', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  relatedReportIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalReport'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Appointment', appointmentSchema);