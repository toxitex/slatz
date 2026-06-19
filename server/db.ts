import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";

/**
 * Self-hosted SQLite data layer for SyncX.
 * Mirrors the original Supabase schema (products / coupons / categories) plus a
 * users table that replaces Supabase Auth. Snake_case columns are preserved so
 * the existing client normalizers keep working unchanged.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "syncx.db");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(DB_FILE);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${randomBytes(6).toString("hex")}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL DEFAULT 'สินค้าใหม่',
    price       TEXT NOT NULL DEFAULT '฿0',
    category    TEXT NOT NULL DEFAULT 'สินค้าทั่วไป',
    image_url   TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    stock       INTEGER NOT NULL DEFAULT 0,
    is_active   INTEGER NOT NULL DEFAULT 1,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    tiers       TEXT NOT NULL DEFAULT '[]',
    status      TEXT NOT NULL DEFAULT 'active',
    total_sold  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS products_active_sort_idx
    ON products (is_active, sort_order, created_at DESC);
  CREATE INDEX IF NOT EXISTS products_status_idx ON products (status);

  CREATE TABLE IF NOT EXISTS coupons (
    id             TEXT PRIMARY KEY,
    code           TEXT NOT NULL UNIQUE,
    discount_type  TEXT NOT NULL DEFAULT 'percent',
    discount_value REAL NOT NULL DEFAULT 0,
    active         INTEGER NOT NULL DEFAULT 1,
    created_at     TEXT NOT NULL,
    updated_at     TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS coupons_active_code_idx ON coupons (active, code);

  CREATE TABLE IF NOT EXISTS categories (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    image_url   TEXT NOT NULL DEFAULT '',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS categories_active_sort_idx
    ON categories (is_active, sort_order, created_at DESC);

  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name  TEXT NOT NULL DEFAULT '',
    avatar_url    TEXT NOT NULL DEFAULT '',
    balance       REAL NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL,
    product_id   TEXT NOT NULL,
    product_name TEXT NOT NULL,
    tier_id      TEXT NOT NULL,
    tier_label   TEXT NOT NULL,
    quantity     INTEGER NOT NULL,
    price        REAL NOT NULL,
    total        REAL NOT NULL,
    code_key     TEXT NOT NULL,
    created_at   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vouchers (
    id         TEXT PRIMARY KEY,
    code       TEXT NOT NULL UNIQUE,
    amount     REAL NOT NULL,
    is_used    INTEGER NOT NULL DEFAULT 0,
    used_by    TEXT,
    used_at    TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

let seeded = false;
export function seedIfEmpty(): void {
  if (seeded) return;
  seeded = true;
  
  // Seed categories
  const catCount = (db.prepare("SELECT COUNT(*) AS n FROM categories").get() as { n: number }).n;
  const ts = nowIso();
  if (catCount === 0) {
    const insertCat = db.prepare(
      `INSERT INTO categories (id, name, image_url, sort_order, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    const seedCats = ["สินค้าทั่วไป", "สินค้าแนะนำ"];
    seedCats.forEach((name, i) => {
      insertCat.run(newId("cat"), name, "", i, 1, ts, ts);
    });
  }

  // Seed vouchers
  const voucherCount = (db.prepare("SELECT COUNT(*) AS n FROM vouchers").get() as { n: number }).n;
  if (voucherCount === 0) {
    const insertVoucher = db.prepare(
      `INSERT INTO vouchers (id, code, amount, is_used, created_at)
       VALUES (?, ?, ?, 0, ?)`,
    );
    insertVoucher.run(newId("vouch"), "SYNX-100", 100, ts);
    insertVoucher.run(newId("vouch"), "SYNX-500", 500, ts);
    insertVoucher.run(newId("vouch"), "SYNX-1000", 1000, ts);
  }

  // Seed default admin user (user: admin@slatz.xyz / pass: admin)
  const adminEmail = "admin@slatz.xyz";
  const adminCount = (db.prepare("SELECT COUNT(*) AS n FROM users WHERE email = ?").get(adminEmail) as { n: number }).n;
  if (adminCount === 0) {
    const hash = bcrypt.hashSync("admin", 10);
    db.prepare(
      `INSERT INTO users (id, email, password_hash, display_name, avatar_url, balance, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(newId("user"), adminEmail, hash, "Administrator", "", 99999, ts);
  }
}
