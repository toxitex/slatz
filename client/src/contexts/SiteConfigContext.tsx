import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/lib/api";

/**
 * Design philosophy reminder: Cyber-Noir Thai Commerce.
 * This context keeps every admin-editable value source-readable, localStorage-backed, and visually tied to the black neon SyncX storefront rather than introducing a backend dependency.
 */

const STORAGE_KEY = "syncx-site-config-v1";

export type ProductTier = {
  id: string;
  label: string;
  price: number;
  stock: number;
};

export type ProductStatus = "active" | "out_of_stock" | "hidden";

export type SyncXProduct = {
  id: string;
  name: string;
  price: string;
  category: string;
  imageUrl: string;
  description: string;
  tiers?: ProductTier[];
  status?: ProductStatus;
  totalSold?: number;
};

export type Coupon = {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  active: boolean;
};

export type Category = {
  id: string;
  name: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
};

export type SiteConfig = {
  siteName: string;
  seoDescription: string;
  logoText: string;
  logoImageUrl: string;
  heroImageUrl: string;
  heroHeadline: string;
  heroSubtitle: string;
  ctaText: string;
  searchPlaceholder: string;
  announcementTitle: string;
  announcementBody: string;
  stats: {
    users: string;
    products: string;
    stock: string;
    sold: string;
    usersLabel: string;
    usersUnit: string;
    productsLabel: string;
    productsUnit: string;
    stockLabel: string;
    stockUnit: string;
    soldLabel: string;
    soldUnit: string;
  };
  theme: {
    accentColor: string;
    backgroundColor: string;
    buttonColor: string;
    cardColor: string;
    textColor: string;
    mutedTextColor: string;
    borderColor: string;
  };
  footer: {
    brandText: string;
    contactEmail: string;
    discordUrl: string;
    lineUrl: string;
    facebookUrl: string;
    instagramUrl: string;
  };
  store: {
    sectionTitle: string;
    emptyStateText: string;
    productButtonText: string;
  };
  products: SyncXProduct[];
};

type SiteConfigContextValue = {
  config: SiteConfig;
  updateConfig: (patch: Partial<SiteConfig>) => void;
  updateSection: <K extends keyof SiteConfig>(section: K, value: SiteConfig[K]) => void;
  updateProduct: (productId: string, patch: Partial<SyncXProduct>) => void;
  addProduct: () => void;
  deleteProduct: (productId: string) => void;
  resetConfig: () => void;
  exportConfig: () => string;
  importConfig: (json: string) => boolean;
};

export const defaultSiteConfig: SiteConfig = {
  siteName: "SLATZ",
  seoDescription: "SLATZ - ร้านค้าออนไลน์ที่คุณไว้วางใจ",
  logoText: "SLATZ",
  logoImageUrl: "",
  heroImageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663586379992/FfqDgriCGyFAHE6z7esQnJ/syncx-neon-ribbon-hero-SFfrtkKQ7tjNVJX2txp2nR.webp",
  heroHeadline: "SLATZ STUDIO",
  heroSubtitle: "แอดมินพร้อมบริการ 24 ชม.",
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
  theme: {
    accentColor: "#e60039",
    backgroundColor: "#050506",
    buttonColor: "#e60039",
    cardColor: "rgba(12, 12, 14, 0.72)",
    textColor: "#ffffff",
    mutedTextColor: "#9ca3af",
    borderColor: "rgba(255,255,255,0.08)",
  },
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

function createProduct(): SyncXProduct {
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

function mergeConfig(input: unknown): SiteConfig {
  if (!input || typeof input !== "object") return defaultSiteConfig;
  const saved = input as Partial<SiteConfig>;

  return {
    ...defaultSiteConfig,
    ...saved,
    stats: {
      ...defaultSiteConfig.stats,
      ...(saved.stats ?? {}),
    },
    theme: {
      ...defaultSiteConfig.theme,
      ...(saved.theme ?? {}),
    },
    footer: {
      ...defaultSiteConfig.footer,
      ...(saved.footer ?? {}),
    },
    store: {
      ...defaultSiteConfig.store,
      ...(saved.store ?? {}),
    },
    products: Array.isArray(saved.products) ? saved.products.map((product) => ({ ...createProduct(), ...product, tiers: Array.isArray(product?.tiers) ? product.tiers : [] })) : defaultSiteConfig.products,
  };
}

async function fetchServerConfig(): Promise<SiteConfig | null> {
  try {
    const data = await api.get<SiteConfig>("/api/config");
    return data ? mergeConfig(data) : null;
  } catch {
    return null;
  }
}

async function saveServerConfig(config: SiteConfig): Promise<void> {
  try {
    await api.post("/api/config", config);
  } catch {
    // silent — localStorage is the fallback
  }
}

function loadConfig(): SiteConfig {
  if (typeof window === "undefined") return defaultSiteConfig;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSiteConfig;
    return mergeConfig(JSON.parse(raw));
  } catch {
    return defaultSiteConfig;
  }
}

function applyThemeVariables(config: SiteConfig) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--syncx-accent", config.theme.accentColor);
  root.style.setProperty("--syncx-button", config.theme.buttonColor);
  root.style.setProperty("--syncx-bg", config.theme.backgroundColor);
  root.style.setProperty("--syncx-card", config.theme.cardColor);
  root.style.setProperty("--syncx-glow", `${config.theme.accentColor}55`);
  root.style.setProperty("--syncx-text", config.theme.textColor);
  root.style.setProperty("--syncx-muted", config.theme.mutedTextColor);
  root.style.setProperty("--syncx-border", config.theme.borderColor);

  // Compute gradient from background color: derive 4 subtle stops mixing bg + accent hints
  const bg = config.theme.backgroundColor;
  const accent = config.theme.accentColor;
  const gradient = `linear-gradient(160deg, color-mix(in srgb, ${bg} 85%, ${accent} 15%) 0%, ${bg} 32%, color-mix(in srgb, ${bg} 90%, ${accent} 10%) 64%, color-mix(in srgb, ${bg} 88%, ${accent} 12%) 100%)`;
  root.style.setProperty("--syncx-bg-gradient", gradient);
}

const SiteConfigContext = createContext<SiteConfigContextValue | undefined>(undefined);

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(() => loadConfig());

  // On mount: prefer server config, fall back to localStorage
  useEffect(() => {
    fetchServerConfig().then((serverConfig) => {
      if (serverConfig) {
        setConfig(serverConfig);
      } else {
        // If server config is not set (e.g., first run), save current config (local) to server
        saveServerConfig(config);
      }
    });
  }, []);

  useEffect(() => {
    applyThemeVariables(config);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    document.title = config.siteName || defaultSiteConfig.siteName;

    // Dynamic favicon: use admin-uploaded logo when available, fallback to static file
    const faviconUrl = config.logoImageUrl || "/favicon.png";
    const iconLinks = document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]');
    iconLinks.forEach((link) => {
      link.href = faviconUrl;
    });

    // Debounce server save by 500ms to avoid database locks and API spamming
    const timeoutId = setTimeout(() => {
      saveServerConfig(config);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [config]);

  const updateConfig = useCallback((patch: Partial<SiteConfig>) => {
    setConfig((current) => mergeConfig({ ...current, ...patch }));
  }, []);

  const updateSection = useCallback(<K extends keyof SiteConfig>(section: K, value: SiteConfig[K]) => {
    setConfig((current) => mergeConfig({ ...current, [section]: value }));
  }, []);

  const updateProduct = useCallback((productId: string, patch: Partial<SyncXProduct>) => {
    setConfig((current) => ({
      ...current,
      products: current.products.map((product) => (product.id === productId ? { ...product, ...patch } : product)),
    }));
  }, []);

  const addProduct = useCallback(() => {
    setConfig((current) => ({ ...current, products: [createProduct(), ...current.products] }));
  }, []);

  const deleteProduct = useCallback((productId: string) => {
    setConfig((current) => ({ ...current, products: current.products.filter((product) => product.id !== productId) }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(defaultSiteConfig);
  }, []);

  const exportConfig = useCallback(() => JSON.stringify(config, null, 2), [config]);

  const importConfig = useCallback((json: string) => {
    try {
      setConfig(mergeConfig(JSON.parse(json)));
      return true;
    } catch (error) {
      console.warn("SyncX config import failed.", error);
      return false;
    }
  }, []);

  const value = useMemo(
    () => ({ config, updateConfig, updateSection, updateProduct, addProduct, deleteProduct, resetConfig, exportConfig, importConfig }),
    [addProduct, config, deleteProduct, exportConfig, importConfig, resetConfig, updateConfig, updateProduct, updateSection],
  );

  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
}

export function useSiteConfig() {
  const value = useContext(SiteConfigContext);
  if (!value) {
    throw new Error("useSiteConfig must be used inside SiteConfigProvider");
  }
  return value;
}
