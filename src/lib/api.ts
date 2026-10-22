import { getAdminCode } from "$lib/admin-access";

/**
 * Same-origin REST client for the Express backend (/api/*). The httpOnly auth
 * cookie rides along via `credentials: "include"`; admin calls add the access
 * code header that `requireAdmin` checks on the server.
 */

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  const adminCode = getAdminCode();
  if (adminCode) headers["X-Admin-Access-Code"] = adminCode;

  const res = await fetch(path, { credentials: "include", ...init, headers });
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

export async function uploadImage(file: File): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": file.type || "image/png", "X-Admin-Access-Code": getAdminCode() ?? "" },
    body: file,
  });
  const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!res.ok || !data?.url) throw new Error(data?.error || `HTTP ${res.status}`);
  return data.url;
}

export function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}
