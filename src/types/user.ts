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
}

// Type for auth response
export interface AuthResponse {
  token: string;
  user: User;
}
