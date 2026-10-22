import { api } from "$lib/api";
import { isAdminGranted } from "$lib/admin-access";
import type { SiteConfig, SyncXProduct } from "$lib/types";

const STORAGE_KEY = "syncx-site-config-v1";

export const appleTheme: SiteConfig["theme"] = {
  accentColor: "#1d1d1f",
  backgroundColor: "#f5f5f7",
  buttonColor: "#1d1d1f",
  cardColor: "#ffffff",
  textColor: "#1d1d1f",
  mutedTextColor: "#6e6e73",
  borderColor: "rgba(0, 0, 0, 0.08)",
};

export const defaultSiteConfig: SiteConfig = {
  siteName: "SLATZ",
  seoDescription: "SLATZ - ร้านค้าออนไลน์ที่คุณไว้วางใจ",
  logoText: "SLATZ",
  logoImageUrl: "",
  heroImageUrl: "",
  heroHeadline: "SLATZ STUDIO",
  heroSubtitle: "แอดมินพร้อมบริการ 24 ชม.",
  heroMorphWords: "ของแท้ 100%, ได้ของทันที, บริการ 24 ชม.",
  ctaText: "เริ่มต้นเลย!",
  searchPlaceholder: "ค้นหาสินค้า หมวดหมู่...",
  announcementTitle: "ยินดีต้อนรับ",
  announcementBody: "ยินดีต้อนรับเข้าสู่ร้านค้าออนไลน์ SLATZ STUDIO ของเรา! แอดมินพร้อมบริการตลอด 24 ชั่วโมง",
  stats: {
    users: "112",
    products: "100",
    stock: "100",
    sold: "100",
    usersLabel: "ผู้ใช้งาน",
    usersUnit: "คน",
    productsLabel: "สินค้า",
    productsUnit: "รายการ",
    stockLabel: "คลังสินค้า",
    stockUnit: "ชิ้น",
    soldLabel: "ขายแล้ว",
    soldUnit: "ชิ้น",
  },
  theme: appleTheme,
  footer: {
    brandText: "SLATZ - ร้านค้าออนไลน์ที่คุณไว้วางใจ",
    contactEmail: "contact@slatz.xyz",
    discordUrl: "https://discord.com",
    lineUrl: "",
    facebookUrl: "",
    instagramUrl: "",
  },
  store: {
    sectionTitle: "สินค้าทั้งหมด",
    emptyStateText: "ไม่พบสินค้า กรุณากลับมาดูอีกครั้ง",
    productButtonText: "ดูรายละเอียด",
  },
  products: [],
};

/** Previous built-in palettes; saved configs still on one of these get the current default. */
const legacyThemes = [
  { accentColor: "#e60039", backgroundColor: "#050506", buttonColor: "#e60039" },
  { accentColor: "#0071e3", backgroundColor: "#f5f5f7", buttonColor: "#0071e3" },
];

function upgradeTheme(theme: Partial<SiteConfig["theme"]> | undefined): Partial<SiteConfig["theme"]> {
  if (!theme) return {};
  const legacy = legacyThemes.some(
    (t) =>
      t.accentColor === theme.accentColor?.toLowerCase() &&
      t.backgroundColor === theme.backgroundColor?.toLowerCase() &&
      t.buttonColor === theme.buttonColor?.toLowerCase(),
  );
  return legacy ? {} : theme;
}

export function createProductDraft(): SyncXProduct {
  return {
    id: `product-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: "สินค้าใหม่",
    price: "฿0",
    category: "สินค้าทั่วไป",
    imageUrl: "",
    description: "ใส่รายละเอียดสินค้าในแอดมินแดชบอร์ด",
    tiers: [],
    status: "active",
    totalSold: 0,
  };
}

export function mergeConfig(input: unknown): SiteConfig {
  if (!input || typeof input !== "object") return structuredClone(defaultSiteConfig);
  const saved = input as Partial<SiteConfig>;
  return structuredClone({
    ...defaultSiteConfig,
    ...saved,
    stats: { ...defaultSiteConfig.stats, ...(saved.stats ?? {}) },
    theme: { ...defaultSiteConfig.theme, ...upgradeTheme(saved.theme) },
    footer: { ...defaultSiteConfig.footer, ...(saved.footer ?? {}) },
    store: { ...defaultSiteConfig.store, ...(saved.store ?? {}) },
    products: Array.isArray(saved.products)
      ? saved.products.map((product) => ({
          ...createProductDraft(),
          ...product,
          tiers: Array.isArray(product?.tiers) ? product.tiers : [],
        }))
      : [],
  });
}

function loadLocal(): SiteConfig {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? mergeConfig(JSON.parse(raw)) : mergeConfig(null);
  } catch {
    return mergeConfig(null);
  }
}

function applyTheme(theme: SiteConfig["theme"]) {
  const root = document.documentElement;
  root.style.setProperty("--syncx-accent", theme.accentColor);
  root.style.setProperty("--syncx-button", theme.buttonColor);
  root.style.setProperty("--syncx-bg", theme.backgroundColor);
  root.style.setProperty("--syncx-card", theme.cardColor);
  root.style.setProperty("--syncx-text", theme.textColor);
  root.style.setProperty("--syncx-muted", theme.mutedTextColor);
  root.style.setProperty("--syncx-border", theme.borderColor);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme.backgroundColor);
}

/**
 * Admin-editable storefront settings. Fields are deeply reactive, so admin forms can
 * `bind:value` straight into `config`; `sync()` (run from a root-layout effect) mirrors
 * every change to the DOM, localStorage and — for admins — the server.
 */
export class SiteConfigStore {
  config = $state<SiteConfig>(loadLocal());
  #saveTimer: ReturnType<typeof setTimeout> | undefined;
  #skipNextSave = true;

  async load() {
    let server: SiteConfig | null = null;
    try {
      const data = await api.get<SiteConfig | null>("/api/config");
      server = data ? mergeConfig(data) : null;
    } catch {
      server = null;
    }
    if (server) {
      this.#skipNextSave = true;
      this.config = server;
    } else if (isAdminGranted()) {
      void this.#save();
    }
  }

  sync() {
    const snapshot = $state.snapshot(this.config) as SiteConfig;
    applyTheme(snapshot.theme);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    document.title = snapshot.siteName || defaultSiteConfig.siteName;
    const favicon = snapshot.logoImageUrl || "/favicon.png";
    document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]').forEach((link) => (link.href = favicon));

    if (this.#skipNextSave) {
      this.#skipNextSave = false;
      return;
    }
    clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(() => void this.#save(), 500);
  }

  async #save() {
    if (!isAdminGranted()) return;
    try {
      await api.post("/api/config", $state.snapshot(this.config));
    } catch {
      // localStorage remains the fallback copy
    }
  }

  update(patch: Partial<SiteConfig>) {
    this.config = mergeConfig({ ...$state.snapshot(this.config), ...patch });
  }

  reset() {
    this.config = mergeConfig(null);
  }

  resetTheme() {
    this.config.theme = { ...appleTheme };
  }

  export() {
    return JSON.stringify($state.snapshot(this.config), null, 2);
  }

  import(json: string) {
    try {
      this.config = mergeConfig(JSON.parse(json));
      return true;
    } catch (error) {
      console.warn("Config import failed.", error);
      return false;
    }
  }
}
