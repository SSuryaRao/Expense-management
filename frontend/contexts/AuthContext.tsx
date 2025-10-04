'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// Define the types for your user and company based on your backend models
interface User {
  _id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Employee';
  companyId: string;
  managerId?: string;
}

interface Company {
    _id: string;
    name: string;
    defaultCurrency: string;
}

interface AuthContextType {
  user: User | null;
  profile?: User | null;
  company: Company | null;
  loading: boolean;
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    name: string,
    email: string,
    password: string,
    companyName: string,
    country: string
  ) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create an Axios instance for your API
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadUserFromStorage = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        try {
          // Fetch user and company details from /me endpoint
          const { data } = await api.get('/users/me');
          setUser(data.user);
          setCompany(data.company);
        } catch (error) {
          console.error('Failed to load user from token', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    loadUserFromStorage();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setToken(data.token);

    // Fetch full user and company details
    try {
      const { data: meData } = await api.get('/users/me');
      setUser(meData.user);
      setCompany(meData.company);
    } catch (error) {
      console.error('Failed to load user/company details:', error);
    }

    if (data.role === 'Admin') {
      router.push('/admin');
    } else if (data.role === 'Manager') {
        router.push('/manager/approvals');
    } else {
      router.push('/dashboard');
    }
  };

  const signUp = async (
    name: string,
    email: string,
    password: string,
    companyName: string,
    country: string
  ) => {
    const { data } = await api.post('/auth/signup', {
      name,
      email,
      password,
      companyName,
      country,
    });
    localStorage.setItem('token', data.token);
    setToken(data.token);

    // Fetch full user and company details
    try {
      const { data: meData } = await api.get('/users/me');
      setUser(meData.user);
      setCompany(meData.company);
    } catch (error) {
      console.error('Failed to load user/company details:', error);
    }

    router.push('/admin');
  };

  const signOut = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setCompany(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, profile: user, company, loading, token, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}