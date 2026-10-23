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

export type SectionItem = { key: SectionKey; label: string; description: string; icon: LucideIcon };

export const sectionGroups: { title: string; items: SectionItem[] }[] = [
  {
    title: "ภาพรวม",
    items: [
      { key: "overview", label: "แดชบอร์ด", description: "ข้อมูลจริงจากฐานข้อมูล", icon: LayoutDashboard },
      { key: "stats", label: "ตัวเลขหน้าแรก", description: "ตัวเลขที่แสดงบนหน้าแรกของร้าน", icon: BarChart3 },
    ],
  },
  {
    title: "ร้านค้า",
    items: [
      { key: "products", label: "สินค้า", description: "สินค้า ตัวเลือกราคา และสต็อก", icon: ShoppingBag },
      { key: "categories", label: "หมวดหมู่", description: "แบนเนอร์หมวดหมู่บนหน้าร้าน", icon: LayoutGrid },
      { key: "coupons", label: "คูปองส่วนลด", description: "โค้ดลดราคาตอนชำระเงิน", icon: Ticket },
      { key: "vouchers", label: "บัตรเติมเงิน", description: "รหัสเติมเงินสำหรับลูกค้า", icon: Wallet },
      { key: "orders", label: "คำสั่งซื้อ", description: "ประวัติการขายและ License Key", icon: History },
      { key: "users", label: "ลูกค้า", description: "ยอดเงินและชื่อที่แสดง", icon: Users },
    ],
  },
  {
    title: "หน้าร้าน",
    items: [
      { key: "branding", label: "แบรนด์", description: "ชื่อร้าน โลโก้ และ SEO", icon: Sparkles },
      { key: "colors", label: "สีธีม", description: "สีของหน้าร้าน", icon: Palette },
      { key: "hero", label: "แบนเนอร์หน้าแรก", description: "ข้อความและรูปส่วนบนสุด", icon: Image },
      { key: "announcement", label: "ประกาศ", description: "กระดานประกาศบนหน้าแรก", icon: Megaphone },
      { key: "store-config", label: "ข้อความร้านค้า", description: "หัวข้อและปุ่มในหน้าร้าน", icon: Store },
      { key: "footer", label: "ฟุตเตอร์", description: "ข้อมูลติดต่อและโซเชียล", icon: PanelBottom },
    ],
  },
  {
    title: "ระบบ",
    items: [{ key: "backup", label: "สำรองข้อมูล", description: "ส่งออก นำเข้า และรีเซ็ต", icon: Database }],
  },
];

export const sectionItems = sectionGroups.flatMap((group) => group.items);

const configKeys: SectionKey[] = ["branding", "colors", "hero", "announcement", "stats", "store-config", "footer"];

export function isConfigSection(key: SectionKey): key is ConfigSectionKey {
  return configKeys.includes(key);
}
