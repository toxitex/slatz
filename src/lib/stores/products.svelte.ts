import { toast } from "svelte-sonner";
import { api, errorMessage } from "$lib/api";
import { isAdminGranted } from "$lib/admin-access";
import type { ProductStatus, ProductTier, SyncXProduct } from "$lib/types";
import { createProductDraft, type SiteConfigStore } from "./site-config.svelte";

type ProductRow = {
  id: string;
  name: string;
  price: string | number | null;
  category: string | null;
  image_url: string | null;
  description: string | null;
  tiers?: unknown;
  status?: string | null;
  total_sold?: number | null;
};

export type ProductPatch = Partial<SyncXProduct> & { stock?: number; isActive?: boolean; sortOrder?: number };

function normalizeTiers(input: unknown): ProductTier[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
    .map((entry, index) => ({
      id: typeof entry.id === "string" ? entry.id : `tier-${index}-${Math.random().toString(16).slice(2, 8)}`,
      label: typeof entry.label === "string" ? entry.label : "",
      price: typeof entry.price === "number" ? entry.price : Number(entry.price) || 0,
      stock: typeof entry.stock === "number" ? entry.stock : Number(entry.stock) || 0,
    }));
}

function normalizeStatus(input: unknown): ProductStatus {
  return input === "out_of_stock" || input === "hidden" ? input : "active";
}

function toProduct(row: ProductRow): SyncXProduct {
  return {
    id: row.id,
    name: row.name || "สินค้าไม่มีชื่อ",
    price: row.price == null ? "฿0" : String(row.price),
    category: row.category || "สินค้าทั่วไป",
    imageUrl: row.image_url || "",
    description: row.description || "",
    tiers: normalizeTiers(row.tiers),
    status: normalizeStatus(row.status),
    totalSold: typeof row.total_sold === "number" ? row.total_sold : 0,
  };
}

function toDatabasePatch(patch: ProductPatch) {
  const out: Record<string, unknown> = {};
  if (patch.name !== undefined) out.name = patch.name;
  if (patch.price !== undefined) out.price = patch.price;
  if (patch.category !== undefined) out.category = patch.category;
  if (patch.imageUrl !== undefined) out.image_url = patch.imageUrl;
  if (patch.description !== undefined) out.description = patch.description;
  if (patch.stock !== undefined) out.stock = patch.stock;
  if (patch.isActive !== undefined) out.is_active = patch.isActive;
  if (patch.sortOrder !== undefined) out.sort_order = patch.sortOrder;
  if (patch.tiers !== undefined) out.tiers = patch.tiers;
  if (patch.status !== undefined) out.status = patch.status;
  if (patch.totalSold !== undefined) out.total_sold = patch.totalSold;
  return out;
}

export function tierRange(tiers: ProductTier[]) {
  if (!tiers.length) return null;
  const prices = tiers.map((tier) => tier.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function totalStock(tiers: ProductTier[]) {
  return tiers.reduce((sum, tier) => sum + Math.max(0, tier.stock || 0), 0);
}

/** SQLite-backed inventory; falls back to the products stored in site config when the API is down. */
export class ProductsStore {
  #site: SiteConfigStore;
  #databaseProducts = $state<SyncXProduct[]>([]);
  #loaded = false;
  databaseMode = $state(true);
  loading = $state(true);
  error = $state<string | null>(null);

  products: SyncXProduct[];

  constructor(site: SiteConfigStore) {
    this.#site = site;
    this.products = $derived(this.databaseMode ? this.#databaseProducts : this.#site.config.products);
  }

  ensureLoaded() {
    if (this.#loaded) return;
    this.#loaded = true;
    void this.refresh();
  }

  async refresh() {
    this.loading = true;
    this.error = null;
    try {
      const rows = await api.get<ProductRow[]>(isAdminGranted() ? "/api/products/all" : "/api/products");
      this.#databaseProducts = rows.map(toProduct);
      this.databaseMode = true;
    } catch (err) {
      this.databaseMode = false;
      this.error = errorMessage(err);
    }
    this.loading = false;
  }

  async add(initialCategory?: string) {
    const draft = createProductDraft();
    if (initialCategory) draft.category = initialCategory;

    if (!this.databaseMode) {
      this.#site.config.products = [draft, ...this.#site.config.products];
      return draft;
    }
    try {
      const row = await api.post<ProductRow>("/api/products", {
        name: draft.name,
        price: draft.price,
        category: draft.category,
        image_url: draft.imageUrl,
        description: draft.description,
        stock: 0,
        is_active: true,
        sort_order: this.products.length + 1,
        tiers: draft.tiers ?? [],
        status: draft.status ?? "active",
        total_sold: draft.totalSold ?? 0,
      });
      const created = toProduct(row);
      this.#databaseProducts = [created, ...this.#databaseProducts];
      toast("เพิ่มสินค้าแล้ว");
      return created;
    } catch (err) {
      this.error = errorMessage(err);
      toast("เพิ่มสินค้าไม่สำเร็จ");
      return null;
    }
  }

  async update(productId: string, patch: ProductPatch) {
    const apply = (list: SyncXProduct[]) =>
      list.map((product) => (product.id === productId ? { ...product, ...patch } : product));

    if (!this.databaseMode) {
      this.#site.config.products = apply(this.#site.config.products);
      return true;
    }
    this.#databaseProducts = apply(this.#databaseProducts);
    const databasePatch = toDatabasePatch(patch);
    if (!Object.keys(databasePatch).length) return true;
    try {
      await api.patch(`/api/products/${productId}`, databasePatch);
      return true;
    } catch (err) {
      this.error = errorMessage(err);
      toast("บันทึกสินค้าไม่สำเร็จ กำลังโหลดข้อมูลล่าสุด");
      await this.refresh();
      return false;
    }
  }

  async remove(productId: string) {
    if (!this.databaseMode) {
      this.#site.config.products = this.#site.config.products.filter((product) => product.id !== productId);
      return true;
    }
    const previous = this.#databaseProducts;
    this.#databaseProducts = previous.filter((product) => product.id !== productId);
    try {
      await api.delete(`/api/products/${productId}`);
      toast("ลบสินค้าแล้ว");
      return true;
    } catch (err) {
      this.#databaseProducts = previous;
      this.error = errorMessage(err);
      toast("ลบสินค้าไม่สำเร็จ");
      return false;
    }
  }

  /** Keeps product category labels in step with the local-fallback category list. */
  renameCategoryLocally(from: string, to: string) {
    this.#site.config.products = this.#site.config.products.map((p) => (p.category === from ? { ...p, category: to } : p));
  }
}
