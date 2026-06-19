/**
 * Self-hosted REST API client — replaces the Supabase SDK surface.
 * All calls are same-origin and send the httpOnly auth cookie via
 * `credentials: "include"`. The backend lives at /api/* on the same host
 * (nginx proxies /api → the Node process), so no base URL is needed.
 *
 * `isApiConfigured` is always true now that the backend is first-party; the
 * hooks keep their localStorage fallback purely for offline / API-down cases.
 */

export const isApiConfigured = true;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const adminCode = typeof window !== "undefined" ? window.sessionStorage.getItem("syncx-admin-access-code") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(init?.headers as Record<string, string> ?? {}) };
  if (adminCode) {
    headers["X-Admin-Access-Code"] = adminCode;
  }
  const res = await fetch(path, {
    credentials: "include",
    headers,
    ...init,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
