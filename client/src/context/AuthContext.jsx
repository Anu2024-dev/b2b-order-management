import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('b2b_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('b2b_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.data);
          localStorage.setItem('b2b_user', JSON.stringify(res.data.data));
        } catch {
          setUser(null);
          setToken(null);
          localStorage.removeItem('b2b_user');
          localStorage.removeItem('b2b_token');
        }
      }
      setLoading(false);
    };

    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: loggedInUser, token: authToken } = res.data.data;
    setUser(loggedInUser);
    setToken(authToken);
    localStorage.setItem('b2b_token', authToken);
    localStorage.setItem('b2b_user', JSON.stringify(loggedInUser));
    return loggedInUser;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { user: registeredUser, token: authToken } = res.data.data;
    setUser(registeredUser);
    setToken(authToken);
    localStorage.setItem('b2b_token', authToken);
    localStorage.setItem('b2b_user', JSON.stringify(registeredUser));
    return registeredUser;
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('b2b_token');
      localStorage.removeItem('b2b_user');
    }
  };

  const updateProfile = async (data) => {
    const res = await api.patch('/auth/me', data);
    setUser(res.data.data);
    localStorage.setItem('b2b_user', JSON.stringify(res.data.data));
    return res.data.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user && token),
        isAdmin: user?.role === 'admin',
        isCustomer: user?.role === 'customer',
        login,
        register,
        logout,
        updateProfile,
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
