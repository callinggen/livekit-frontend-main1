"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { api } from "@/lib/api";
import { useAuth } from "./AuthProvider";

interface CreditsContextType {
  credits: number | null;
  refreshCredits: () => void;
}

const CreditsContext = createContext<CreditsContextType>({
  credits: null,
  refreshCredits: () => {},
});

export function useCredits() {
  return useContext(CreditsContext);
}

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);

  const fetchCredits = useCallback(async () => {
    if (!isLoggedIn || !user?.token) return;
    try {
      const data = await api.getCredits(user.token);
      setCredits(data.credits);
    } catch (err) {
      console.error("Failed to fetch credits:", err);
    }
  }, [isLoggedIn, user?.token]);

  useEffect(() => {
    fetchCredits();
    const interval = setInterval(fetchCredits, 10000);
    return () => clearInterval(interval);
  }, [fetchCredits]);

  return (
    <CreditsContext.Provider value={{ credits, refreshCredits: fetchCredits }}>
      {children}
    </CreditsContext.Provider>
  );
}
