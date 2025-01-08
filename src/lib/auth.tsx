// lib/auth.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useGoogleLogin } from '@react-oauth/google';
import { User } from '../types/user';
import { login as apiLogin, getCurrentUser, googleLogin } from '../services/api';
import { encryptData } from '../utils/encryption';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  googleSignIn: () => Promise<void>;
  logout: () => void;
  loading: boolean;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => { },
  googleSignIn: async () => { },
  logout: () => { },
  loading: true,
  updateUser: () => { },
});

const publicPaths = ['/', '/book', '/book/[typeId]', '/otpVerification'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (storedToken) {
        console.log('Found stored token:', storedToken);
        setToken(storedToken);
        try {
          const response = await getCurrentUser();
          console.log('Got current user:', response.user);
          setUser(response.user);
          return true;
        } catch (error) {
          console.error('Error getting current user:', error);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
          }
          setToken(null);
          setUser(null);
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking auth:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const isAuthenticated = await checkAuth();
        const isPublicPath = publicPaths.some(path => {
          if (path.includes('[') && path.includes(']')) {
            const pathPattern = path.replace(/\[.*?\]/g, '[^/]+');
            const regex = new RegExp(`^${pathPattern}$`);
            return regex.test(router.pathname);
          }
          return path === router.pathname;
        });

        if (!isAuthenticated && !isPublicPath) {
          router.replace('/');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
    };

    initAuth();
  }, [router.pathname]);

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login with:', email);
      const response = await apiLogin(email, password);
      console.log('Login response in auth.js:', response);
      console.log('response?.needsVerification:', );

      // Check if email needs verification
      if (response?.needsVerification) {
        const encryptedUserId = encryptData(response.userId);
        await router.push(`/otpVerification?uid=${encryptedUserId}`);
        return;
      }

      const { token: newToken, user: newUser } = response;

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', newToken);
      }
      setToken(newToken);
      setUser(newUser);

      console.log('Login successful, redirecting to dashboard');
      await router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Initialize the Google login hook
  const googleLoginMutation = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        // Get ID token
        const tokens = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            code: codeResponse.code,
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
            client_secret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!,
            redirect_uri: 'postmessage',
            grant_type: 'authorization_code',
          }),
        }).then(res => res.json());

        console.log('Google tokens:', tokens);

        // Send ID token to your backend
        const { token, user: newUser } = await googleLogin(tokens.id_token);

        localStorage.setItem('token', token);
        setToken(token);
        setUser(newUser);
        await router.push('/dashboard');
      } catch (error) {
        console.error('Error in Google sign-in:', error);
        throw error;
      }
    },
    flow: 'auth-code',
  });

  const googleSignIn = async () => {
    try {
      await googleLoginMutation();
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setToken(null);
    setUser(null);
    router.push('/');
  };

  const updateUser = (updatedUser: User) => {
    console.log('Updating user in context:', updatedUser);
    setUser(updatedUser);
  };

  const value = {
    user,
    token,
    login,
    googleSignIn,
    logout,
    loading,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function WithAuthComponent(props: P) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        const isPublicPath = publicPaths.some(path => {
          if (path.includes('[') && path.includes(']')) {
            const pathPattern = path.replace(/\[.*?\]/g, '[^/]+');
            const regex = new RegExp(`^${pathPattern}$`);
            return regex.test(router.pathname);
          }
          return path === router.pathname;
        });

        if (!user && !isPublicPath) {
          console.log('No user found, redirecting to login');
          router.replace('/');
        }
      }
    }, [user, loading, router]);

    if (loading) {
      return (
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-2xl font-semibold text-blue-600">טוען...</div>
        </div>
      );
    }

    const isPublicPath = publicPaths.some(path => {
      if (path.includes('[') && path.includes(']')) {
        const pathPattern = path.replace(/\[.*?\]/g, '[^/]+');
        const regex = new RegExp(`^${pathPattern}$`);
        return regex.test(router.pathname);
      }
      return path === router.pathname;
    });

    if (!user && !isPublicPath) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}