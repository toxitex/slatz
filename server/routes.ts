import type { Express, Request, Response } from "express";
import { db, newId, nowIso, seedIfEmpty } from "./db.js";
import {
  hashPassword,
  verifyPassword,
  signToken,
  setAuthCookie,
  clearAuthCookie,
  readAuth,
  requireAuth,
  requireAdmin,
} from "./auth.js";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "ชื่อสินค้าจำเป็นต้องระบุ").optional(),
  price: z.string().min(1, "ราคาจำเป็นต้องระบุ").optional(),
  category: z.string().optional(),
  image_url: z.string().optional(),
  description: z.string().optional(),
  stock: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  tiers: z.array(z.object({
    id: z.string(),
    label: z.string(),
    price: z.number().nonnegative(),
    stock: z.number().int().nonnegative(),
  })).optional(),
  status: z.enum(["active", "out_of_stock", "hidden"]).optional(),
  total_sold: z.number().int().nonnegative().optional(),
});

const couponSchema = z.object({
  code: z.string().min(1, "โค้ดคูปองจำเป็นต้องระบุ"),
  discount_type: z.enum(["percent", "fixed"]),
  discount_value: z.number().nonnegative(),
  active: z.boolean().optional(),
});

const categorySchema = z.object({
  name: z.string().min(1, "ชื่อหมวดหมู่จำเป็นต้องระบุ"),
  image_url: z.string().optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

/**
 * REST API that replaces the Supabase data layer.
 * Every row is returned in the same snake_case shape the client normalizers
 * already expect (see useInventoryProducts / useCoupons / useCategories), so
 * the front-end mapping code is untouched.
 */

/* ------------------------------- helpers -------------------------------- */

type ProductRow = {
  id: string;
  name: string;
  price: string;
  category: string;
  image_url: string;
  description: string;
  stock: number;
  is_active: number;
  sort_order: number;
  tiers: string;
  status: string;
  total_sold: number;
  created_at: string;
  updated_at: string;
};

function serializeProduct(row: ProductRow) {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    category: row.category,
    image_url: row.image_url,
    description: row.description,
    stock: row.stock,
    is_active: row.is_active === 1,
    sort_order: row.sort_order,
    tiers: safeParse(row.tiers, []),
    status: row.status,
    total_sold: row.total_sold,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function safeParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function publicUser(row: {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  balance: number;
  created_at: string;
}) {
  return {
    id: row.id,
    email: row.email,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    balance: row.balance,
    created_at: row.created_at,
  };
}

/* -------------------------------- routes -------------------------------- */

export function registerRoutes(app: Express) {
  seedIfEmpty();

  /* ----------------------------- auth ---------------------------------- */

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { email, password, displayName } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: "email และ password จำเป็นต้องกรอก" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "รหัสผ่านควรมีอย่างน้อย 6 ตัวอักษร" });
    }
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(String(email).toLowerCase());
    if (existing) {
      return res.status(409).json({ error: "อีเมลนี้ถูกใช้งานแล้ว" });
    }
    const id = newId("user");
    const ts = nowIso();
    const name = String(displayName || String(email).split("@")[0] || "ผู้ใช้").trim();
    const hash = await hashPassword(String(password));
    db.prepare(
      `INSERT INTO users (id, email, password_hash, display_name, avatar_url, balance, created_at)
       VALUES (?, ?, ?, ?, '', 0, ?)`,
    ).run(id, String(email).toLowerCase(), hash, name, ts);

    const token = signToken({ sub: id, email: String(email).toLowerCase() });
    setAuthCookie(res, token);
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
    res.json({ user: publicUser(row) });
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: "กรุณากรอกอีเมลและรหัสผ่าน" });
    }
    const row = db.prepare("SELECT * FROM users WHERE email = ?").get(String(email).toLowerCase()) as any;
    if (!row || !(await verifyPassword(String(password), row.password_hash))) {
      return res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }
    const token = signToken({ sub: row.id, email: row.email });
    setAuthCookie(res, token);
    res.json({ user: publicUser(row) });
  });

  app.post("/api/auth/logout", (_req: Request, res: Response) => {
    clearAuthCookie(res);
    res.json({ ok: true });
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    const auth = readAuth(req);
    if (!auth) return res.json({ user: null });
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(auth.sub) as any;
    res.json({ user: row ? publicUser(row) : null });
  });

  app.post("/api/auth/change-password", requireAuth, async (req: Request, res: Response) => {
    const auth = (req as Request & { auth?: { sub: string } }).auth!;
    const { currentPassword, newPassword } = req.body ?? {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" });
    }
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(auth.sub) as any;
    if (!row || !(await verifyPassword(String(currentPassword), row.password_hash))) {
      return res.status(401).json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
    }
    const hash = await hashPassword(String(newPassword));
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
      hash,
      auth.sub,
    );
    res.json({ ok: true });
  });

  /* --------------------------- config ---------------------------------- */

  app.get("/api/config", (_req: Request, res: Response) => {
    const row = db.prepare("SELECT value FROM settings WHERE key = ?").get("site_config") as { value: string } | undefined;
    if (!row) {
      return res.status(404).json({ error: "not_configured" });
    }
    try {
      res.json(JSON.parse(row.value));
    } catch {
      res.status(404).json({ error: "not_configured" });
    }
  });

  app.post("/api/config", requireAdmin, (req: Request, res: Response) => {
    const body = req.body;
    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "ข้อมูลไม่ถูกต้อง" });
    }
    const configStr = JSON.stringify(body);
    db.prepare(
      "INSERT INTO settings (key, value) VALUES ('site_config', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).run(configStr);
    res.json({ ok: true });
  });

  /* --------------------------- products -------------------------------- */

  // Public storefront list: active + not hidden.
  app.get("/api/products", (_req: Request, res: Response) => {
    const rows = db
      .prepare(
        `SELECT * FROM products
         WHERE is_active = 1 AND status != 'hidden'
         ORDER BY sort_order ASC, created_at DESC`,
      )
      .all() as ProductRow[];
    res.json(rows.map(serializeProduct));
  });

  // Admin list: everything.
  app.get("/api/products/all", requireAdmin, (_req: Request, res: Response) => {
    const rows = db
      .prepare("SELECT * FROM products ORDER BY sort_order ASC, created_at DESC")
      .all() as ProductRow[];
    res.json(rows.map(serializeProduct));
  });

  app.post("/api/products", requireAdmin, (req: Request, res: Response) => {
    const validated = productSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ error: validated.error.issues[0].message });
    }
    const b = validated.data;
    const id = newId("product");
    const ts = nowIso();
    db.prepare(
      `INSERT INTO products
         (id, name, price, category, image_url, description, stock, is_active, sort_order, tiers, status, total_sold, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      b.name ?? "สินค้าใหม่",
      b.price ?? "฿0",
      b.category ?? "สินค้าทั่วไป",
      b.image_url ?? "",
      b.description ?? "",
      b.stock ?? 0,
      b.is_active === false ? 0 : 1,
      b.sort_order ?? 0,
      JSON.stringify(b.tiers ?? []),
      b.status ?? "active",
      b.total_sold ?? 0,
      ts,
      ts,
    );
    const row = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as ProductRow;
    res.json(serializeProduct(row));
  });

  app.patch("/api/products/:id", requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as ProductRow | undefined;
    if (!existing) return res.status(404).json({ error: "not found" });

    const validated = productSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ error: validated.error.issues[0].message });
    }
    const b = validated.data;
    const fields: string[] = [];
    const values: unknown[] = [];
    const set = (col: string, val: unknown) => {
      fields.push(`${col} = ?`);
      values.push(val);
    };
    if (b.name !== undefined) set("name", b.name);
    if (b.price !== undefined) set("price", b.price);
    if (b.category !== undefined) set("category", b.category);
    if (b.image_url !== undefined) set("image_url", b.image_url);
    if (b.description !== undefined) set("description", b.description);
    if (b.stock !== undefined) set("stock", b.stock);
    if (b.is_active !== undefined) set("is_active", b.is_active ? 1 : 0);
    if (b.sort_order !== undefined) set("sort_order", b.sort_order);
    if (b.tiers !== undefined) set("tiers", JSON.stringify(b.tiers));
    if (b.status !== undefined) set("status", b.status);
    if (b.total_sold !== undefined) set("total_sold", b.total_sold);

    if (fields.length === 0) {
      return res.json(serializeProduct(existing));
    }

    set("updated_at", nowIso());
    db.prepare(`UPDATE products SET ${fields.join(", ")} WHERE id = ?`).run(...values, id);
    const row = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as ProductRow;
    res.json(serializeProduct(row));
  });

  app.delete("/api/products/:id", requireAdmin, (req: Request, res: Response) => {
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
  });

  /* ---------------------------- coupons -------------------------------- */

  app.get("/api/coupons", (_req: Request, res: Response) => {
    const rows = db.prepare("SELECT * FROM coupons ORDER BY created_at DESC").all() as any[];
    res.json(rows.map((r) => ({ ...r, active: r.active === 1 })));
  });

  app.post("/api/coupons", requireAdmin, (req: Request, res: Response) => {
    const validated = couponSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ error: validated.error.issues[0].message });
    }
    const b = validated.data;
    const id = newId("coupon");
    const ts = nowIso();
    try {
      db.prepare(
        `INSERT INTO coupons (id, code, discount_type, discount_value, active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        b.code,
        b.discount_type,
        b.discount_value,
        b.active === false ? 0 : 1,
        ts,
        ts,
      );
    } catch (err) {
      return res.status(409).json({ error: "โค้ดคูปองซ้ำ" });
    }
    const row = db.prepare("SELECT * FROM coupons WHERE id = ?").get(id) as any;
    res.json({ ...row, active: row.active === 1 });
  });

  app.patch("/api/coupons/:id", requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const existing = db.prepare("SELECT * FROM coupons WHERE id = ?").get(id) as any;
    if (!existing) return res.status(404).json({ error: "not found" });
    const validated = couponSchema.partial().safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ error: validated.error.issues[0].message });
    }
    const b = validated.data;
    const fields: string[] = [];
    const values: unknown[] = [];
    const set = (col: string, val: unknown) => {
      fields.push(`${col} = ?`);
      values.push(val);
    };
    if (b.code !== undefined) set("code", b.code);
    if (b.discount_type !== undefined) set("discount_type", b.discount_type);
    if (b.discount_value !== undefined) set("discount_value", b.discount_value);
    if (b.active !== undefined) set("active", b.active ? 1 : 0);

    if (fields.length === 0) {
      return res.json({ ...existing, active: existing.active === 1 });
    }

    set("updated_at", nowIso());
    db.prepare(`UPDATE coupons SET ${fields.join(", ")} WHERE id = ?`).run(...values, id);
    const row = db.prepare("SELECT * FROM coupons WHERE id = ?").get(id) as any;
    res.json({ ...row, active: row.active === 1 });
  });

  app.delete("/api/coupons/:id", requireAdmin, (req: Request, res: Response) => {
    db.prepare("DELETE FROM coupons WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
  });

  /* --------------------------- categories ------------------------------ */

  app.get("/api/categories", (_req: Request, res: Response) => {
    const rows = db
      .prepare("SELECT * FROM categories ORDER BY sort_order ASC, created_at ASC")
      .all() as any[];
    res.json(rows.map((r) => ({ ...r, is_active: r.is_active === 1 })));
  });

  app.post("/api/categories", requireAdmin, (req: Request, res: Response) => {
    const validated = categorySchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ error: validated.error.issues[0].message });
    }
    const b = validated.data;
    const id = newId("cat");
    const ts = nowIso();
    db.prepare(
      `INSERT INTO categories (id, name, image_url, sort_order, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, b.name, b.image_url ?? "", b.sort_order ?? 0, b.is_active === false ? 0 : 1, ts, ts);
    const row = db.prepare("SELECT * FROM categories WHERE id = ?").get(id) as any;
    res.json({ ...row, is_active: row.is_active === 1 });
  });

  app.patch("/api/categories/:id", requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const existing = db.prepare("SELECT * FROM categories WHERE id = ?").get(id) as any;
    if (!existing) return res.status(404).json({ error: "not found" });
    const validated = categorySchema.partial().safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ error: validated.error.issues[0].message });
    }
    const b = validated.data;
    const fields: string[] = [];
    const values: unknown[] = [];
    const set = (col: string, val: unknown) => {
      fields.push(`${col} = ?`);
      values.push(val);
    };
    if (b.name !== undefined) set("name", b.name);
    if (b.image_url !== undefined) set("image_url", b.image_url);
    if (b.sort_order !== undefined) set("sort_order", b.sort_order);
    if (b.is_active !== undefined) set("is_active", b.is_active ? 1 : 0);

    if (fields.length === 0) {
      return res.json({ ...existing, is_active: existing.is_active === 1 });
    }

    set("updated_at", nowIso());
    
    // Perform updates inside a transaction to ensure integrity
    const runUpdate = db.transaction(() => {
      db.prepare(`UPDATE categories SET ${fields.join(", ")} WHERE id = ?`).run(...values, id);
      if (b.name !== undefined && b.name !== existing.name) {
        db.prepare("UPDATE products SET category = ? WHERE category = ?").run(b.name, existing.name);
      }
    });
    runUpdate();

    const row = db.prepare("SELECT * FROM categories WHERE id = ?").get(id) as any;
    res.json({ ...row, is_active: row.is_active === 1 });
  });

  app.delete("/api/categories/:id", requireAdmin, (req: Request, res: Response) => {
    const existing = db.prepare("SELECT * FROM categories WHERE id = ?").get(req.params.id) as any;
    
    const runDelete = db.transaction(() => {
      if (existing) {
        db.prepare("UPDATE products SET category = '' WHERE category = ?").run(existing.name);
      }
      db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
    });
    runDelete();
    
    res.json({ ok: true });
  });

  /* ----------------------------- users (admin) ----------------------- */

  app.get("/api/users", requireAdmin, (_req: Request, res: Response) => {
    const rows = db
      .prepare("SELECT id, email, display_name, avatar_url, balance, created_at FROM users ORDER BY created_at DESC")
      .all() as any[];

    // Attach order count + total spent per user
    const orderStats = db.prepare(
      "SELECT user_id, COUNT(*) AS order_count, COALESCE(SUM(total), 0) AS total_spent FROM orders GROUP BY user_id"
    ).all() as { user_id: string; order_count: number; total_spent: number }[];

    const statsMap = new Map(orderStats.map((s) => [s.user_id, s]));

    res.json(
      rows.map((r) => {
        const stats = statsMap.get(r.id);
        return {
          ...r,
          order_count: stats?.order_count ?? 0,
          total_spent: stats?.total_spent ?? 0,
        };
      })
    );
  });

  app.get("/api/admin/orders", requireAdmin, (_req: Request, res: Response) => {
    const rows = db
      .prepare(`
        SELECT o.*, u.email as user_email, u.display_name as user_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
      `)
      .all() as any[];
    res.json(rows);
  });

  app.patch("/api/users/:id", requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
    if (!existing) return res.status(404).json({ error: "ไม่พบผู้ใช้งาน" });

    const { balance, display_name } = req.body ?? {};
    const fields: string[] = [];
    const values: unknown[] = [];
    const set = (col: string, val: unknown) => {
      fields.push(`${col} = ?`);
      values.push(val);
    };

    if (balance !== undefined && typeof balance === "number") set("balance", balance);
    if (display_name !== undefined && typeof display_name === "string") set("display_name", display_name);

    if (fields.length === 0) {
      return res.json(publicUser(existing));
    }

    db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...values, id);
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
    res.json(publicUser(row));
  });

  /* ---------------------------- commerce ------------------------------ */

  // POST /api/checkout
  app.post("/api/checkout", requireAuth, (req: Request, res: Response) => {
    const auth = (req as Request & { auth?: { sub: string } }).auth!;
    const { productId, tierId, quantity, couponCode } = req.body ?? {};

    if (!productId || !tierId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: "ข้อมูลสำหรับทำรายการไม่ครบถ้วน" });
    }

    const runTransaction = db.transaction(() => {
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(auth.sub) as any;
      if (!user) throw new Error("ไม่พบผู้ใช้งานนี้ในระบบ");

      const product = db.prepare("SELECT * FROM products WHERE id = ?").get(productId) as ProductRow | undefined;
      if (!product || product.is_active !== 1 || product.status === "hidden") {
        throw new Error("ไม่พบสินค้านี้หรือสินค้าปิดบริการอยู่");
      }

      const tiers = safeParse<any[]>(product.tiers, []);
      const tier = tiers.find((t) => t.id === tierId);
      if (!tier) throw new Error("ไม่พบตัวเลือกสินค้าที่เลือก");
      if (tier.stock < quantity) {
        throw new Error(`สินค้าหมดชั่วคราว คงเหลือ ${tier.stock} ชิ้น`);
      }

      // Calculate prices
      const subtotal = tier.price * quantity;
      let discount = 0;

      if (couponCode) {
        const coupon = db.prepare("SELECT * FROM coupons WHERE code = ? AND active = 1").get(couponCode.trim().toUpperCase()) as any;
        if (coupon) {
          if (coupon.discount_type === "percent") {
            discount = Math.round((subtotal * coupon.discount_value) / 100);
          } else {
            discount = Math.min(coupon.discount_value, subtotal);
          }
        }
      }

      const total = Math.max(0, subtotal - discount);

      if (user.balance < total) {
        throw new Error(`ยอดเงินคงเหลือไม่เพียงพอ (ต้องการ ฿${total.toLocaleString("th-TH")}, คุณมี ฿${user.balance.toLocaleString("th-TH")})`);
      }

      // Deduct balance
      const newBalance = user.balance - total;
      db.prepare("UPDATE users SET balance = ? WHERE id = ?").run(newBalance, auth.sub);

      // Update stock in tiers
      const updatedTiers = tiers.map((t) => {
        if (t.id === tierId) {
          return { ...t, stock: t.stock - quantity };
        }
        return t;
      });

      const newStock = product.stock - quantity;
      const newTotalSold = product.total_sold + quantity;

      db.prepare(
        "UPDATE products SET tiers = ?, stock = ?, total_sold = ?, updated_at = ? WHERE id = ?"
      ).run(
        JSON.stringify(updatedTiers),
        newStock,
        newTotalSold,
        nowIso(),
        productId
      );

      // Generate digital product license key/code
      const makeKeySeg = () => Math.random().toString(36).substring(2, 6).toUpperCase();
      const licenseKey = `SYNX-${makeKeySeg()}-${makeKeySeg()}-${makeKeySeg()}`;

      // Create order record
      const orderId = newId("order");
      const ts = nowIso();
      db.prepare(
        `INSERT INTO orders (id, user_id, product_id, product_name, tier_id, tier_label, quantity, price, total, code_key, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        orderId,
        auth.sub,
        productId,
        product.name,
        tierId,
        tier.label,
        quantity,
        tier.price,
        total,
        licenseKey,
        ts
      );

      return {
        id: orderId,
        product_name: product.name,
        tier_label: tier.label,
        quantity,
        price: tier.price,
        total,
        code_key: licenseKey,
        created_at: ts
      };
    });

    try {
      const order = runTransaction();
      res.json({ success: true, order });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // POST /api/topup
  app.post("/api/topup", requireAuth, (req: Request, res: Response) => {
    const auth = (req as Request & { auth?: { sub: string } }).auth!;
    const { code } = req.body ?? {};

    if (!code) {
      return res.status(400).json({ error: "กรุณาระบุรหัสคูปองเติมเงิน" });
    }

    const cleanCode = code.trim().toUpperCase();

    const runTransaction = db.transaction(() => {
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(auth.sub) as any;
      if (!user) throw new Error("ไม่พบผู้ใช้งานนี้ในระบบ");

      const voucher = db.prepare("SELECT * FROM vouchers WHERE code = ?").get(cleanCode) as any;
      if (!voucher) throw new Error("ไม่พบรหัสคูปองนี้ในระบบ");
      if (voucher.is_used === 1) throw new Error("รหัสคูปองนี้ถูกใช้งานไปแล้ว");

      const ts = nowIso();
      // Mark voucher used
      db.prepare(
        "UPDATE vouchers SET is_used = 1, used_by = ?, used_at = ? WHERE id = ?"
      ).run(auth.sub, ts, voucher.id);

      // Add balance
      const newBalance = user.balance + voucher.amount;
      db.prepare("UPDATE users SET balance = ? WHERE id = ?").run(newBalance, auth.sub);

      return {
        amount: voucher.amount,
        balance: newBalance
      };
    });

    try {
      const result = runTransaction();
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // GET /api/orders
  app.get("/api/orders", requireAuth, (req: Request, res: Response) => {
    const auth = (req as Request & { auth?: { sub: string } }).auth!;
    const rows = db.prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC").all(auth.sub) as any[];
    res.json(rows);
  });

  // GET /api/topups
  app.get("/api/topups", requireAuth, (req: Request, res: Response) => {
    const auth = (req as Request & { auth?: { sub: string } }).auth!;
    // SELECT vouchers used by this user
    const rows = db.prepare("SELECT * FROM vouchers WHERE used_by = ? ORDER BY used_at DESC").all(auth.sub) as any[];
    res.json(rows);
  });
}
