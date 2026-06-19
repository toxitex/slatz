import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useSiteConfig, type ProductStatus, type ProductTier, type SyncXProduct } from "@/contexts/SiteConfigContext";
import { api, isApiConfigured } from "@/lib/api";

/**
 * Design philosophy reminder: Cyber-Noir Thai Commerce.
 * Product data is now served by the self-hosted SQLite backend (/api/products).
 * The localStorage/site-config fallback is preserved for when the API is
 * unreachable, keeping the same low-lit SyncX storefront rhythm either way.
 */

type ProductRow = {
  id: string;
  name: string;
  price: string | number | null;
  category: string | null;
  image_url: string | null;
  description: string | null;
  stock: number | null;
  is_active: boolean | null;
  sort_order: number | null;
  tiers?: unknown;
  status?: string | null;
  total_sold?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ProductInsert = {
  name: string;
  price: string;
  category: string;
  image_url: string;
  description: string;
  stock: number;
  is_active: boolean;
  sort_order: number;
  tiers: ProductTier[];
  status: ProductStatus;
  total_sold: number;
};

type ProductPatch = Partial<SyncXProduct> & { stock?: number; isActive?: boolean; sortOrder?: number };

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

function createFallbackProduct(): SyncXProduct {
  return {
    id: `product-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: "สินค้าใหม่",
    price: "฿0",
    category: "สินค้าทั่วไป",
    imageUrl: "",
    description: "ใส่รายละเอียดสินค้าในแอดมินแดชบอร์ด",
  };
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

function toInsert(product: SyncXProduct, sortOrder: number): ProductInsert {
  return {
    name: product.name,
    price: product.price,
    category: product.category,
    image_url: product.imageUrl,
    description: product.description,
    stock: 0,
    is_active: true,
    sort_order: sortOrder,
    tiers: product.tiers ?? [],
    status: product.status ?? "active",
    total_sold: product.totalSold ?? 0,
  };
}

function toDatabasePatch(patch: ProductPatch) {
  const databasePatch: Record<string, string | number | boolean | null | ProductTier[]> = {};
  if (patch.name !== undefined) databasePatch.name = patch.name;
  if (patch.price !== undefined) databasePatch.price = patch.price;
  if (patch.category !== undefined) databasePatch.category = patch.category;
  if (patch.imageUrl !== undefined) databasePatch.image_url = patch.imageUrl;
  if (patch.description !== undefined) databasePatch.description = patch.description;
  if (patch.stock !== undefined) databasePatch.stock = patch.stock;
  if (patch.isActive !== undefined) databasePatch.is_active = patch.isActive;
  if (patch.sortOrder !== undefined) databasePatch.sort_order = patch.sortOrder;
  if (patch.tiers !== undefined) databasePatch.tiers = patch.tiers;
  if (patch.status !== undefined) databasePatch.status = patch.status;
  if (patch.totalSold !== undefined) databasePatch.total_sold = patch.totalSold;
  return databasePatch;
}

export function useInventoryProducts() {
  const { config, updateConfig } = useSiteConfig();
  const [databaseProducts, setDatabaseProducts] = useState<SyncXProduct[]>([]);
  const [databaseMode, setDatabaseMode] = useState<boolean>(isApiConfigured);
  const [loading, setLoading] = useState(isApiConfigured);
  const [error, setError] = useState<string | null>(null);

  const products = useMemo(() => (databaseMode ? databaseProducts : config.products), [config.products, databaseMode, databaseProducts]);

  const setFallbackProducts = useCallback((nextProducts: SyncXProduct[]) => {
    updateConfig({ products: nextProducts });
  }, [updateConfig]);

  const refreshProducts = useCallback(async () => {
    if (!isApiConfigured) {
      setDatabaseMode(false);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const isAdminGranted = typeof window !== "undefined" && window.sessionStorage.getItem("syncx-admin-access") === "granted";
      const endpoint = isAdminGranted ? "/api/products/all" : "/api/products";
      const rows = await api.get<ProductRow[]>(endpoint);
      setDatabaseProducts(rows.map(toProduct));
      setDatabaseMode(true);
    } catch (err) {
      // API unreachable — fall back to the site-config products.
      setDatabaseMode(false);
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshProducts();
  }, [refreshProducts]);

  const addProduct = useCallback(async (initialCategory?: string) => {
    const draft = createFallbackProduct();
    if (initialCategory) {
      draft.category = initialCategory;
    }

    if (!databaseMode) {
      setFallbackProducts([draft, ...config.products]);
      return draft;
    }

    try {
      const row = await api.post<ProductRow>("/api/products", toInsert(draft, products.length + 1));
      const created = toProduct(row);
      setDatabaseProducts((current) => [created, ...current]);
      toast("เพิ่มสินค้าแล้ว");
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      toast("เพิ่มสินค้าไม่สำเร็จ");
      return null;
    }
  }, [config.products, databaseMode, products.length, setFallbackProducts]);

  const updateProduct = useCallback(async (productId: string, patch: ProductPatch) => {
    if (!databaseMode) {
      setFallbackProducts(config.products.map((product) => (product.id === productId ? { ...product, ...patch } : product)));
      return true;
    }

    setDatabaseProducts((current) => current.map((product) => (product.id === productId ? { ...product, ...patch } : product)));
    const databasePatch = toDatabasePatch(patch);
    if (!Object.keys(databasePatch).length) return true;

    try {
      await api.patch(`/api/products/${productId}`, databasePatch);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      toast("บันทึกสินค้าไม่สำเร็จ กำลังโหลดข้อมูลล่าสุด");
      await refreshProducts();
      return false;
    }
  }, [config.products, databaseMode, refreshProducts, setFallbackProducts]);

  const deleteProduct = useCallback(async (productId: string) => {
    if (!databaseMode) {
      setFallbackProducts(config.products.filter((product) => product.id !== productId));
      return true;
    }

    const previous = databaseProducts;
    setDatabaseProducts((current) => current.filter((product) => product.id !== productId));
    try {
      await api.delete(`/api/products/${productId}`);
      toast("ลบสินค้าแล้ว");
      return true;
    } catch (err) {
      setDatabaseProducts(previous);
      setError(err instanceof Error ? err.message : String(err));
      toast("ลบสินค้าไม่สำเร็จ");
      return false;
    }
  }, [config.products, databaseMode, databaseProducts, setFallbackProducts]);

  return {
    products,
    loading,
    error,
    databaseMode,
    refreshProducts,
    addProduct,
    updateProduct,
    deleteProduct,
  };
}
