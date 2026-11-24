import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, authApi } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  quickLogin: (role: 'citizen' | 'officer' | 'admin') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('fixproof_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const me = await authApi.getMe();
          setUser(me);
        } catch {
          localStorage.removeItem('fixproof_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email: string, pass: string) => {
    const res = await authApi.login({ email, password: pass });
    localStorage.setItem('fixproof_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const quickLogin = async (role: 'citizen' | 'officer' | 'admin') => {
    const creds = {
      citizen: { email: 'citizen@fixproof.org', pass: 'citizen123' },
      officer: { email: 'officer@fixproof.org', pass: 'officer123' },
      admin: { email: 'admin@fixproof.org', pass: 'admin123' },
    }[role];

    await login(creds.email, creds.pass);
  };

  const logout = () => {
    localStorage.removeItem('fixproof_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, quickLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
