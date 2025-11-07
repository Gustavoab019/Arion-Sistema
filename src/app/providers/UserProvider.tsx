"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CurrentUser } from "@/src/lib/getCurrentUser";

type UserContextValue = {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

async function requestMe() {
  const res = await fetch("/api/auth/me", {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Falha ao carregar usuário.");
  }
  const data = (await res.json()) as { user: CurrentUser | null };
  return data.user ?? null;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const current = await requestMe();
      setUser(current);
    } catch (err) {
      console.error("Erro ao carregar usuário:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar usuário.");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Erro ao sair:", err);
    } finally {
      setUser(null);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      loading,
      error,
      refresh: fetchUser,
      logout,
    }),
    [user, loading, error, fetchUser, logout]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useCurrentUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useCurrentUser deve ser usado dentro de <UserProvider />");
  }
  return ctx;
}
