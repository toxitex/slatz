import { createContext, useContext, type ReactNode } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useCoupons } from "@/hooks/useCoupons";
import { useInventoryProducts } from "@/hooks/useInventoryProducts";

type AdminData = {
  inventory: ReturnType<typeof useInventoryProducts>;
  categories: ReturnType<typeof useCategories>;
  coupons: ReturnType<typeof useCoupons>;
};

const AdminDataContext = createContext<AdminData | null>(null);

/** One instance of each data hook for the whole dashboard, so every section sees the same rows. */
export function AdminDataProvider({ children }: { children: ReactNode }) {
  const inventory = useInventoryProducts();
  const categories = useCategories();
  const coupons = useCoupons();
  return <AdminDataContext.Provider value={{ inventory, categories, coupons }}>{children}</AdminDataContext.Provider>;
}

export function useAdminData() {
  const value = useContext(AdminDataContext);
  if (!value) throw new Error("useAdminData must be used inside AdminDataProvider");
  return value;
}
