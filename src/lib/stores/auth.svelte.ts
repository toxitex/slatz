import { api } from "$lib/api";

export type AuthUser = {
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

function toUser(user: ApiUser | null): AuthUser | null {
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

export class AuthStore {
  user = $state<AuthUser | null>(null);
  loading = $state(true);

  async refresh() {
    try {
      const { user } = await api.get<{ user: ApiUser | null }>("/api/auth/me");
      this.user = toUser(user);
    } catch {
      this.user = null;
    } finally {
      this.loading = false;
    }
  }

  async signIn(email: string, password: string) {
    const { user } = await api.post<{ user: ApiUser }>("/api/auth/login", { email, password });
    this.user = toUser(user);
  }

  async signUp(email: string, password: string, displayName: string) {
    const { user } = await api.post<{ user: ApiUser }>("/api/auth/register", { email, password, displayName });
    this.user = toUser(user);
  }

  async signOut() {
    try {
      await api.post("/api/auth/logout");
    } catch {
      /* ignore */
    }
    this.user = null;
  }
}
