const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSettingsSchema = new mongoose.Schema({
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  language: {
    type: String,
    enum: ['he', 'en'],
    default: 'he'
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    }
  },
  timezone: {
    type: String,
    default: 'Asia/Jerusalem'
  }
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId;
    },
    minlength: 6
  },
  googleId: String,
  name: {
    type: String,
    required: true,
    trim: true
  },
  profileImage: {
    type: String,
    default: '/images/default-avatar.png'
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return /^(\+?\d{1,3}[- ]?)?\d{10}$/.test(v);
      },
      message: 'מספר טלפון לא תקין'
    }
  },
  company: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    maxlength: 500
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  settings: {
    type: userSettingsSchema,
    default: () => ({})
  },
  lastLogin: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  verificationToken: String,
  meetings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  }
});

// מידלוור לעדכון תאריך העדכון האחרון
userSchema.pre('save', async function(next) {
  this.updatedAt = new Date();
  
  if (this.isModified('password') && this.password) {
    try {
      this.password = await bcrypt.hash(this.password, 10);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// מתודה להשוואת סיסמאות
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// מתודה ליצירת טוקן לאיפוס סיסמה
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpires = Date.now() + 3600000; // תוקף של שעה
  return resetToken;
};

// וירטואל לקבלת שם מלא
userSchema.virtual('fullName').get(function() {
  return this.name || this.email.split('@')[0];
});

// הגדרת אינדקסים
userSchema.index({ email: 1, googleId: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);

module.exports = User;