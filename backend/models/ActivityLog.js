const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['view', 'create', 'update', 'delete', 'export', 'share'],
    required: true
  },
  entityType: {
    type: String,
    enum: ['vital', 'report', 'note', 'appointment', 'medication', 'symptom', 'member', 'settings'],
    required: true
  },
  entityId: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);