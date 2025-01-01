export type NotificationType = 'meeting_created' | 'user_joined' | 'meeting_completed';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
}

export interface User {
  _id: string;
  email: string;
  fullName: string;
  profileImage?: string;
  role?: 'user' | 'admin';
  status?: 'active' | 'inactive' | 'deleted';
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  notificationRead?: boolean;
}

// Type for creating a new user
export interface CreateUserDto {
  email: string;
  password: string;
  fullName: string;
}

// Type for user login
export interface LoginUserDto {
  email: string;
  password: string;
}

// Type for updating user profile
export interface UpdateUserDto {
  fullName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  profileImage?: string | null;
}

// Type for auth response
export interface AuthResponse {
  token: string;
  user: User;
}
