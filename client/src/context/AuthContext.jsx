import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { statusText } from "../utils/format";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const refreshUser = useCallback(async () => {
    setAuthError("");
    try {
      const response = await api.get("/auth/me");
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
      if (error.response?.status !== 401) {
        setAuthError(statusText(error));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (payload) => {
    const response = await api.post("/auth/login", payload);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const response = await api.post("/auth/register", payload);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, authError, login, register, logout, refreshUser }),
    [user, loading, authError, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
