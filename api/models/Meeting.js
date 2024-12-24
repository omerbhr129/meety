const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Meeting title is required']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [5, 'Duration must be at least 5 minutes'],
    max: [480, 'Duration cannot exceed 8 hours']
  },
  type: {
    type: String,
    enum: ['video', 'in-person', 'phone'],
    required: [true, 'Meeting type is required']
  },
  availability: {
    type: {
      type: String,
      enum: ['template', 'custom'],
      required: [true, 'Availability type is required']
    },
    workingHours: {
      start: {
        type: String,
        required: [true, 'Working hours start time is required'],
        validate: {
          validator: function(v) {
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: props => `${props.value} is not a valid time format (HH:MM)`
        }
      },
      end: {
        type: String,
        required: [true, 'Working hours end time is required'],
        validate: {
          validator: function(v) {
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: props => `${props.value} is not a valid time format (HH:MM)`
        }
      }
    },
    days: {
      sunday: { type: Boolean, default: false },
      monday: { type: Boolean, default: false },
      tuesday: { type: Boolean, default: false },
      wednesday: { type: Boolean, default: false },
      thursday: { type: Boolean, default: false },
      friday: { type: Boolean, default: false },
      saturday: { type: Boolean, default: false }
    }
  },
  bookedSlots: [{
    date: {
      type: Date,
      required: true
    },
    time: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: props => `${props.value} is not a valid time format (HH:MM)`
      }
    },
    attendee: {
      name: {
        type: String,
        required: true
      },
      email: {
        type: String,
        required: true,
        validate: {
          validator: function(v) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          },
          message: props => `${props.value} is not a valid email address`
        }
      },
      phone: String
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending'
    }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  },
  shareableLink: String
}, {
  timestamps: true
});

// אינדקס משולב על תאריך וזמן לשיפור ביצועים
meetingSchema.index({ 'bookedSlots.date': 1, 'bookedSlots.time': 1 });

// מתודה לבדיקת זמינות - עם אופטימיזציה
meetingSchema.methods.isTimeSlotAvailable = function(date, time) {
  const requestedDate = new Date(date);
  requestedDate.setHours(0, 0, 0, 0); // נורמליזציה של התאריך

  // חיפוש ממוקד עם האינדקס החדש
  return !this.bookedSlots.some(slot => 
    slot.date.getTime() === requestedDate.getTime() &&
    slot.time === time &&
    slot.status !== 'cancelled'
  );
};

// וירטואלים
meetingSchema.virtual('upcomingBookings').get(function() {
  const now = new Date();
  return this.bookedSlots.filter(slot => {
    const bookingDate = new Date(slot.date);
    return bookingDate >= now && slot.status !== 'cancelled';
  });
});

// Pre-save middleware to generate shareableLink
meetingSchema.pre('save', function(next) {
  if (!this.shareableLink) {
    this.shareableLink = `${process.env.FRONTEND_URL}/book/${this._id}`;
  }
  next();
});

module.exports = mongoose.model('Meeting', meetingSchema);
