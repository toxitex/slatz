import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

/**
 * Auth helpers: bcrypt password hashing + JWT issued as an httpOnly cookie.
 * The secret comes from SYNCX_JWT_SECRET in the environment; a dev fallback
 * keeps local runs working but production must set a real secret.
 */

const JWT_SECRET = process.env.SYNCX_JWT_SECRET || (() => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("SYNCX_JWT_SECRET must be set in production environment");
  }
  console.warn("⚠️  Using insecure JWT secret in development. Set SYNCX_JWT_SECRET in production!");
  return "syncx-dev-secret-change-me";
})();
const TOKEN_TTL = "30d";
export const AUTH_COOKIE = "syncx_token";

export type TokenPayload = { sub: string; email: string };

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

export function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE, { path: "/" });
}

/** Attaches req.auth when a valid token cookie is present; never rejects. */
export function readAuth(req: Request): TokenPayload | null {
  const token = (req as Request & { cookies?: Record<string, string> }).cookies?.[AUTH_COOKIE];
  if (!token) return null;
  return verifyToken(token);
}

/** Route guard: 401 when no valid session. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = readAuth(req);
  if (!auth) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  (req as Request & { auth?: TokenPayload }).auth = auth;
  next();
}

/** Route guard: 403 when no valid admin credentials header is present. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const code = req.headers["x-admin-access-code"];
  const expected = process.env.VITE_ADMIN_ACCESS_CODE || "syncx-admin";
  if (code !== expected) {
    res.status(403).json({ error: "forbidden: admin access required" });
    return;
  }
  next();
}

