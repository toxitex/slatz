const ACCESS_KEY = "syncx-admin-access";
const CODE_KEY = "syncx-admin-access-code";
const SECTION_KEY = "syncx-admin-section";

function storage() {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

export function isAdminGranted() {
  return storage()?.getItem(ACCESS_KEY) === "granted";
}

export function getAdminCode() {
  return storage()?.getItem(CODE_KEY) ?? null;
}

export function grantAdmin(code: string) {
  storage()?.setItem(ACCESS_KEY, "granted");
  storage()?.setItem(CODE_KEY, code);
}

export function revokeAdmin() {
  storage()?.removeItem(ACCESS_KEY);
  storage()?.removeItem(CODE_KEY);
}

export type VerifyResult = "ok" | "invalid" | "offline";

/** Checks an access code against the server, which holds the only copy of the real code. */
export async function verifyAdminCode(code: string): Promise<VerifyResult> {
  try {
    const res = await fetch("/api/admin/verify", {
      method: "POST",
      credentials: "include",
      headers: { "X-Admin-Access-Code": code },
    });
    if (res.ok) return "ok";
    return res.status === 403 ? "invalid" : "offline";
  } catch {
    return "offline";
  }
}

export function getAdminSection() {
  return storage()?.getItem(SECTION_KEY) ?? null;
}

export function setAdminSection(section: string) {
  storage()?.setItem(SECTION_KEY, section);
}
