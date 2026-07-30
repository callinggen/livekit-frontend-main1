"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode
} from "react";
import { useRouter, usePathname } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export interface UserData {
  email: string;
  name: string;
  isFirstLogin: boolean;
  isAdmin: boolean;
  token?: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: UserData | null;
  login: (email: string, password?: string) => Promise<{ success: boolean; isFirstLogin?: boolean; isAdmin?: boolean }>;
  logout: () => void;
  updateToken: (newToken: string, isFirstLogin: boolean, isAdmin: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  login: async () => ({ success: false }),
  logout: () => {},
  updateToken: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = sessionStorage.getItem("callinggen-auth");
      
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          const token = parsed.token;
          if (token) {
            const res = await fetch(`${API_BASE}/api/auth/me`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              const updatedUser = {
                ...parsed,
                isFirstLogin: data.is_first_login,
                isAdmin: data.is_admin
              };
              setUser(updatedUser);
              setIsLoggedIn(true);
              
              if (!data.is_first_login) {
                sessionStorage.setItem("callinggen-auth", JSON.stringify(updatedUser));
              } else {
                sessionStorage.removeItem("callinggen-auth");
              }
            } else {
              sessionStorage.removeItem("callinggen-auth");
              setUser(null);
              setIsLoggedIn(false);
            }
          }
        } catch (e) {
          sessionStorage.removeItem("callinggen-auth");
        }
      }
      setMounted(true);
    };
    initAuth();
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      sessionStorage.removeItem("callinggen-auth");
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
            token: data.access_token 
          };
          
          setUser(userData);
          
          // Only persist to sessionStorage if it's not a first login
          if (!data.is_first_login) {
            sessionStorage.setItem("callinggen-auth", JSON.stringify(userData));
          }
          
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
    setUser(null);
    setIsLoggedIn(false);
    sessionStorage.removeItem("callinggen-auth");
    router.push("/login");
  }, [router]);

  const updateToken = useCallback((newToken: string, isFirstLogin: boolean, isAdmin: boolean) => {
    setUser(prev => {
      if (!prev) return null;
      const updatedUser = { ...prev, token: newToken, isFirstLogin, isAdmin };
      
      // Update sessionStorage since the user has now changed their password
      if (!isFirstLogin) {
        sessionStorage.setItem("callinggen-auth", JSON.stringify(updatedUser));
      }
      
      return updatedUser;
    });
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!user, user, login, logout, updateToken }}>
      {children}
    </AuthContext.Provider>
  );
}
