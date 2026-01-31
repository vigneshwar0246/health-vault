import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/types/health';
import { authAPI, familyAPI, ApiError } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Verify token with backend
      authAPI.getCurrentUser()
        .then(userData => {
          setUser(userData);
        })
        .catch(() => {
          // Token invalid, remove it
          localStorage.removeItem('auth_token');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authAPI.login(email, password);
      localStorage.setItem('auth_token', response.token);
      setUser(response.user);
      return { success: true };
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Login failed' };
    }
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authAPI.register(email, password, name);
      localStorage.setItem('auth_token', response.token);
      setUser(response.user);
      
      // Create default family member (self)
      try {
        await familyAPI.createMember({
          name,
          dateOfBirth: '',
          gender: 'other',
          bloodGroup: '',
          allergies: [],
          chronicConditions: [],
          emergencyContacts: [],
          isDefault: true, // This will be the first member, so make it default
        });
        // Wait a bit for the backend to process
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (familyError) {
        console.error('Failed to create default family member:', familyError);
        // Don't fail registration if family member creation fails
      }
      
      return { success: true };
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Registration failed' };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('auth_token');
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) return;

    try {
      const updatedUser = await authAPI.updateProfile(updates);
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error; // Re-throw so the UI can handle it
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile }}>
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
