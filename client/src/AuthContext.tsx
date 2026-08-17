import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { api } from "./api";

interface AuthState {
  loading: boolean;
  authenticated: boolean;
  username?: string;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | undefined>();

  // Bumped on every explicit login/logout so a slow, stale initial `me()`
  // check can't come back later and silently overwrite a fresher state.
  const authVersion = useRef(0);

  useEffect(() => {
    const versionAtStart = authVersion.current;
    api
      .me()
      .then((res) => {
        if (authVersion.current !== versionAtStart) return;
        setAuthenticated(res.authenticated);
        setUsername(res.username);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (u: string, p: string) => {
    const res = await api.login(u, p);
    authVersion.current += 1;
    setAuthenticated(true);
    setUsername(res.username);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    authVersion.current += 1;
    setAuthenticated(false);
    setUsername(undefined);
  }, []);

  return (
    <AuthContext.Provider value={{ loading, authenticated, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
