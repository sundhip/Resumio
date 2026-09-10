import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Role, User, CandidateProfile, RecruiterProfile } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  profile: CandidateProfile | RecruiterProfile | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  registerCandidate: (data: { fullName: string; email: string; password: string; confirmPassword: string }) => Promise<void>;
  registerRecruiter: (data: { fullName: string; email: string; companyName: string; password: string; confirmPassword: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUserContext: (updates: Partial<User>) => void;
  updateProfileContext: (profile: CandidateProfile | RecruiterProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CandidateProfile | RecruiterProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('resumio_token');
    if (!token) {
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        setProfile(res.profile || null);
      } else {
        localStorage.removeItem('resumio_token');
        setUser(null);
        setProfile(null);
      }
    } catch {
      localStorage.removeItem('resumio_token');
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res.token && res.user) {
        localStorage.setItem('resumio_token', res.token);
        setUser(res.user);
        setProfile(res.profile || null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.adminLogin({ email, password });
      if (res.token && res.user) {
        localStorage.setItem('resumio_token', res.token);
        setUser(res.user);
        setProfile(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const registerCandidate = async (data: { fullName: string; email: string; password: string; confirmPassword: string }) => {
    setIsLoading(true);
    try {
      const res = await api.registerCandidate(data);
      if (res.token && res.user) {
        localStorage.setItem('resumio_token', res.token);
        setUser(res.user);
        setProfile(res.profile || null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const registerRecruiter = async (data: { fullName: string; email: string; companyName: string; password: string; confirmPassword: string }) => {
    setIsLoading(true);
    try {
      const res = await api.registerRecruiter(data);
      if (res.token && res.user) {
        localStorage.setItem('resumio_token', res.token);
        setUser(res.user);
        setProfile(res.profile || null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('resumio_token');
    setUser(null);
    setProfile(null);
  };

  const updateUserContext = (updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const updateProfileContext = (newProfile: CandidateProfile | RecruiterProfile) => {
    setProfile(newProfile);
    if ('profile_completion' in newProfile) {
      setUser((prev) => (prev ? { ...prev, profileCompletion: newProfile.profile_completion } : null));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        adminLogin,
        registerCandidate,
        registerRecruiter,
        logout,
        refreshUser,
        updateUserContext,
        updateProfileContext,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
