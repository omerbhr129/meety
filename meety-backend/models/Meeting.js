const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    },
    notified: {
      type: Boolean,
      default: false
    }
  }],
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['virtual', 'physical', 'phone'],
    required: true
  },
  location: {
    type: String,
    required: function() {
      return this.type === 'physical';
    }
  },
  meetingLink: {
    type: String,
    required: function() {
      return this.type === 'virtual';
    }
  },
  status: {
    type: String,
    enum: ['scheduled', 'cancelled', 'completed'],
    default: 'scheduled'
  },
  reminders: [{
    time: Date,
    sent: {
      type: Boolean,
      default: false
    }
  }],
  notes: {
    type: String,
    trim: true
  },
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// מידלוור לעדכון תאריך העדכון
meetingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// וירטואל לחישוב משך הפגישה
meetingSchema.virtual('duration').get(function() {
  return (this.endTime - this.startTime) / (1000 * 60); // בדקות
});

// אינדקסים
meetingSchema.index({ organizer: 1, startTime: -1 });
meetingSchema.index({ participants: 1 });
meetingSchema.index({ status: 1 });

const Meeting = mongoose.model('Meeting', meetingSchema);

module.exports = Meeting;