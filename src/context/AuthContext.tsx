import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  updateUserProfile,
  type UserProfile,
} from "@/lib/storage";

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getCurrentUser();
    setUser(stored);
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string): boolean => {
    const profile = loginUser(email, password);
    if (!profile) return false;
    setUser(profile);
    return true;
  };

  const register = (name: string, email: string, password: string): boolean => {
    const success = registerUser(name, email, password);
    if (!success) return false;
    const profile = loginUser(email, password);
    setUser(profile);
    return true;
  };

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    updateUserProfile(updates);
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};