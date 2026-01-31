const mongoose = require('mongoose');

const llmJobSchema = new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalReport', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'processing', 'done', 'failed'], default: 'pending' },
  resultReportId: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalReport' },
  error: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

llmJobSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('LLMJob', llmJobSchema);
