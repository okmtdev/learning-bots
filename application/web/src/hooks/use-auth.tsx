"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { isAuthenticated, getIdToken, clearTokens, getLoginUrl, getLogoutUrl, refreshTokens } from "@/lib/auth";
import { api, ApiRequestError } from "@/lib/api";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const locale = useLocale();

  const redirectToLogin = useCallback(() => {
    clearTokens();
    setUser(null);
    window.location.href = getLoginUrl(locale);
  }, [locale]);

  useEffect(() => {
    async function loadUser() {
      if (!isAuthenticated()) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await api.get<User>("/auth/me");
        setUser(userData);
      } catch (err) {
        if (err instanceof ApiRequestError && err.status === 401) {
          // Try refreshing the token before giving up
          const refreshed = await refreshTokens();
          if (refreshed) {
            try {
              const userData = await api.get<User>("/auth/me");
              setUser(userData);
              return;
            } catch {
              // Refresh didn't help, redirect to login
            }
          }
          redirectToLogin();
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [redirectToLogin]);

  const login = useCallback(() => {
    window.location.href = getLoginUrl(locale);
  }, [locale]);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    window.location.href = getLogoutUrl();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await api.get<User>("/auth/me");
      setUser(userData);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        redirectToLogin();
      }
      throw err;
    }
  }, [redirectToLogin]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
