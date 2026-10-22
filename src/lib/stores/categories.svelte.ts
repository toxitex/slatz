import { toast } from "svelte-sonner";
import { api, errorMessage } from "$lib/api";
import type { Category } from "$lib/types";
import type { ProductsStore } from "./products.svelte";

const STORAGE_KEY = "syncx-categories-v1";

type CategoryRow = {
  id: string;
  name: string;
  image_url: string | null;
  sort_order: number | null;
  is_active: boolean | null;
};

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
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as Category[]) : [];
  } catch {
    return [];
  }
}

export class CategoriesStore {
  #products: ProductsStore;
  #loaded = false;
  categories = $state<Category[]>([]);
  databaseMode = $state(true);
  loading = $state(true);
  error = $state<string | null>(null);

  constructor(products: ProductsStore) {
    this.#products = products;
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
      const rows = await api.get<CategoryRow[]>("/api/categories");
      this.categories = rows.map(toCategory);
      this.databaseMode = true;
    } catch (err) {
      this.databaseMode = false;
      this.categories = readLocal();
      this.error = errorMessage(err);
    }
    this.loading = false;
  }

  #persistLocal(next: Category[]) {
    this.categories = next;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  async add() {
    const draft: Category = {
      id: `cat-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: "หมวดหมู่ใหม่",
      imageUrl: "",
      sortOrder: 0,
      isActive: true,
    };
    if (!this.databaseMode) {
      this.#persistLocal([...this.categories, draft]);
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
      this.categories = [...this.categories, created];
      toast("เพิ่มหมวดหมู่แล้ว");
      return created;
    } catch (err) {
      this.error = errorMessage(err);
      toast("เพิ่มหมวดหมู่ไม่สำเร็จ");
      return null;
    }
  }

  async update(categoryId: string, patch: Partial<Category>) {
    const existing = this.categories.find((cat) => cat.id === categoryId);
    const next = this.categories.map((cat) => (cat.id === categoryId ? { ...cat, ...patch } : cat));
    if (!this.databaseMode) {
      if (existing && patch.name !== undefined && patch.name !== existing.name) {
        this.#products.renameCategoryLocally(existing.name, patch.name);
      }
      this.#persistLocal(next);
      return true;
    }
    this.categories = next;
    const dbPatch: Record<string, unknown> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.imageUrl !== undefined) dbPatch.image_url = patch.imageUrl;
    if (patch.sortOrder !== undefined) dbPatch.sort_order = patch.sortOrder;
    if (patch.isActive !== undefined) dbPatch.is_active = patch.isActive;
    if (!Object.keys(dbPatch).length) return true;
    try {
      await api.patch(`/api/categories/${categoryId}`, dbPatch);
      return true;
    } catch (err) {
      this.error = errorMessage(err);
      toast("บันทึกหมวดหมู่ไม่สำเร็จ");
      await this.refresh();
      return false;
    }
  }

  async remove(categoryId: string) {
    const existing = this.categories.find((cat) => cat.id === categoryId);
    if (!this.databaseMode) {
      if (existing) this.#products.renameCategoryLocally(existing.name, "");
      this.#persistLocal(this.categories.filter((cat) => cat.id !== categoryId));
      return true;
    }
    const previous = this.categories;
    this.categories = previous.filter((cat) => cat.id !== categoryId);
    try {
      await api.delete(`/api/categories/${categoryId}`);
      toast("ลบหมวดหมู่แล้ว");
      return true;
    } catch (err) {
      this.categories = previous;
      this.error = errorMessage(err);
      toast("ลบหมวดหมู่ไม่สำเร็จ");
      return false;
    }
  }
}
