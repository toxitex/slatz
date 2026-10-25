import "./env.js";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { randomBytes } from "crypto";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes.js";
import { requireAdmin } from "./auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vite reads .env.local for the dashboard. Load the same files here so the admin
// password the form checks is the password the API accepts.
const envFromProcess = new Set(Object.keys(process.env));
for (const name of [".env", ".env.local"]) {
  const file = path.resolve(__dirname, "..", name);
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (envFromProcess.has(key)) continue;
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

const DATA_DIR = path.resolve(__dirname, "..", "data");
const CONFIG_FILE = path.join(DATA_DIR, "site-config.json");
const UPLOADS_DIR = path.resolve(__dirname, "..", "public", "uploads");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

async function startServer() {
  ensureDataDir();

  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "10mb" }));
  app.use(express.raw({ type: "image/*", limit: "10mb" }));
  app.use(cookieParser());

  // --- Upload API (logo and images) ---
  app.post("/api/upload", requireAdmin, (req, res) => {
    try {
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ error: "No image data" });
      }

      const contentType = req.headers["content-type"] || "";
      const ext = contentType.includes("png") ? "png" : contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : contentType.includes("webp") ? "webp" : "png";
      const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
      const filepath = path.join(UPLOADS_DIR, filename);

      fs.writeFileSync(filepath, req.body);
      res.json({ url: `/uploads/${filename}` });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: String(err) });
    }
  });

  // --- Config API (site branding/theme persistence) ---
  app.get("/api/config", (_req, res) => {
    try {
      if (!fs.existsSync(CONFIG_FILE)) return res.json(null);
      const raw = fs.readFileSync(CONFIG_FILE, "utf8");
      res.json(JSON.parse(raw));
    } catch {
      res.json(null);
    }
  });

  app.post("/api/config", requireAdmin, (req, res) => {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(req.body, null, 2), "utf8");
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // --- Data API (products / coupons / categories / auth) ---
  registerRoutes(app);

  // Admin uploads live outside the SPA build so redeploys don't wipe them.
  app.use("/uploads", express.static(UPLOADS_DIR, { maxAge: "30d", fallthrough: false }));

  // Static files
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log(`Server running on http://localhost:${port}/`));
}

startServer().catch(console.error);
