const mongoose = require('mongoose');

const medicalReportSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['lab', 'imaging', 'prescription', 'discharge', 'other'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  notes: String,
  parsedData: mongoose.Schema.Types.Mixed,
  originalText: String,
  // translations: { "ta": { text: String, parsedData: Mixed, translatedAt: Date } }
  translations: mongoose.Schema.Types.Mixed,
  tags: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MedicalReport', medicalReportSchema);