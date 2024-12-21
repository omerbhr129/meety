const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  },
  lastLogin: {
    type: Date,
    default: null
  },
  notificationPreferences: {
    email: {
      enabled: { type: Boolean, default: true },
      newBooking: { type: Boolean, default: true },
      bookingCancellation: { type: Boolean, default: true },
      reminder: { type: Boolean, default: true }
    },
    push: {
      enabled: { type: Boolean, default: true },
      newBooking: { type: Boolean, default: true },
      bookingCancellation: { type: Boolean, default: true },
      reminder: { type: Boolean, default: true }
    }
  },
  timezone: {
    type: String,
    default: 'Asia/Jerusalem'
  },
  language: {
    type: String,
    default: 'he'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// אינדקסים
userSchema.index({ email: 1 }, { unique: true });

// וירטואלים
userSchema.virtual('meetings', {
  ref: 'Meeting',
  localField: '_id',
  foreignField: 'creator'
});

// מתודות
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// הוקים
userSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
