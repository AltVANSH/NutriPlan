import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/axios';

interface User {
  id: number;
  email: string;
  preferences: {
    dietary_restrictions: string[];
    allergies: string[];
    disliked_ingredients: string[];
    daily_calorie_target: number;
    daily_protein_target: number;
    daily_carbs_target: number;
    daily_fat_target: number;
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, preferences: any) => Promise<void>;
  logout: () => void;
  updateProfile: (preferences: any) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Login attempt with:', { email });
      const response = await api.post('/auth/login', { email, password });
      
      console.log('Login response:', response.data);
      
      const { token, user: userData } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error: any) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  };

  const register = async (email: string, password: string, preferences: any) => {
    try {
      console.log('Register attempt with:', { 
        email, 
        passwordLength: password.length,
        preferences 
      });
      
      const requestData = {
        email,
        password,
        preferences: {
          dietary_restrictions: preferences.dietary_restrictions || [],
          allergies: preferences.allergies || [],
          disliked_ingredients: preferences.disliked_ingredients || [],
          daily_calorie_target: preferences.daily_calorie_target || 2000,
          daily_protein_target: preferences.daily_protein_target || 50,
          daily_carbs_target: preferences.daily_carbs_target || 250,
          daily_fat_target: preferences.daily_fat_target || 70,
        }
      };
      
      console.log('Sending registration data:', requestData);
      
      const response = await api.post('/auth/register', requestData);
      
      console.log('Register response:', response.data);
      
      const { token, user: userData } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error: any) {
      console.error('Register error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        fullError: error
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateProfile = async (updates: { preferences: any }) => {
    try {
      console.log('Updating profile with:', updates);
      const response = await api.put('/auth/profile', updates);
      
      console.log('Update profile response:', response.data);
      
      const updatedUser = response.data.data.user;
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error: any) {
      console.error('Update profile error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};