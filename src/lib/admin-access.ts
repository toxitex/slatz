const ACCESS_KEY = "syncx-admin-access";
const CODE_KEY = "syncx-admin-access-code";
const SECTION_KEY = "syncx-admin-section";

export const ADMIN_ACCESS_CODE: string = import.meta.env.VITE_ADMIN_ACCESS_CODE || "syncx-admin";

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

export function getAdminSection() {
  return storage()?.getItem(SECTION_KEY) ?? null;
}

export function setAdminSection(section: string) {
  storage()?.setItem(SECTION_KEY, section);
}
