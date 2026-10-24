import BarChart3Icon from "@lucide/svelte/icons/chart-column";
import DatabaseIcon from "@lucide/svelte/icons/database";
import HistoryIcon from "@lucide/svelte/icons/history";
import ImageIcon from "@lucide/svelte/icons/image";
import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
import MegaphoneIcon from "@lucide/svelte/icons/megaphone";
import PaletteIcon from "@lucide/svelte/icons/palette";
import PanelBottomIcon from "@lucide/svelte/icons/panel-bottom";
import ShoppingBagIcon from "@lucide/svelte/icons/shopping-bag";
import SparklesIcon from "@lucide/svelte/icons/sparkles";
import StoreIcon from "@lucide/svelte/icons/store";
import TicketIcon from "@lucide/svelte/icons/ticket";
import UsersIcon from "@lucide/svelte/icons/users";
import type { Component } from "svelte";

export type ConfigSectionKey = "branding" | "colors" | "hero" | "announcement" | "stats" | "store-config" | "footer";
export type SectionKey = ConfigSectionKey | "overview" | "products" | "categories" | "coupons" | "orders" | "users" | "backup";

export type SectionItem = {
  key: SectionKey;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Component<any>;
  color: string;
};

export const sectionGroups: { title: string; items: SectionItem[] }[] = [
  {
    title: "ภาพรวมระบบ",
    items: [{ key: "overview", label: "ภาพรวม", icon: BarChart3Icon, color: "#1d1d1f" }],
  },
  {
    title: "จัดการร้านค้า",
    items: [
      { key: "products", label: "สินค้า", icon: ShoppingBagIcon, color: "#3a3a3c" },
      { key: "categories", label: "หมวดหมู่สินค้า", icon: LayoutGridIcon, color: "#48484a" },
      { key: "coupons", label: "คูปองส่วนลด", icon: TicketIcon, color: "#636366" },
      { key: "orders", label: "ประวัติคำสั่งซื้อ", icon: HistoryIcon, color: "#8e8e93" },
      { key: "users", label: "จัดการลูกค้า", icon: UsersIcon, color: "#1d1d1f" },
      { key: "store-config", label: "ข้อความหน้าร้าน", icon: StoreIcon, color: "#3a3a3c" },
    ],
  },
  {
    title: "ตกแต่งร้าน",
    items: [
      { key: "branding", label: "ข้อมูลแบรนด์", icon: SparklesIcon, color: "#48484a" },
      { key: "colors", label: "สีธีม", icon: PaletteIcon, color: "#636366" },
      { key: "hero", label: "แบนเนอร์หน้าแรก", icon: ImageIcon, color: "#8e8e93" },
      { key: "announcement", label: "ประกาศบนเว็บ", icon: MegaphoneIcon, color: "#1d1d1f" },
      { key: "stats", label: "ตัวเลขบนหน้าแรก", icon: BarChart3Icon, color: "#48484a" },
      { key: "footer", label: "ฟุตเตอร์", icon: PanelBottomIcon, color: "#3a3a3c" },
    ],
  },
  {
    title: "จัดการระบบ",
    items: [{ key: "backup", label: "จัดการข้อมูล", icon: DatabaseIcon, color: "#48484a" }],
  },
];

export const sectionItems = sectionGroups.flatMap((group) => group.items);

export const configSectionKeys: ConfigSectionKey[] = [
  "branding",
  "colors",
  "hero",
  "announcement",
  "stats",
  "store-config",
  "footer",
];

export function isConfigSection(key: SectionKey): key is ConfigSectionKey {
  return (configSectionKeys as SectionKey[]).includes(key);
}
