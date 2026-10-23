import { FolderOpen, Ticket, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Coupon } from "@/contexts/SiteConfigContext";
import { broadcast } from "@/lib/sync";
import { cn } from "@/lib/utils";
import { useAdminData } from "./AdminData";
import { cardClass, Empty, fieldClass, Group, ImageRow, Row } from "./ui";

/** Commits a text field when it loses focus, only if the value changed while focused. */
const commitOnBlur = (save: (value: string) => void) => ({
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => (e.target.dataset.initial = e.target.value),
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => e.target.value !== e.target.dataset.initial && save(e.target.value),
});

const deleteButton = (label: string, onClick: () => void) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive"
  >
    <Trash2 className="size-3.5" />
  </button>
);

export function CategoriesSection() {
  const { categories, inventory } = useAdminData();

  // The server renames/clears the category on its products too, so reload them everywhere.
  const syncProducts = () => {
    void inventory.refreshProducts();
    broadcast({ type: "products" });
  };

  if (!categories.categories.length) {
    return <Empty icon={<FolderOpen className="size-6" strokeWidth={1.5} />}>ยังไม่มีหมวดหมู่สินค้า กดปุ่ม “เพิ่มหมวดหมู่” ด้านบน</Empty>;
  }

  return (
    <>
      {categories.categories.map((category) => (
        <Group
          key={category.id}
          title={category.name || "หมวดหมู่ไม่มีชื่อ"}
          description={`${inventory.products.filter((p) => p.category === category.name).length} สินค้า`}
          actions={deleteButton(`ลบ ${category.name}`, () => void categories.deleteCategory(category.id).then((ok) => ok && syncProducts()))}
        >
          <Row label="ชื่อหมวดหมู่">
            <input
              key={category.name}
              defaultValue={category.name}
              aria-label="ชื่อหมวดหมู่"
              className={cn(fieldClass, "max-w-sm")}
              {...commitOnBlur((name) => void categories.updateCategory(category.id, { name }).then((ok) => ok && syncProducts()))}
            />
          </Row>
          <ImageRow label="รูปแบนเนอร์" value={category.imageUrl} onChange={(imageUrl) => void categories.updateCategory(category.id, { imageUrl })} />
          <Row label="ลำดับการแสดง">
            <input
              key={category.sortOrder}
              type="number"
              defaultValue={category.sortOrder}
              aria-label="ลำดับการแสดง"
              className={cn(fieldClass, "w-24")}
              {...commitOnBlur((v) => void categories.updateCategory(category.id, { sortOrder: Number(v) || 0 }))}
            />
          </Row>
          <Row label="แสดงบนหน้าร้าน">
            <Switch checked={category.isActive} onCheckedChange={(isActive) => void categories.updateCategory(category.id, { isActive })} aria-label="แสดงบนหน้าร้าน" />
          </Row>
        </Group>
      ))}
    </>
  );
}

export function CouponsSection() {
  const { coupons } = useAdminData();

  if (!coupons.coupons.length) {
    return <Empty icon={<Ticket className="size-6" strokeWidth={1.5} />}>ยังไม่มีคูปองส่วนลด กดปุ่ม “เพิ่มคูปอง” ด้านบน</Empty>;
  }

  return (
    <div className={cn(cardClass, "overflow-hidden")}>
      <div className="hidden grid-cols-[1.4fr_1.2fr_0.8fr_4rem_2rem] gap-3 border-b px-4 py-2 text-[11px] text-muted-foreground md:grid">
        <span>โค้ด</span>
        <span>ประเภท</span>
        <span className="text-right">มูลค่าส่วนลด</span>
        <span className="text-center">ใช้งาน</span>
        <span />
      </div>
      <ul className="divide-y divide-border">
        {coupons.coupons.map((coupon) => (
          <li key={coupon.id} className="grid grid-cols-2 items-center gap-3 px-4 py-2.5 text-[13px] md:grid-cols-[1.4fr_1.2fr_0.8fr_4rem_2rem]">
            <input
              key={coupon.code}
              defaultValue={coupon.code}
              aria-label="โค้ด"
              className="col-span-2 rounded-md bg-secondary px-2.5 py-1.5 font-mono tracking-wider uppercase outline-none md:col-span-1"
              {...commitOnBlur((code) => void coupons.updateCoupon(coupon.id, { code: code.toUpperCase() }))}
            />
            <Select value={coupon.discountType} onValueChange={(v) => void coupons.updateCoupon(coupon.id, { discountType: v as Coupon["discountType"] })}>
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">% เปอร์เซ็นต์</SelectItem>
                <SelectItem value="fixed">฿ จำนวนคงที่</SelectItem>
              </SelectContent>
            </Select>
            <input
              key={coupon.discountValue}
              type="number"
              min={0}
              defaultValue={coupon.discountValue}
              aria-label="มูลค่าส่วนลด"
              className="rounded-md bg-secondary px-2.5 py-1.5 text-right outline-none"
              {...commitOnBlur((v) => void coupons.updateCoupon(coupon.id, { discountValue: Number(v) || 0 }))}
            />
            <span className="flex md:justify-center">
              <Switch checked={coupon.active} onCheckedChange={(active) => void coupons.updateCoupon(coupon.id, { active })} aria-label="เปิดใช้งาน" />
            </span>
            <span className="justify-self-end">{deleteButton(`ลบ ${coupon.code}`, () => void coupons.deleteCoupon(coupon.id))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
