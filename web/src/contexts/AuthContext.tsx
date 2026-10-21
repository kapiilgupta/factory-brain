'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'viewer';
  company: {
    name: string;
    industry: string;
    numMachines: number;
    productionType: string;
  };
  isVerified: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: {
    username: string;
    email: string;
    password: string;
    companyName: string;
  }) => Promise<{ requiresOtp: boolean; email: string }>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user session on initial application mount
  const refreshUser = async () => {
    try {
      const data = await apiRequest<{ success: boolean; user: UserProfile }>('/api/auth/me');
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (identifier: string, password: string) => {
    const data = await apiRequest<{ success: boolean; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      data: { identifier, password },
    });

    if (data.success && data.user) {
      setUser(data.user);
      router.push('/dashboard');
    }
  };

  const register = async (payload: {
    username: string;
    email: string;
    password: string;
    companyName: string;
  }) => {
    const data = await apiRequest<{ success: boolean; message: string }>('/api/auth/register', {
      method: 'POST',
      data: {
        username: payload.username,
        email: payload.email,
        password: payload.password,
        company: {
          name: payload.companyName,
        },
      },
    });

    return { requiresOtp: true, email: payload.email };
  };

  const verifyOtp = async (email: string, otp: string) => {
    const data = await apiRequest<{ success: boolean; user: UserProfile }>('/api/auth/verify-otp', {
      method: 'POST',
      data: { email, otp },
    });

    if (data.success && data.user) {
      setUser(data.user);
      router.push('/dashboard');
    }
  };

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyOtp,
        logout,
        refreshUser,
      }}
    >
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
