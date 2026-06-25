"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { api } from "@/lib/api";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: string;
  tier: string;
  credits: number;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStoredAuth() {
  if (typeof window === "undefined") return { token: null, user: null };
  try {
    const token = localStorage.getItem("bn_token");
    const user = localStorage.getItem("bn_user");
    return {
      token,
      user: user ? (JSON.parse(user) as AuthUser) : null,
    };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredAuth();
    if (stored.token && stored.user) {
      setToken(stored.token);
      setUser(stored.user);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login({ email, password });
    localStorage.setItem("bn_token", result.accessToken);
    localStorage.setItem("bn_user", JSON.stringify(result.user));
    setToken(result.accessToken);
    setUser(result.user as AuthUser);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const result = await api.register({ email, password, name });
    localStorage.setItem("bn_token", result.accessToken);
    localStorage.setItem("bn_user", JSON.stringify(result.user));
    setToken(result.accessToken);
    setUser(result.user as AuthUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("bn_token");
    localStorage.removeItem("bn_user");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
