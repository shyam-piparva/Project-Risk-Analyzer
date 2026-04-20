/**
 * Authentication Context
 * Provides global authentication state and methods
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token storage keys
const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Set up automatic token refresh
  useEffect(() => {
    if (!token) return;

    // Refresh token every 14 minutes (tokens expire in 15 minutes)
    const refreshInterval = setInterval(() => {
      refreshToken().catch((error) => {
        console.error('Token refresh failed:', error);
        logout();
      });
    }, 14 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [token]);

  // Clear auth data from state and localStorage
  const clearAuthData = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  // Store auth data in state and localStorage
  const storeAuthData = (authResponse: AuthResponse) => {
    setToken(authResponse.tokens.accessToken);
    setUser(authResponse.user);
    localStorage.setItem(TOKEN_KEY, authResponse.tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, authResponse.tokens.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(authResponse.user));
  };

  // Login method
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await apiService.post<AuthResponse>('/auth/login', {
        email,
        password,
      });
      storeAuthData(response);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Register method
  const register = async (name: string, email: string, password: string): Promise<void> => {
    try {
      const response = await apiService.post<AuthResponse>('/auth/register', {
        name,
        email,
        password,
      });
      storeAuthData(response);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  // Logout method
  const logout = () => {
    clearAuthData();
  };

  // Refresh token method
  const refreshToken = async (): Promise<void> => {
    try {
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiService.post<{ accessToken: string }>('/auth/refresh', {
        refreshToken: storedRefreshToken,
      });
      
      // Update only the access token
      setToken(response.accessToken);
      localStorage.setItem(TOKEN_KEY, response.accessToken);
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuthData();
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
