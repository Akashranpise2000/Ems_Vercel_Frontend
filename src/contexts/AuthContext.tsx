import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'employee';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error?: string }>;
  signOut: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// API base URL
const API_BASE_URL = 'http://localhost:5001/api/auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-login disabled - users must login manually each time
  useEffect(() => {
    // Clear any stored user data to force login
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    setUser(null);

    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors with detailed messages
        let errorMessage = data.error || 'Login failed';
        if (data.details && Array.isArray(data.details)) {
          errorMessage = data.details.map((detail: any) => detail.msg || detail.message).join(', ');
        }
        return { error: errorMessage };
      }

      setUser(data.data.user);
      localStorage.setItem('authToken', data.data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.data.user));
      return {};
    } catch (error) {
      console.error('Login error:', error);
      return { error: 'Network error. Please try again.' };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role || 'employee'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors with detailed messages
        let errorMessage = data.error || 'Signup failed';
        if (data.details && Array.isArray(data.details)) {
          errorMessage = data.details.map((detail: any) => detail.msg || detail.message).join(', ');
        }
        return { error: errorMessage };
      }

      // After successful signup, do not log the user in automatically
      // Just return success, user will need to login manually
      return {};
    } catch (error) {
      console.error('Signup error:', error);
      return { error: 'Network error. Please try again.' };
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};