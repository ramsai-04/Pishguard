import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('phishguard_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (!apiBaseUrl) {
        throw new Error('API base URL is not configured');
      }

      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(err?.message || 'Login failed');
      }

      const data = await response.json() as {
        user?: { id: string; name: string; email: string; createdAt: string };
        token?: string;
      };

      if (!data.user) {
        throw new Error('Invalid login response from server');
      }

      const userData: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        createdAt: new Date(data.user.createdAt),
      };

      setUser(userData);
      localStorage.setItem('phishguard_user', JSON.stringify(userData));
      if (data.token) {
        localStorage.setItem('phishguard_token', data.token);
      }
      window.dispatchEvent(new Event('auth-changed'));
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (!apiBaseUrl) {
        throw new Error('API base URL is not configured');
      }

      const response = await fetch(`${apiBaseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(err?.message || 'Registration failed');
      }

      const data = await response.json() as {
        user?: { id: string; name: string; email: string; createdAt: string };
        token?: string;
      };

      if (!data.user) {
        throw new Error('Invalid registration response from server');
      }

      const userData: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        createdAt: new Date(data.user.createdAt),
      };

      setUser(userData);
      localStorage.setItem('phishguard_user', JSON.stringify(userData));
      if (data.token) {
        localStorage.setItem('phishguard_token', data.token);
      }
      window.dispatchEvent(new Event('auth-changed'));
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('phishguard_user');
    localStorage.removeItem('phishguard_token');
    window.dispatchEvent(new Event('auth-changed'));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
