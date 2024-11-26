import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// הגדרת טיפוסים
export interface Meeting {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  participants?: string[];
}

export interface UserType {
  email: string;
  password: string;
  fullName: string;
  profileImage?: string;
  lastLogin?: Date;
  createdAt: Date;
  meetings?: Meeting[];
}

interface UserDocument extends Document, UserType {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// סכמת המשתמש
const userSchema = new Schema<UserDocument>({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  profileImage: {
    type: String,
    default: '/default-avatar.png',
  },
  lastLogin: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  meetings: [
    {
      id: { type: String, required: true },
      title: { type: String, required: true },
      startTime: { type: Date, required: true },
      endTime: { type: Date, required: true },
      description: String,
      participants: [String],
    },
  ],
});

// Middleware להצפנת סיסמה לפני שמירת משתמש
userSchema.pre<UserDocument>('save', async function (next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// מתודה להשוואת סיסמאות
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// ייצוא המודל
const User = mongoose.model<UserDocument>('User', userSchema);
export default User;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  fullName: string;
}

export interface AuthResponse {
  token: string;
  user: UserType;
}

// טיפוסים קיימים
export interface Meeting {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  participants?: string[];
}

export interface UserType {
  email: string;
  password: string;
  fullName: string;
  profileImage?: string;
  lastLogin?: Date;
  createdAt: Date;
  meetings?: Meeting[];
}
