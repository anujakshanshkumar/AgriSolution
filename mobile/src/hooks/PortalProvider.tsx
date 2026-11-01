import React, { createContext, useContext, useEffect, useState } from "react";
import { api, onUnauthorized, restoreToken, saveToken } from "../services/api";
import { Content, LoginResponse, User } from "../types";
import { useResource } from "./useResource";
const loadContent = () => api<Content>("content");
function usePortalState() {
  const content = useResource(loadContent);
  const [user, setUser] = useState<User | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [language, setLanguage] = useState<"en" | "hi">("en");
  async function refreshUser() {
    const result = await api<User>("me", undefined, true);
    setUser(result);
  }
  useEffect(() => {
    onUnauthorized(() => setUser(null));
    (async () => {
      try {
        if (await restoreToken()) await refreshUser();
      } catch (error) {
        setSessionError(
          error instanceof Error ? error.message : "Unable to restore session.",
        );
      } finally {
        setRestoring(false);
      }
    })();
  }, []);
  async function login(mobile: string, password: string) {
    const result = await api<LoginResponse>("auth/login", {
      mobile: mobile.trim(),
      password,
    });
    await saveToken(result.accessToken);
    setUser(result);
    setSessionError("");
  }
  async function logout() {
    // Keep the session available for retry if server revocation fails.
    await api("logout", {}, true);
    await saveToken(null);
    setUser(null);
  }
  const t = (text: string) =>
    language === "hi" ? content.data?.translations[text] || text : text;
  return {
    content,
    user,
    restoring,
    sessionError,
    language,
    setLanguage,
    t,
    login,
    logout,
    refreshUser,
    clearSession: async () => {
      await saveToken(null);
      setUser(null);
    },
  };
}
const Context = createContext<ReturnType<typeof usePortalState> | null>(null);
export function PortalProvider({ children }: React.PropsWithChildren) {
  return (
    <Context.Provider value={usePortalState()}>{children}</Context.Provider>
  );
}
export function usePortal() {
  const value = useContext(Context);
  if (!value) throw new Error("Portal provider missing");
  return value;
}
