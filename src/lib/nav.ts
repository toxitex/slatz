export const primaryLinks = [
  { href: "/", label: "หน้าหลัก" },
  { href: "/store", label: "ร้านค้า" },
] as const;

export const accountLinks = [
  { href: "/topup", label: "เติมเงิน" },
  { href: "/orders", label: "คำสั่งซื้อ" },
  { href: "/history", label: "ประวัติเติมเงิน" },
  { href: "/profile", label: "โปรไฟล์" },
] as const;

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/store") return ["/store", "/category", "/product"].some((p) => pathname.startsWith(p));
  return pathname.startsWith(href);
}
