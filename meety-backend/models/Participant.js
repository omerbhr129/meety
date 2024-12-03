const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot be more than 50 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        // Remove any non-digit characters and check length
        const digits = v.replace(/\D/g, '');
        return digits.length >= 9 && digits.length <= 15;
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  meetings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting'
  }],
  lastMeeting: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret._id = ret._id.toString();  // Convert ObjectId to string
      if (ret.meetings && Array.isArray(ret.meetings)) {
        ret.meetings = ret.meetings.map(id => id?.toString() || id);  // Convert meeting IDs to strings
      } else {
        ret.meetings = [];  // Ensure meetings is always an array
      }
      delete ret.__v;
      return ret;
    },
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
});

// Indexes for better query performance
participantSchema.index({ email: 1 }, { unique: true });
participantSchema.index({ phone: 1 });
participantSchema.index({ status: 1 });
participantSchema.index({ 'meetings': 1 });

// Pre-save middleware to format phone number
participantSchema.pre('save', function(next) {
  if (this.isModified('phone')) {
    // Remove any non-digit characters
    this.phone = this.phone.replace(/\D/g, '');
    
    // Format phone number with dashes
    if (this.phone.length === 10) {
      this.phone = this.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    } else if (this.phone.length === 9) {
      this.phone = this.phone.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
    }
  }
  next();
});

// Virtual for full name with first letter capitalized
participantSchema.virtual('displayName').get(function() {
  return this.fullName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
});

// Static method to find active participants
participantSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Instance method to soft delete
participantSchema.methods.softDelete = async function() {
  this.status = 'deleted';
  return this.save();
};

// Instance method to check if participant has any upcoming meetings
participantSchema.methods.hasUpcomingMeetings = async function() {
  const Meeting = mongoose.model('Meeting');
  const now = new Date();
  
  const upcomingMeetings = await Meeting.find({
    _id: { $in: this.meetings },
    'bookedSlots': {
      $elemMatch: {
        participant: this._id,
        date: { $gt: now }
      }
    }
  });
  
  return upcomingMeetings.length > 0;
};

// Instance method to get participant's meeting history
participantSchema.methods.getMeetingHistory = async function() {
  const Meeting = mongoose.model('Meeting');
  return Meeting.find({
    _id: { $in: this.meetings }
  }).sort({ date: -1 });
};

const Participant = mongoose.model('Participant', participantSchema);

module.exports = Participant;
