import { api, errorMessage } from "$lib/api";
import { broadcast, onSync } from "$lib/sync";
import { isAdminGranted } from "$lib/admin-access";
import type { SiteConfig, StatusItem, SyncXProduct } from "$lib/types";
import { isDarkColor } from "$lib/utils";

const STORAGE_KEY = "syncx-site-config-v1";
const MODE_KEY = "syncx-theme-mode";

export const appleTheme: SiteConfig["theme"] = {
  mode: "light",
  accentColor: "#1d1d1f",
  backgroundColor: "#ffffff",
  buttonColor: "#1d1d1f",
  cardColor: "#ffffff",
  textColor: "#1d1d1f",
  mutedTextColor: "#6e6e73",
  borderColor: "rgba(0, 0, 0, 0.08)",
};

const darkSurfaces = {
  accentColor: "#f5f5f7",
  backgroundColor: "#000000",
  buttonColor: "#f5f5f7",
  cardColor: "#1c1c1e",
  textColor: "#f5f5f7",
  mutedTextColor: "#98989d",
  borderColor: "rgba(255, 255, 255, 0.1)",
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
  searchButtonText: "ค้นหาสินค้า",
  announcementTitle: "ยินดีต้อนรับ",
  announcementBody:
    "ยินดีต้อนรับเข้าสู่ร้านค้าออนไลน์ SLATZ STUDIO ของเรา! แอดมินพร้อมบริการตลอด 24 ชั่วโมง",
  announcementLink: "ไปที่ร้านค้า",
  status: {
    mode: "ok",
    kicker: "ประกาศ",
    headline: "ระบบทำงานตามปกติ",
    body: "ร้านค้าเปิดให้สั่งซื้อและเติมเงินได้ตามปกติ",
    updated: "",
    items: [
      { id: "site", label: "เว็บไซต์", detail: "ใช้งานได้ปกติ", tone: "ok" },
      {
        id: "orders",
        label: "สั่งซื้อสินค้า",
        detail: "ใช้งานได้ปกติ",
        tone: "ok",
      },
      { id: "topup", label: "เติมเงิน", detail: "ใช้งานได้ปกติ", tone: "ok" },
      {
        id: "contact",
        label: "ติดต่อทีมงานทาง Discord / Facebook",
        detail: "ติดต่อได้ตามปกติ",
        tone: "ok",
      },
    ],
  },
  home: {
    heroAlign: "center",
    heroSize: "lg",
    statementAlign: "left",
    statementSize: "md",
    statementSpace: "normal",
    titleSize: "md",
  },
  stats: {
    heading: "ตัวเลขที่ลูกค้าไว้วางใจ",
    live: true,
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
  theme: { ...appleTheme, mode: "dark" },
  footer: {
    brandText: "SLATZ - ร้านค้าออนไลน์ที่คุณไว้วางใจ",
    contactEmail: "contact@slatz.xyz",
    discordUrl: "https://discord.com",
    lineUrl: "",
    facebookUrl: "",
    instagramUrl: "",
    rights: "สงวนลิขสิทธิ์",
    country: "ประเทศไทย",
  },
  store: {
    headline: "ร้านค้า",
    headlineAccent: "วิธีที่ดีที่สุดในการเลือกซื้อสิ่งที่คุณชอบ",
    sectionTitle: "สินค้าทั้งหมด",
    categoryTitle: "เลือกซื้อตามหมวดหมู่",
    latestTitle: "ของเข้าใหม่",
    latestAccent: "สินค้าที่คัดมาให้คุณ",
    emptyStateText: "ไม่พบสินค้า กรุณากลับมาดูอีกครั้ง",
    productButtonText: "ดูรายละเอียด",
    learnMoreText: "เรียนรู้เพิ่มเติม",
    buyText: "ซื้อ",
    checkoutText: "ซื้อเลย",
  },
  products: [],
};

/** Previous built-in palettes; saved configs still on one of these get the current default. */
const legacyThemes = [
  {
    accentColor: "#e60039",
    backgroundColor: "#050506",
    buttonColor: "#e60039",
  },
  {
    accentColor: "#0071e3",
    backgroundColor: "#f5f5f7",
    buttonColor: "#0071e3",
  },
];

function upgradeTheme(
  theme: Partial<SiteConfig["theme"]> | undefined
): SiteConfig["theme"] {
  if (!theme) return { ...appleTheme, mode: "dark" };
  const legacy = legacyThemes.some(
    t =>
      t.accentColor === theme.accentColor?.toLowerCase() &&
      t.backgroundColor === theme.backgroundColor?.toLowerCase() &&
      t.buttonColor === theme.buttonColor?.toLowerCase()
  );
  const saved = legacy ? {} : theme;
  const background = saved.backgroundColor?.toLowerCase();
  const paintedDark = background === "#000000" || background === "#0b0b0c";
  const mode =
    saved.mode === "light" || saved.mode === "dark"
      ? saved.mode
      : paintedDark
        ? "dark"
        : "light";
  const colors =
    !saved.mode && paintedDark ? appleTheme : { ...appleTheme, ...saved };
  return { ...colors, mode };
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
    sortOrder: 0,
  };
}

function mergeStatus(
  saved: Partial<SiteConfig["status"]> | undefined
): SiteConfig["status"] {
  const base = defaultSiteConfig.status;
  if (!saved) return structuredClone(base);
  const items: StatusItem[] = Array.isArray(saved.items)
    ? saved.items.flatMap(item => {
        if (!item || typeof item.label !== "string") return [];
        return [
          {
            id:
              typeof item.id === "string" && item.id
                ? item.id
                : crypto.randomUUID(),
            label: item.label,
            detail: typeof item.detail === "string" ? item.detail : "",
            tone: item.tone === "warn" ? "warn" : "ok",
          },
        ];
      })
    : structuredClone(base.items);
  return {
    mode: saved.mode === "maintenance" ? "maintenance" : "ok",
    kicker: typeof saved.kicker === "string" ? saved.kicker : base.kicker,
    headline:
      typeof saved.headline === "string" ? saved.headline : base.headline,
    body: typeof saved.body === "string" ? saved.body : base.body,
    updated: typeof saved.updated === "string" ? saved.updated : base.updated,
    items,
  };
}

/**
 * A view-transition snapshot of a live WebGL canvas clears its drawing buffer and
 * drops the context. Swap in a still image for the crossfade, then put the canvas back.
 */
function parkCanvases() {
  const parked: { canvas: HTMLCanvasElement; image: HTMLImageElement }[] = [];
  for (const canvas of document.querySelectorAll("canvas")) {
    if (!(canvas instanceof HTMLCanvasElement) || !canvas.isConnected) continue;
    const image = document.createElement("img");
    image.className = canvas.className;
    image.alt = "";
    try {
      image.src = canvas.toDataURL("image/jpeg", 0.8);
    } catch {
      image.removeAttribute("src");
    }
    canvas.replaceWith(image);
    parked.push({ canvas, image });
  }
  return () => {
    for (const { canvas, image } of parked) {
      if (image.isConnected) image.replaceWith(canvas);
    }
  };
}

/** Crossfades the page when the theme changes. Falls back to an instant swap. */
export function animateTheme(apply: () => void) {
  const restore = parkCanvases();
  const settle = () => {
    restore();
    document.dispatchEvent(new Event("syncx-theme-settled"));
  };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const start = document.startViewTransition?.bind(document);
  if (reduce || !start) {
    apply();
    settle();
    return;
  }
  start(apply).finished.then(settle, settle);
}

export function mergeConfig(input: unknown): SiteConfig {
  if (!input || typeof input !== "object")
    return structuredClone(defaultSiteConfig);
  const saved = input as Partial<SiteConfig>;
  return structuredClone({
    ...defaultSiteConfig,
    ...saved,
    stats: { ...defaultSiteConfig.stats, ...(saved.stats ?? {}) },
    theme: upgradeTheme(saved.theme),
    footer: { ...defaultSiteConfig.footer, ...(saved.footer ?? {}) },
    home: { ...defaultSiteConfig.home, ...(saved.home ?? {}) },
    store: { ...defaultSiteConfig.store, ...(saved.store ?? {}) },
    status: mergeStatus(saved.status),
    products: Array.isArray(saved.products)
      ? saved.products.map(product => ({
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
  const dark = theme.mode === "dark";
  const palette = dark ? { ...theme, ...darkSurfaces } : theme;
  const keepAccent =
    dark &&
    !isDarkColor(theme.accentColor) &&
    theme.accentColor.toLowerCase() !== "#f5f5f7";
  const onButton = isDarkColor(palette.buttonColor) ? "#ffffff" : "#0b0b0c";
  root.dataset.theme = dark ? "dark" : "light";
  root.style.setProperty(
    "--syncx-accent",
    keepAccent ? theme.accentColor : palette.accentColor
  );
  root.style.setProperty("--syncx-button", palette.buttonColor);
  root.style.setProperty("--syncx-bg", palette.backgroundColor);
  root.style.setProperty("--syncx-card", palette.cardColor);
  root.style.setProperty("--syncx-text", palette.textColor);
  root.style.setProperty("--syncx-muted", palette.mutedTextColor);
  root.style.setProperty("--syncx-border", palette.borderColor);
  root.style.setProperty("--primary-foreground", onButton);
  root.style.setProperty("--sidebar-primary-foreground", onButton);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", palette.backgroundColor);
}

/**
 * Admin-editable storefront settings. Fields are deeply reactive, so admin forms can
 * `bind:value` straight into `config`; `sync()` (run from a root-layout effect) mirrors
 * every change to the DOM, localStorage and — for admins — the server.
 */
export class SiteConfigStore {
  config = $state<SiteConfig>(loadLocal());
  saveState = $state<"idle" | "pending" | "saving" | "saved" | "error">("idle");
  saveError = $state<string | null>(null);
  savedAt = $state<Date | null>(null);
  #saveTimer: ReturnType<typeof setTimeout> | undefined;
  #skipNextSave = true;

  constructor() {
    onSync(message => {
      if (message.type !== "config") return;
      this.#skipNextSave = true;
      this.config = mergeConfig(message.config);
    });
  }

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
      const pref = localStorage.getItem(MODE_KEY);
      if (pref === "light" || pref === "dark") this.config.theme.mode = pref;
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
    document
      .querySelectorAll<HTMLLinkElement>('link[rel="icon"]')
      .forEach(link => (link.href = favicon));

    if (this.#skipNextSave) {
      this.#skipNextSave = false;
      return;
    }
    if (!isAdminGranted()) return;
    this.saveState = "pending";
    clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(() => void this.#save(), 500);
  }

  /** Persists to the server; storefront tabs pick the change up through the sync channel. */
  async #save() {
    if (!isAdminGranted()) return;
    const snapshot = $state.snapshot(this.config) as SiteConfig;
    this.saveState = "saving";
    try {
      await api.post("/api/config", snapshot);
      this.saveState = "saved";
      this.saveError = null;
      this.savedAt = new Date();
      broadcast({ type: "config", config: snapshot });
    } catch (err) {
      this.saveState = "error";
      this.saveError = errorMessage(err);
    }
  }

  retrySave() {
    void this.#save();
  }

  update(patch: Partial<SiteConfig>) {
    this.config = mergeConfig({ ...$state.snapshot(this.config), ...patch });
  }

  reset() {
    this.config = mergeConfig(null);
  }

  /** Dashboard choice. Fills the public status page and the store banner. */
  setStatusMode(mode: SiteConfig["status"]["mode"]) {
    const maintenance = mode === "maintenance";
    const copy = maintenance
      ? {
          headline: "เดี๋ยวเรากลับมา",
          body: "ขณะนี้ร้านค้าใช้งานไม่ได้ชั่วคราว ทีมงานกำลังเร่งแก้ไขอยู่",
          detail: "ใช้งานไม่ได้ชั่วคราว",
          tone: "warn" as const,
        }
      : {
          headline: "ระบบทำงานตามปกติ",
          body: "ร้านค้าเปิดให้สั่งซื้อและเติมเงินได้ตามปกติ",
          detail: "ใช้งานได้ปกติ",
          tone: "ok" as const,
        };
    this.config.status.mode = mode;
    this.config.status.kicker = "ประกาศ";
    this.config.status.headline = copy.headline;
    this.config.status.body = copy.body;
    for (const item of this.config.status.items) {
      const contact = /ติดต่อ|discord|facebook/i.test(item.label);
      item.tone = contact ? "ok" : copy.tone;
      item.detail = contact ? "ติดต่อได้ตามปกติ" : copy.detail;
    }
  }

  setMode(mode: SiteConfig["theme"]["mode"]) {
    this.config.theme.mode = mode;
    localStorage.setItem(MODE_KEY, mode);
  }

  toggleMode() {
    this.setMode(this.config.theme.mode === "dark" ? "light" : "dark");
  }

  resetTheme() {
    this.config.theme = { ...appleTheme, mode: this.config.theme.mode };
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
