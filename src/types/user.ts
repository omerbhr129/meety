import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface UserType {
  email: string;
  password: string;
  fullName: string;
  profileImage?: string;
  lastLogin?: Date;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

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
  meetings?: Meeting[]; // הוספת מאפיין meetings
}

interface UserDocument extends Document, UserType {}

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

const User = mongoose.model<UserDocument>('User', userSchema);

// ייצוא המודל וייצוא הטיפוס
export default User;
