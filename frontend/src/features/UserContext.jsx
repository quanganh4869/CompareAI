import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { API_BASE_URL } from "../config/api";
import {
  getAccessToken,
  getAuthUser,
  clearAuthSession,
  syncUserSessionFromBackend,
} from "../utils/authSession";
import { dispatchNotice } from "../utils/notice";
import { authFetch } from "../utils/authFetch";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(getAuthUser());
  const [isLoading, setIsLoading] = useState(false);
  const [isUserResolved, setIsUserResolved] = useState(false);

  const fetchUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setIsUserResolved(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/v1_0/user/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const body = await response.json().catch(() => null);

      if (response.ok && body?.success && body?.data) {
        setUser(body.data);
        syncUserSessionFromBackend(body.data);
      } else if (response.status === 401) {
        clearAuthSession();
        setUser(null);
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error when loading user:", error);
      setUser(null);
      dispatchNotice({
        tone: "warning",
        title: "Backend",
        message:
          "Khong ket noi duoc backend. Hay kiem tra API server co dang chay o localhost:8000 khong.",
      });
    } finally {
      setIsLoading(false);
      setIsUserResolved(true);
    }
  }, []);

  const logoutSilent = useCallback(() => {
    clearAuthSession();
    setUser(null);
  }, []);

  const revokeServerSession = useCallback(async () => {
    const token = getAccessToken();
    try {
      await fetch(`${API_BASE_URL}/v1_0/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      // Best effort revoke only.
    }
  }, []);

  const logout = useCallback(() => {
    void revokeServerSession();
    logoutSilent();
    window.location.href = "/";
  }, [logoutSilent, revokeServerSession]);

  useEffect(() => {
    if (getAccessToken()) {
      fetchUser();
      return;
    }
    setIsUserResolved(true);
  }, [fetchUser]);

  return (
    <UserContext.Provider
      value={{ user, setUser, isLoading, isUserResolved, fetchUser, logout }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used inside UserProvider");
  }
  return context;
};
