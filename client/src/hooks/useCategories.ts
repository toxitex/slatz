import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useSiteConfig, type Category } from "@/contexts/SiteConfigContext";
import { api, isApiConfigured } from "@/lib/api";
import { broadcast, onSync } from "@/lib/sync";

/**
 * Design philosophy reminder: Cyber-Noir Thai Commerce.
 * Categories are admin-managed banner slots served by the self-hosted backend
 * (/api/categories). Mirrors the useCoupons pattern with a localStorage
 * fallback when the API is unreachable.
 */

const STORAGE_KEY = "syncx-categories-v1";

type CategoryRow = {
  id: string;
  name: string;
  image_url: string | null;
  sort_order: number | null;
  is_active: boolean | null;
};

function createDraft(): Category {
  return {
    id: `cat-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: "หมวดหมู่ใหม่",
    imageUrl: "",
    sortOrder: 0,
    isActive: true,
  };
}

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name || "",
    imageUrl: row.image_url || "",
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
    isActive: row.is_active !== false,
  };
}

function readLocal(): Category[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Category[]) : [];
  } catch (error) {
    console.warn("SyncX categories could not be loaded.", error);
    return [];
  }
}

function writeLocal(categories: Category[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
}

export function useCategories() {
  const { config, updateConfig } = useSiteConfig();
  const [categories, setCategories] = useState<Category[]>(() => (isApiConfigured ? [] : readLocal()));
  const [databaseMode, setDatabaseMode] = useState<boolean>(isApiConfigured);
  const [loading, setLoading] = useState(isApiConfigured);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isApiConfigured) {
      setCategories(readLocal());
      setDatabaseMode(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await api.get<CategoryRow[]>("/api/categories");
      setCategories(rows.map(toCategory));
      setDatabaseMode(true);
    } catch (err) {
      setDatabaseMode(false);
      setCategories(readLocal());
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => onSync((message) => {
    if (message.type === "categories") void refresh();
  }), [refresh]);

  const persistLocal = useCallback((next: Category[]) => {
    setCategories(next);
    writeLocal(next);
  }, []);

  const addCategory = useCallback(async () => {
    const draft = createDraft();
    if (!databaseMode) {
      persistLocal([...categories, draft]);
      return draft;
    }
    try {
      const row = await api.post<CategoryRow>("/api/categories", {
        name: draft.name,
        image_url: draft.imageUrl,
        sort_order: draft.sortOrder,
        is_active: draft.isActive,
      });
      const created = toCategory(row);
      broadcast({ type: "categories" });
      setCategories((current) => [...current, created]);
      toast("เพิ่มหมวดหมู่แล้ว");
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      toast("เพิ่มหมวดหมู่ไม่สำเร็จ");
      return null;
    }
  }, [categories, databaseMode, persistLocal]);

  const updateCategory = useCallback(async (categoryId: string, patch: Partial<Category>) => {
    const existing = categories.find((cat) => cat.id === categoryId);
    if (!databaseMode) {
      if (existing && patch.name !== undefined && patch.name !== existing.name) {
        // Update local products categories too
        const updated = config.products.map((p) =>
          p.category === existing.name ? { ...p, category: patch.name! } : p
        );
        updateConfig({ products: updated });
      }
      persistLocal(categories.map((cat) => (cat.id === categoryId ? { ...cat, ...patch } : cat)));
      return true;
    }
    setCategories((current) => current.map((cat) => (cat.id === categoryId ? { ...cat, ...patch } : cat)));
    const dbPatch: Record<string, string | number | boolean | null> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.imageUrl !== undefined) dbPatch.image_url = patch.imageUrl;
    if (patch.sortOrder !== undefined) dbPatch.sort_order = patch.sortOrder;
    if (patch.isActive !== undefined) dbPatch.is_active = patch.isActive;
    if (!Object.keys(dbPatch).length) return true;
    try {
      await api.patch(`/api/categories/${categoryId}`, dbPatch);
      broadcast({ type: "categories" });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      toast("บันทึกหมวดหมู่ไม่สำเร็จ");
      await refresh();
      return false;
    }
  }, [categories, config.products, databaseMode, persistLocal, refresh, updateConfig]);

  const deleteCategory = useCallback(async (categoryId: string) => {
    const existing = categories.find((cat) => cat.id === categoryId);
    if (!databaseMode) {
      if (existing) {
        // Update local products categories too
        const updated = config.products.map((p) =>
          p.category === existing.name ? { ...p, category: "" } : p
        );
        updateConfig({ products: updated });
      }
      persistLocal(categories.filter((cat) => cat.id !== categoryId));
      return true;
    }
    const previous = categories;
    setCategories((current) => current.filter((cat) => cat.id !== categoryId));
    try {
      await api.delete(`/api/categories/${categoryId}`);
      broadcast({ type: "categories" });
      toast("ลบหมวดหมู่แล้ว");
      return true;
    } catch (err) {
      setCategories(previous);
      setError(err instanceof Error ? err.message : String(err));
      toast("ลบหมวดหมู่ไม่สำเร็จ");
      return false;
    }
  }, [categories, config.products, databaseMode, persistLocal, updateConfig]);

  return useMemo(
    () => ({ categories, loading, error, databaseMode, refresh, addCategory, updateCategory, deleteCategory }),
    [addCategory, categories, databaseMode, deleteCategory, error, loading, refresh, updateCategory],
  );
}
