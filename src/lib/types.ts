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
  sortOrder?: number;
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
  /** Comma-separated phrases the hero headline morphs through after `heroHeadline`. */
  heroMorphWords: string;
  ctaText: string;
  searchPlaceholder: string;
  /** Label on the hero and store-menu search buttons. */
  searchButtonText: string;
  announcementTitle: string;
  announcementBody: string;
  /** Link under the home announcement. Empty hides the link. */
  announcementLink: string;
  stats: {
    heading: string;
    /** Show real numbers from /api/stats instead of the manual values below. */
    live: boolean;
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
    /** Light keeps the saved palette. Dark swaps the whole surface system. */
    mode: "light" | "dark";
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
    rights: string;
    country: string;
  };
  store: {
    headline: string;
    headlineAccent: string;
    sectionTitle: string;
    categoryTitle: string;
    latestTitle: string;
    latestAccent: string;
    emptyStateText: string;
    productButtonText: string;
    learnMoreText: string;
    buyText: string;
    checkoutText: string;
  };
  products: SyncXProduct[];
};

export type Order = {
  id: string;
  product_name: string;
  tier_label: string;
  quantity: number;
  total: number;
  code_key: string;
  created_at: string;
  price?: number;
  user_email?: string;
  user_name?: string;
};

export type Topup = {
  id: string;
  code: string;
  amount: number;
  used_at: string;
};

export type AdminUser = {
  id: string;
  email: string;
  display_name: string;
  balance: number;
  created_at: string;
  order_count?: number;
  total_spent?: number;
};

export type PublicStats = { users: number; products: number; stock: number; sold: number };

export type AdminStats = {
  totals: PublicStats & {
    newUsers7d: number;
    orders: number;
    revenue: number;
    revenueToday: number;
    topupCredited: number;
    vouchersAvailable: number;
    vouchersAvailableValue: number;
  };
  sales: { day: string; orders: number; revenue: number }[];
  topProducts: { productId: string; productName: string; quantity: number; revenue: number }[];
  lowStock: { productId: string; productName: string; tierLabel: string; stock: number }[];
  recentOrders: (Order & { user_name?: string })[];
};

export type Voucher = {
  id: string;
  code: string;
  amount: number;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
  used_by_email: string | null;
};
