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
