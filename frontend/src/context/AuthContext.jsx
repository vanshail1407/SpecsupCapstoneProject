import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('specsup_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('specsup_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      if (token) {
        try {
          const freshUser = await api.getMe();
          setUser(freshUser);
          localStorage.setItem('specsup_user', JSON.stringify(freshUser));
        } catch (err) {
          console.warn('Session verification failed:', err);
          logout();
        }
      }
      setLoading(false);
    }

    verifySession();

    const handleAuthChanged = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth-changed', handleAuthChanged);
    return () => window.removeEventListener('auth-changed', handleAuthChanged);
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('specsup_token', res.token);
    localStorage.setItem('specsup_user', JSON.stringify(res.user));
    return res.user;
  };

  const register = async (name, email, password) => {
    const res = await api.register(name, email, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('specsup_token', res.token);
    localStorage.setItem('specsup_user', JSON.stringify(res.user));
    return res.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('specsup_token');
    localStorage.removeItem('specsup_user');
  };

  const updateUser = (updated) => {
    setUser(updated);
    localStorage.setItem('specsup_user', JSON.stringify(updated));
  };

  const isAuthenticated = Boolean(user && token);
  const isAdmin = user?.role === 'admin';
  const isCustomer = user?.role === 'customer';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        isCustomer,
        login,
        register,
        logout,
        updateUser,
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
