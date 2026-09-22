/**
 * Auth context — persists JWT + user in AsyncStorage across app restarts.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('cs_token');
        const storedUser = await AsyncStorage.getItem('cs_user');
        if (stored && storedUser) {
          setToken(stored);
          setUser(JSON.parse(storedUser));
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const { token: jwt, user: u } = res.data;
    await AsyncStorage.setItem('cs_token', jwt);
    await AsyncStorage.setItem('cs_user', JSON.stringify(u));
    setToken(jwt);
    setUser(u);
  };

  const register = async (data) => {
    const res = await authApi.register(data);
    const { token: jwt, user: u } = res.data;
    await AsyncStorage.setItem('cs_token', jwt);
    await AsyncStorage.setItem('cs_user', JSON.stringify(u));
    setToken(jwt);
    setUser(u);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['cs_token', 'cs_user']);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
