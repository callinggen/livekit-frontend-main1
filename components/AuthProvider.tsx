"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode
} from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface UserData {
  email: string;
  name: string;
  isFirstLogin: boolean;
  isAdmin: boolean;
  token?: string;
  subscription_plan?: string;
  company_name?: string;
  industry?: string;
  phone_number?: string;
  credits?: number;
  agent_name?: string;
  agent_language?: string;
  agent_voice?: string;
  agent_script?: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: UserData | null;
  login: (email: string, password?: string) => Promise<{ success: boolean; isFirstLogin?: boolean; isAdmin?: boolean }>;
  logout: () => void;
  updateToken: (newToken: string, isFirstLogin: boolean, isAdmin: boolean) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  login: async () => ({ success: false }),
  logout: () => {},
  updateToken: () => {},
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const getInitialUser = (): UserData | null => {
  if (typeof window === "undefined") return null;
  try {
    const storedUser = sessionStorage.getItem("callinggen-auth") || localStorage.getItem("callinggen-auth");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

export default function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<UserData | null>(getInitialUser);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!getInitialUser()?.token);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    const stored = getInitialUser();
    if (stored && stored.token) {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${stored.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const updatedUser: UserData = {
            ...stored,
            isFirstLogin: data.is_first_login,
            isAdmin: data.is_admin,
            subscription_plan: data.subscription_plan,
            company_name: data.company_name,
            industry: data.industry,
            phone_number: data.phone_number,
            credits: data.credits,
            agent_name: data.agent_name,
            agent_language: data.agent_language,
            agent_voice: data.agent_voice,
            agent_script: data.agent_script,
          };
          setUser(updatedUser);
          setIsLoggedIn(true);
          sessionStorage.setItem("callinggen-auth", JSON.stringify(updatedUser));
          localStorage.setItem("callinggen-auth", JSON.stringify(updatedUser));
        } else {
          sessionStorage.removeItem("callinggen-auth");
          localStorage.removeItem("callinggen-auth");
          setUser(null);
          setIsLoggedIn(false);
        }
      } catch (e) {
        console.warn("Auth sync warning:", e);
      }
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const stored = getInitialUser();
      
      if (stored && stored.token) {
        setUser(stored);
        setIsLoggedIn(true);
        await refreshUser();
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
      setMounted(true);
    };
    initAuth();
  }, [refreshUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      sessionStorage.removeItem("callinggen-auth");
      localStorage.removeItem("callinggen-auth");
      setUser(null);
      setIsLoggedIn(false);
      router.push("/login");
    };

    window.addEventListener("unauthorized-access", handleUnauthorized);
    return () => window.removeEventListener("unauthorized-access", handleUnauthorized);
  }, [router]);

  const login = useCallback(
    async (email: string, password?: string) => {
      try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ identifier: email, password: password || "" }),
        });

        if (response.ok) {
          const data = await response.json();
          const username = email.split('@')[0];
          const derivedName = username.charAt(0).toUpperCase() + username.slice(1);
          const displayName = data.full_name || derivedName;
          
          const userData: UserData = { 
            email, 
            name: displayName, 
            isFirstLogin: data.is_first_login,
            isAdmin: data.is_admin,
            token: data.access_token,
            subscription_plan: data.subscription_plan,
            company_name: data.company_name,
            industry: data.industry,
            phone_number: data.phone_number,
            credits: data.credits,
            agent_name: data.agent_name,
            agent_language: data.agent_language,
            agent_voice: data.agent_voice,
            agent_script: data.agent_script,
          };
          
          setUser(userData);
          sessionStorage.setItem("callinggen-auth", JSON.stringify(userData));
          localStorage.setItem("callinggen-auth", JSON.stringify(userData));
          setIsLoggedIn(true);
          
          return { success: true, isFirstLogin: data.is_first_login, isAdmin: data.is_admin };
        } else {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Invalid credentials");
        }
      } catch (error: any) {
        throw error;
      }
    },
    []
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem("callinggen-auth");
    localStorage.removeItem("callinggen-auth");
    setUser(null);
    setIsLoggedIn(false);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  const updateToken = useCallback((newToken: string, isFirstLogin: boolean, isAdmin: boolean) => {
    setUser(prev => {
      if (!prev) return null;
      const updatedUser = { ...prev, token: newToken, isFirstLogin, isAdmin };
      
      if (!isFirstLogin) {
        sessionStorage.setItem("callinggen-auth", JSON.stringify(updatedUser));
        localStorage.setItem("callinggen-auth", JSON.stringify(updatedUser));
      }
      
      return updatedUser;
    });
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!user, user, login, logout, updateToken, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
