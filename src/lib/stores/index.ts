import { createContext } from "svelte";
import { AuthStore } from "./auth.svelte";
import { CategoriesStore } from "./categories.svelte";
import { CouponsStore } from "./coupons.svelte";
import { ProductsStore } from "./products.svelte";
import { SiteConfigStore } from "./site-config.svelte";
import { UiStore } from "./ui.svelte";

export type AppStores = {
  site: SiteConfigStore;
  auth: AuthStore;
  products: ProductsStore;
  categories: CategoriesStore;
  coupons: CouponsStore;
  ui: UiStore;
};

const [getStores, setStores] = createContext<AppStores>();

export function createStores(): AppStores {
  const site = new SiteConfigStore();
  const products = new ProductsStore(site);
  return setStores({
    site,
    auth: new AuthStore(),
    products,
    categories: new CategoriesStore(products),
    coupons: new CouponsStore(),
    ui: new UiStore(),
  });
}

export { getStores };
