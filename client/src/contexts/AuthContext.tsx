import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { api } from "@/lib/api";

export type SyncxAuthUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  initial: string;
  balance: number;
  createdAt?: string;
};

type ApiUser = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  balance: number;
  created_at: string;
};

interface AuthContextType {
  user: SyncxAuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toSyncxUser(user: ApiUser | null): SyncxAuthUser | null {
  if (!user) return null;
  const displayName = String(user.display_name || user.email?.split("@")[0] || "ผู้ใช้").trim();
  return {
    id: user.id,
    email: user.email ?? "",
    displayName,
    avatarUrl: user.avatar_url || undefined,
    initial: displayName.charAt(0).toUpperCase() || "U",
    balance: typeof user.balance === "number" ? user.balance : Number(user.balance ?? 0) || 0,
    createdAt: user.created_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SyncxAuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    try {
      const { user: apiUser } = await api.get<{ user: ApiUser | null }>("/api/auth/me");
      setUser(toSyncxUser(apiUser));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { user: apiUser } = await api.post<{ user: ApiUser }>("/api/auth/login", { email, password });
    setUser(toSyncxUser(apiUser));
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const { user: apiUser } = await api.post<{ user: ApiUser }>("/api/auth/register", { email, password, displayName });
    setUser(toSyncxUser(apiUser));
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
