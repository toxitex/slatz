import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { type Coupon } from "@/contexts/SiteConfigContext";
import { api, isApiConfigured } from "@/lib/api";
import { broadcast, onSync } from "@/lib/sync";

/**
 * Design philosophy reminder: Cyber-Noir Thai Commerce.
 * Coupons are admin-managed promo codes served by the self-hosted backend
 * (/api/coupons). A localStorage fallback keeps the storefront working when
 * the API is unreachable.
 */

const STORAGE_KEY = "syncx-coupons-v1";

type CouponRow = {
  id: string;
  code: string;
  discount_type: string | null;
  discount_value: number | string | null;
  active: boolean | null;
};

function createDraft(): Coupon {
  return {
    id: `coupon-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    code: "NEWCODE",
    discountType: "percent",
    discountValue: 10,
    active: true,
  };
}

function toCoupon(row: CouponRow): Coupon {
  return {
    id: row.id,
    code: row.code || "",
    discountType: row.discount_type === "fixed" ? "fixed" : "percent",
    discountValue: typeof row.discount_value === "number" ? row.discount_value : Number(row.discount_value) || 0,
    active: row.active !== false,
  };
}

function readLocalCoupons(): Coupon[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Coupon[]) : [];
  } catch (error) {
    console.warn("SyncX coupons could not be loaded.", error);
    return [];
  }
}

function writeLocalCoupons(coupons: Coupon[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
}

export function useCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>(() => (isApiConfigured ? [] : readLocalCoupons()));
  const [databaseMode, setDatabaseMode] = useState<boolean>(isApiConfigured);
  const [loading, setLoading] = useState(isApiConfigured);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isApiConfigured) {
      setCoupons(readLocalCoupons());
      setDatabaseMode(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await api.get<CouponRow[]>("/api/coupons");
      setCoupons(rows.map(toCoupon));
      setDatabaseMode(true);
    } catch (err) {
      setDatabaseMode(false);
      setCoupons(readLocalCoupons());
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => onSync((message) => {
    if (message.type === "coupons") void refresh();
  }), [refresh]);

  const persistLocal = useCallback((next: Coupon[]) => {
    setCoupons(next);
    writeLocalCoupons(next);
  }, []);

  const addCoupon = useCallback(async () => {
    const draft = createDraft();
    if (!databaseMode) {
      persistLocal([draft, ...coupons]);
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
      broadcast({ type: "coupons" });
      setCoupons((current) => [created, ...current]);
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      toast("เพิ่มคูปองไม่สำเร็จ");
      return null;
    }
  }, [coupons, databaseMode, persistLocal]);

  const updateCoupon = useCallback(async (couponId: string, patch: Partial<Coupon>) => {
    if (!databaseMode) {
      persistLocal(coupons.map((coupon) => (coupon.id === couponId ? { ...coupon, ...patch } : coupon)));
      return true;
    }
    setCoupons((current) => current.map((coupon) => (coupon.id === couponId ? { ...coupon, ...patch } : coupon)));
    const databasePatch: Record<string, string | number | boolean | null> = {};
    if (patch.code !== undefined) databasePatch.code = patch.code;
    if (patch.discountType !== undefined) databasePatch.discount_type = patch.discountType;
    if (patch.discountValue !== undefined) databasePatch.discount_value = patch.discountValue;
    if (patch.active !== undefined) databasePatch.active = patch.active;
    if (!Object.keys(databasePatch).length) return true;
    try {
      await api.patch(`/api/coupons/${couponId}`, databasePatch);
      broadcast({ type: "coupons" });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      toast("บันทึกคูปองไม่สำเร็จ");
      await refresh();
      return false;
    }
  }, [coupons, databaseMode, persistLocal, refresh]);

  const deleteCoupon = useCallback(async (couponId: string) => {
    if (!databaseMode) {
      persistLocal(coupons.filter((coupon) => coupon.id !== couponId));
      return true;
    }
    const previous = coupons;
    setCoupons((current) => current.filter((coupon) => coupon.id !== couponId));
    try {
      await api.delete(`/api/coupons/${couponId}`);
      broadcast({ type: "coupons" });
      return true;
    } catch (err) {
      setCoupons(previous);
      setError(err instanceof Error ? err.message : String(err));
      toast("ลบคูปองไม่สำเร็จ");
      return false;
    }
  }, [coupons, databaseMode, persistLocal]);

  const validateCoupon = useCallback((rawCode: string): Coupon | null => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return null;
    return coupons.find((coupon) => coupon.active && coupon.code.trim().toUpperCase() === code) ?? null;
  }, [coupons]);

  return useMemo(
    () => ({ coupons, loading, error, databaseMode, refresh, addCoupon, updateCoupon, deleteCoupon, validateCoupon }),
    [addCoupon, coupons, databaseMode, deleteCoupon, error, loading, refresh, updateCoupon, validateCoupon],
  );
}
