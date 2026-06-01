import React, { createContext, useState, useEffect, useContext } from 'react';

export const API_BASE = 'http://localhost:5000/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'donor' | 'recipient' | 'admin';
}

interface Donor {
  _id: string;
  bloodGroup: string;
  phone: string;
  age: number;
  gender: string;
  city: string;
  location: {
    coordinates: [number, number];
  };
  lastDonationDate: string | null;
  available: boolean;
  eligibilityStatus: {
    isEligible: boolean;
    reason: string;
  };
}

interface AuthContextType {
  user: User | null;
  donor: Donor | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  registerUser: (
    name: string,
    email: string,
    password: string,
    role: string,
    donorDetails?: any
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  setDonor: React.Dispatch<React.SetStateAction<Donor | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [donor, setDonor] = useState<Donor | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load token and fetch user details on load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            setDonor(data.donor);
          } else {
            // Token expired or invalid
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (error) {
          console.error('Error restoring session:', error);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || 'Login failed' };
      }
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setDonor(data.donor);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: 'Network error connecting to backend API' };
    }
  };

  const registerUser = async (
    name: string,
    email: string,
    password: string,
    role: string,
    donorDetails?: any
  ) => {
    try {
      const payload = {
        name,
        email,
        password,
        role,
        donorDetails: role === 'donor' ? donorDetails : undefined,
      };

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || 'Registration failed' };
      }
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setDonor(data.donor);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: 'Network error connecting to backend API' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setDonor(null);
  };

  return (
    <AuthContext.Provider value={{ user, donor, token, loading, login, registerUser, logout, setDonor }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
