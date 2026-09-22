import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '../api/client';
import { disconnectSocket } from '../api/socket';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cs_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('cs_user');
      const storedToken = localStorage.getItem('cs_token');

      if (storedToken) {
        try {
          const res = await authApi.getMe();
          setUser(res.data.user);
        } catch (error) {
          // Token invalid, clear storage
          localStorage.removeItem('cs_token');
          localStorage.removeItem('cs_user');
          setToken(null);
          setUser(null);
        }
      } else if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('cs_token', res.data.token);
    localStorage.setItem('cs_user', JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    localStorage.setItem('cs_token', res.data.token);
    localStorage.setItem('cs_user', JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    disconnectSocket();
    localStorage.removeItem('cs_token');
    localStorage.removeItem('cs_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('cs_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!token,
    isCitizen: user?.role === 'citizen',
    isOfficial: user?.role === 'official',
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
