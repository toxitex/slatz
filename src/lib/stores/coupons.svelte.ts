import { toast } from "svelte-sonner";
import { api, errorMessage } from "$lib/api";
import type { Coupon } from "$lib/types";

const STORAGE_KEY = "syncx-coupons-v1";

type CouponRow = {
  id: string;
  code: string;
  discount_type: string | null;
  discount_value: number | string | null;
  active: boolean | null;
};

function toCoupon(row: CouponRow): Coupon {
  return {
    id: row.id,
    code: row.code || "",
    discountType: row.discount_type === "fixed" ? "fixed" : "percent",
    discountValue: typeof row.discount_value === "number" ? row.discount_value : Number(row.discount_value) || 0,
    active: row.active !== false,
  };
}

function readLocal(): Coupon[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as Coupon[]) : [];
  } catch {
    return [];
  }
}

export class CouponsStore {
  #loaded = false;
  coupons = $state<Coupon[]>([]);
  databaseMode = $state(true);
  loading = $state(true);
  error = $state<string | null>(null);

  ensureLoaded() {
    if (this.#loaded) return;
    this.#loaded = true;
    void this.refresh();
  }

  async refresh() {
    this.loading = true;
    this.error = null;
    try {
      const rows = await api.get<CouponRow[]>("/api/coupons");
      this.coupons = rows.map(toCoupon);
      this.databaseMode = true;
    } catch (err) {
      this.databaseMode = false;
      this.coupons = readLocal();
      this.error = errorMessage(err);
    }
    this.loading = false;
  }

  #persistLocal(next: Coupon[]) {
    this.coupons = next;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  async add() {
    const draft: Coupon = {
      id: `coupon-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      code: "NEWCODE",
      discountType: "percent",
      discountValue: 10,
      active: true,
    };
    if (!this.databaseMode) {
      this.#persistLocal([draft, ...this.coupons]);
      return draft;
    }
    try {
      const row = await api.post<CouponRow>("/api/coupons", {
        code: draft.code,
        discount_type: draft.discountType,
        discount_value: draft.discountValue,
        active: draft.active,
      });
      const created = toCoupon(row);
      this.coupons = [created, ...this.coupons];
      return created;
    } catch (err) {
      this.error = errorMessage(err);
      toast("เพิ่มคูปองไม่สำเร็จ");
      return null;
    }
  }

  async update(couponId: string, patch: Partial<Coupon>) {
    const next = this.coupons.map((coupon) => (coupon.id === couponId ? { ...coupon, ...patch } : coupon));
    if (!this.databaseMode) {
      this.#persistLocal(next);
      return true;
    }
    this.coupons = next;
    const dbPatch: Record<string, unknown> = {};
    if (patch.code !== undefined) dbPatch.code = patch.code;
    if (patch.discountType !== undefined) dbPatch.discount_type = patch.discountType;
    if (patch.discountValue !== undefined) dbPatch.discount_value = patch.discountValue;
    if (patch.active !== undefined) dbPatch.active = patch.active;
    if (!Object.keys(dbPatch).length) return true;
    try {
      await api.patch(`/api/coupons/${couponId}`, dbPatch);
      return true;
    } catch (err) {
      this.error = errorMessage(err);
      toast("บันทึกคูปองไม่สำเร็จ");
      await this.refresh();
      return false;
    }
  }

  async remove(couponId: string) {
    if (!this.databaseMode) {
      this.#persistLocal(this.coupons.filter((coupon) => coupon.id !== couponId));
      return true;
    }
    const previous = this.coupons;
    this.coupons = previous.filter((coupon) => coupon.id !== couponId);
    try {
      await api.delete(`/api/coupons/${couponId}`);
      return true;
    } catch (err) {
      this.coupons = previous;
      this.error = errorMessage(err);
      toast("ลบคูปองไม่สำเร็จ");
      return false;
    }
  }

  validate(rawCode: string): Coupon | null {
    const code = rawCode.trim().toUpperCase();
    if (!code) return null;
    return this.coupons.find((coupon) => coupon.active && coupon.code.trim().toUpperCase() === code) ?? null;
  }
}
