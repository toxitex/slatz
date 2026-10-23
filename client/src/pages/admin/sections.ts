import {
  BarChart3,
  Database,
  History,
  Image,
  LayoutDashboard,
  LayoutGrid,
  Megaphone,
  Palette,
  PanelBottom,
  ShoppingBag,
  Sparkles,
  Store,
  Ticket,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type ConfigSectionKey = "branding" | "colors" | "hero" | "announcement" | "stats" | "store-config" | "footer";
export type SectionKey =
  | ConfigSectionKey
  | "overview"
  | "products"
  | "categories"
  | "coupons"
  | "vouchers"
  | "orders"
  | "users"
  | "backup";

export type SectionItem = { key: SectionKey; label: string; description: string; icon: LucideIcon; color: string };

export const sectionGroups: { title: string; items: SectionItem[] }[] = [
  {
    title: "ภาพรวม",
    items: [
      { key: "overview", label: "แดชบอร์ด", description: "ข้อมูลจริงจากฐานข้อมูล", icon: LayoutDashboard, color: "#0a84ff" },
      { key: "stats", label: "ตัวเลขหน้าแรก", description: "ตัวเลขที่แสดงบนหน้าแรกของร้าน", icon: BarChart3, color: "#5e5ce6" },
    ],
  },
  {
    title: "ร้านค้า",
    items: [
      { key: "products", label: "สินค้า", description: "สินค้า ตัวเลือกราคา และสต็อก", icon: ShoppingBag, color: "#ff9f0a" },
      { key: "categories", label: "หมวดหมู่", description: "แบนเนอร์หมวดหมู่บนหน้าร้าน", icon: LayoutGrid, color: "#64d2ff" },
      { key: "coupons", label: "คูปองส่วนลด", description: "โค้ดลดราคาตอนชำระเงิน", icon: Ticket, color: "#ff375f" },
      { key: "vouchers", label: "บัตรเติมเงิน", description: "รหัสเติมเงินสำหรับลูกค้า", icon: Wallet, color: "#30d158" },
      { key: "orders", label: "คำสั่งซื้อ", description: "ประวัติการขายและ License Key", icon: History, color: "#ffd60a" },
      { key: "users", label: "ลูกค้า", description: "ยอดเงินและชื่อที่แสดง", icon: Users, color: "#0a84ff" },
    ],
  },
  {
    title: "หน้าร้าน",
    items: [
      { key: "branding", label: "แบรนด์", description: "ชื่อร้าน โลโก้ และ SEO", icon: Sparkles, color: "#bf5af2" },
      { key: "colors", label: "สีธีม", description: "สีของหน้าร้าน", icon: Palette, color: "#ff375f" },
      { key: "hero", label: "แบนเนอร์หน้าแรก", description: "ข้อความและรูปส่วนบนสุด", icon: Image, color: "#64d2ff" },
      { key: "announcement", label: "ประกาศ", description: "กระดานประกาศบนหน้าแรก", icon: Megaphone, color: "#ff9f0a" },
      { key: "store-config", label: "ข้อความร้านค้า", description: "หัวข้อและปุ่มในหน้าร้าน", icon: Store, color: "#8e8e93" },
      { key: "footer", label: "ฟุตเตอร์", description: "ข้อมูลติดต่อและโซเชียล", icon: PanelBottom, color: "#636366" },
    ],
  },
  {
    title: "ระบบ",
    items: [{ key: "backup", label: "สำรองข้อมูล", description: "ส่งออก นำเข้า และรีเซ็ต", icon: Database, color: "#48484a" }],
  },
];

export const sectionItems = sectionGroups.flatMap((group) => group.items);

const configKeys: SectionKey[] = ["branding", "colors", "hero", "announcement", "stats", "store-config", "footer"];

export function isConfigSection(key: SectionKey): key is ConfigSectionKey {
  return configKeys.includes(key);
}
