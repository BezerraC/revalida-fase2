"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import api, { setAuthToken } from "@/lib/api";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  gemini_api_key?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = async (token: string) => {
    try {
      setAuthToken(token);
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    const token = Cookies.get("auth_token");
    if (token) {
      await fetchUser(token);
    }
  };

  useEffect(() => {
    const token = Cookies.get("auth_token");
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (token: string) => {
    Cookies.set("auth_token", token, { expires: 1, secure: true, sameSite: 'strict' });
    setAuthToken(token);
    await fetchUser(token);
    router.push("/");
  };

  const logout = () => {
    Cookies.remove("auth_token");
    setAuthToken(null);
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
