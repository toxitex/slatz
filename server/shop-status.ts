import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const configFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "site-config.json");

/** Headline shown while the shop is paused, or null when checkout and top-up are open. */
export function shopPauseMessage(): string | null {
  try {
    const config = JSON.parse(fs.readFileSync(configFile, "utf8")) as {
      status?: { mode?: string; headline?: string };
    };
    if (config.status?.mode !== "maintenance") return null;
    const headline = config.status.headline?.trim();
    return headline || "ขณะนี้ร้านค้าใช้งานไม่ได้ชั่วคราว";
  } catch {
    return null;
  }
}
