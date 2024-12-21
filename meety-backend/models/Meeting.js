const mongoose = require('mongoose');
const crypto = require('crypto');

const timeSlotSchema = new mongoose.Schema({
  start: {
    type: String,
    required: true
  },
  end: {
    type: String,
    required: true
  }
});

const bookedSlotSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'missed'],
    default: 'pending'
  }
});

const dayAvailabilitySchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: false
  },
  timeSlots: {
    type: [timeSlotSchema],
    default: () => [{
      start: '09:00',
      end: '17:00'
    }]
  }
});

const availabilitySchema = new mongoose.Schema({
  sunday: {
    type: dayAvailabilitySchema,
    default: () => ({
      enabled: false,
      timeSlots: [{
        start: '09:00',
        end: '17:00'
      }]
    })
  },
  monday: {
    type: dayAvailabilitySchema,
    default: () => ({
      enabled: false,
      timeSlots: [{
        start: '09:00',
        end: '17:00'
      }]
    })
  },
  tuesday: {
    type: dayAvailabilitySchema,
    default: () => ({
      enabled: false,
      timeSlots: [{
        start: '09:00',
        end: '17:00'
      }]
    })
  },
  wednesday: {
    type: dayAvailabilitySchema,
    default: () => ({
      enabled: false,
      timeSlots: [{
        start: '09:00',
        end: '17:00'
      }]
    })
  },
  thursday: {
    type: dayAvailabilitySchema,
    default: () => ({
      enabled: false,
      timeSlots: [{
        start: '09:00',
        end: '17:00'
      }]
    })
  },
  friday: {
    type: dayAvailabilitySchema,
    default: () => ({
      enabled: false,
      timeSlots: [{
        start: '09:00',
        end: '17:00'
      }]
    })
  },
  saturday: {
    type: dayAvailabilitySchema,
    default: () => ({
      enabled: false,
      timeSlots: [{
        start: '09:00',
        end: '17:00'
      }]
    })
  }
});

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required']
  },
  description: {
    type: String
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [15, 'Duration must be at least 15 minutes'],
    max: [180, 'Duration cannot exceed 180 minutes']
  },
  type: {
    type: String,
    enum: ['video', 'phone', 'in-person'],
    default: 'video'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  },
  bookedSlots: {
    type: [bookedSlotSchema],
    default: () => []
  },
  availability: {
    type: availabilitySchema,
    required: true,
    default: () => ({
      sunday: { enabled: false, timeSlots: [{ start: '09:00', end: '17:00' }] },
      monday: { enabled: false, timeSlots: [{ start: '09:00', end: '17:00' }] },
      tuesday: { enabled: false, timeSlots: [{ start: '09:00', end: '17:00' }] },
      wednesday: { enabled: false, timeSlots: [{ start: '09:00', end: '17:00' }] },
      thursday: { enabled: false, timeSlots: [{ start: '09:00', end: '17:00' }] },
      friday: { enabled: false, timeSlots: [{ start: '09:00', end: '17:00' }] },
      saturday: { enabled: false, timeSlots: [{ start: '09:00', end: '17:00' }] }
    })
  },
  shareableLink: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(16).toString('hex')
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      if (ret.userId) {
        ret.userId = ret.userId.toString();
      }
      if (ret.bookedSlots) {
        ret.bookedSlots = ret.bookedSlots.map(slot => ({
          ...slot,
          participant: slot.participant ? {
            _id: slot.participant._id?.toString(),
            fullName: slot.participant.fullName,
            email: slot.participant.email,
            phone: slot.participant.phone
          } : slot.participant
        }));
      }
      return ret;
    }
  }
});

// Add indexes for efficient queries
meetingSchema.index({ userId: 1, status: 1 });
meetingSchema.index({ 'bookedSlots.date': 1 });
meetingSchema.index({ 'bookedSlots.status': 1 });

const Meeting = mongoose.model('Meeting', meetingSchema);

module.exports = Meeting;
