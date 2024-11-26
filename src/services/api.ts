import { LoginCredentials, RegisterCredentials, AuthResponse } from '../types/user';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export const api = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'שגיאה בהתחברות');
      }

      return await response.json();
    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'שגיאה בהרשמה');
      }

      return await response.json();
    } catch (error) {
      console.error('Register Error:', error);
      throw error;
    }
  },

  async googleAuth(): Promise<void> {
    try {
      window.location.href = `${API_BASE_URL}/auth/google`;
    } catch (error) {
      console.error('Google Authentication Error:', error);
      throw error;
    }
  }
};
