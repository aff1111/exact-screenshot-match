/**
 * Authentication Context
 * Manages user authentication state across the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthUser } from '@/types';
import { AuthService } from '@/services/api';
import { Logger } from '@/lib/errors';

interface AuthContextType {
  user: User | null;
  authUser: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateSecurityQuestions: (questions: Array<{ question: string; answer: string }>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);

        // Get auth session for authUser
        const {
          data: { user: authUserData },
        } = await require('@/services/api').supabase.auth.getUser();
        setAuthUser(authUserData);
      } catch (error) {
        Logger.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user: newUser } = await AuthService.signUp(email, password);
      setUser(newUser);
      Logger.info('User signed up successfully', { email });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user: signedInUser } = await AuthService.signIn(email, password);
      setUser(signedInUser);
      try {
        // Ensure auth session/user is available in client
        const { data: { user: authUserData } } = await require('@/services/api').supabase.auth.getUser();
        setAuthUser(authUserData);
      } catch (e) {
        Logger.warn('Could not retrieve auth user after signIn', { error: e });
      }
      Logger.info('User signed in successfully', { email });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await AuthService.signOut();
      setUser(null);
      setAuthUser(null);
      Logger.info('User signed out successfully');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSecurityQuestions = useCallback(
    async (questions: Array<{ question: string; answer: string }>) => {
      if (!user) return;
      setIsLoading(true);
      try {
        await AuthService.updateSecurityQuestions(user.id, questions);
        Logger.info('Security questions updated');
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const value: AuthContextType = {
    user,
    authUser,
    isLoading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    updateSecurityQuestions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
