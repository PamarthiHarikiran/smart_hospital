import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('sh_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('sh_token') || null);
  const [loading, setLoading] = useState(true);

  // Sync / verify current session on mount
  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('sh_token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('sh_user', JSON.stringify(res.data));
          }
        } catch {
          // Token invalid or expired
          localStorage.removeItem('sh_token');
          localStorage.removeItem('sh_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authService.login({ email, password });
      if (res.success && res.token && res.data) {
        localStorage.setItem('sh_token', res.token);
        localStorage.setItem('sh_user', JSON.stringify(res.data));
        setToken(res.token);
        setUser(res.data);
        return { success: true, user: res.data };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await authService.register(userData);
      if (res.success && res.token && res.data) {
        localStorage.setItem('sh_token', res.token);
        localStorage.setItem('sh_user', JSON.stringify(res.data));
        setToken(res.token);
        setUser(res.data);
        return { success: true, user: res.data };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const registerDoctor = async (doctorData) => {
    setLoading(true);
    try {
      const res = await authService.registerDoctor(doctorData);
      if (res.success && res.token && res.data) {
        localStorage.setItem('sh_token', res.token);
        localStorage.setItem('sh_user', JSON.stringify(res.data));
        setToken(res.token);
        setUser(res.data);
        return { success: true, user: res.data };
      }
      return { success: false, message: res.message || 'Physician registration failed' };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const loginDoctor = async (email, password) => {
    setLoading(true);
    try {
      const res = await authService.loginDoctor({ email, password });
      if (res.success && res.token && res.data) {
        localStorage.setItem('sh_token', res.token);
        localStorage.setItem('sh_user', JSON.stringify(res.data));
        setToken(res.token);
        setUser(res.data);
        return { success: true, user: res.data };
      }
      return { success: false, message: res.message || 'Doctor login failed' };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    try {
      authService.logout();
    } catch {
      // ignore logout network errors
    }
    localStorage.removeItem('sh_token');
    localStorage.removeItem('sh_user');
    setUser(null);
    setToken(null);
  };

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('sh_user', JSON.stringify(updatedUser));
  };

  const role = user?.role || null;
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        loading,
        isAuthenticated,
        login,
        register,
        registerDoctor,
        loginDoctor,
        logout,
        updateUserProfile,
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
