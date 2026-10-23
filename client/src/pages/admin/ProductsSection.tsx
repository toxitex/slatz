import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { ChevronRight, ExternalLink, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProductStatus, ProductTier, SyncXProduct } from "@/contexts/SiteConfigContext";
import { cn } from "@/lib/utils";
import { useAdminData } from "./AdminData";
import { Empty, fieldClass, Group, ImageRow, Row } from "./ui";

const NO_CATEGORY = "__none__";
const statusLabels: Record<ProductStatus, string> = { active: "เปิดขาย", out_of_stock: "หมดชั่วคราว", hidden: "ซ่อนจากหน้าร้าน" };

const totalStock = (tiers: ProductTier[] = []) => tiers.reduce((sum, t) => sum + Math.max(0, t.stock || 0), 0);

function ProductEditor({ product, onClose }: { product: SyncXProduct; onClose: () => void }) {
  const { inventory, categories } = useAdminData();
  const [draft, setDraft] = useState<SyncXProduct>(() => ({ ...product, tiers: (product.tiers ?? []).map((t) => ({ ...t })) }));
  const [confirmDelete, setConfirmDelete] = useState(false);

  const commit = (patch: Partial<SyncXProduct>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    void inventory.updateProduct(product.id, patch);
  };

  const setTier = (id: string, patch: Partial<ProductTier>) =>
    setDraft((d) => ({ ...d, tiers: (d.tiers ?? []).map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  const commitTiers = (tiers = draft.tiers ?? []) =>
    void inventory.updateProduct(product.id, {
      tiers: tiers.map((t) => ({ ...t, price: Number(t.price) || 0, stock: Number(t.stock) || 0 })),
    });

  const activeCategories = categories.categories.filter((c) => c.isActive);
  const categoryOptions = [
    { value: NO_CATEGORY, label: "— ไม่ระบุหมวดหมู่ —" },
    ...activeCategories.map((c) => ({ value: c.name, label: c.name })),
    ...(draft.category && !activeCategories.some((c) => c.name === draft.category)
      ? [{ value: draft.category, label: `${draft.category} (ไม่ได้ลงทะเบียน)` }]
      : []),
  ];

  const textField = (key: "name" | "price", label: string, placeholder?: string) => (
    <Row label={label}>
      <input
        value={draft[key]}
        placeholder={placeholder}
        aria-label={label}
        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        onFocus={(e) => (e.target.dataset.initial = e.target.value)}
        onBlur={(e) => e.target.value !== e.target.dataset.initial && void inventory.updateProduct(product.id, { [key]: e.target.value })}
        className={cn(fieldClass, "max-w-sm")}
      />
    </Row>
  );

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[90dvh] gap-0 overflow-y-auto rounded-3xl border-0 bg-background p-0 sm:max-w-2xl">
          <DialogHeader className="sticky top-0 z-10 border-b bg-background/85 px-6 py-4 text-left backdrop-blur-xl">
            <DialogTitle className="flex items-center gap-2 text-[15px]">
              <ShoppingBag className="size-4 text-muted-foreground" />
              {draft.name}
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-x-2 text-xs">
              บันทึกอัตโนมัติเมื่อออกจากช่อง
              <a href={`/product/${product.id}`} target="_blank" rel="noopener" className="inline-flex items-center gap-0.5 font-medium text-foreground hover:underline">
                ดูบนหน้าร้าน
                <ExternalLink className="size-3" />
              </a>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-6 p-6">
            <Group title="ข้อมูลสินค้า">
              {textField("name", "ชื่อสินค้า")}
              {textField("price", "ราคาเริ่มต้น", "เช่น ฿299")}
              <Row label="หมวดหมู่">
                <Select value={draft.category || NO_CATEGORY} onValueChange={(v) => commit({ category: v === NO_CATEGORY ? "" : v })}>
                  <SelectTrigger size="sm" className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
              <Row label="สถานะ" hint="หมดชั่วคราวจะปิดการสั่งซื้อทันที">
                <Select value={draft.status ?? "active"} onValueChange={(v) => commit({ status: v as ProductStatus })}>
                  <SelectTrigger size="sm" className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(statusLabels) as ProductStatus[]).map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
              <Row label="ยอดขายสะสม">
                <input
                  type="number"
                  min={0}
                  value={draft.totalSold ?? 0}
                  aria-label="ยอดขายสะสม"
                  onChange={(e) => setDraft({ ...draft, totalSold: Number(e.target.value) || 0 })}
                  onBlur={() => void inventory.updateProduct(product.id, { totalSold: draft.totalSold ?? 0 })}
                  className={cn(fieldClass, "w-28")}
                />
              </Row>
            </Group>

            <Group title="รูปภาพและรายละเอียด">
              <ImageRow label="รูปสินค้า" value={draft.imageUrl} onChange={(imageUrl) => commit({ imageUrl })} />
              <Row label="รายละเอียด" stacked>
                <textarea
                  value={draft.description}
                  rows={4}
                  aria-label="รายละเอียด"
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  onFocus={(e) => (e.target.dataset.initial = e.target.value)}
                  onBlur={(e) => e.target.value !== e.target.dataset.initial && void inventory.updateProduct(product.id, { description: e.target.value })}
                  className="w-full resize-y rounded-xl bg-secondary px-3 py-2 text-[13px] leading-relaxed outline-none"
                />
              </Row>
            </Group>

            <Group
              title={`ตัวเลือกราคา (${draft.tiers?.length ?? 0})`}
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const tiers = [...(draft.tiers ?? []), { id: `tier-${Date.now()}`, label: "", price: 0, stock: 0 }];
                    setDraft({ ...draft, tiers });
                    commitTiers(tiers);
                  }}
                >
                  <Plus />
                  เพิ่มตัวเลือก
                </Button>
              }
            >
              {draft.tiers?.length ? (
                <>
                  <div className="hidden grid-cols-[1fr_7rem_6rem_2rem] gap-2 px-4 py-2 text-[11px] text-muted-foreground sm:grid">
                    <span>ชื่อตัวเลือก</span>
                    <span className="text-right">ราคา (บาท)</span>
                    <span className="text-right">สต็อก</span>
                    <span />
                  </div>
                  {draft.tiers.map((tier) => (
                    <div key={tier.id} className="grid grid-cols-[1fr_5rem_4rem_2rem] items-center gap-2 px-4 py-2 sm:grid-cols-[1fr_7rem_6rem_2rem]">
                      <input
                        value={tier.label}
                        placeholder="เช่น 7 วัน"
                        aria-label="ชื่อตัวเลือก"
                        onChange={(e) => setTier(tier.id, { label: e.target.value })}
                        onBlur={() => commitTiers()}
                        className="min-w-0 rounded-md bg-secondary px-2.5 py-1.5 text-[13px] outline-none"
                      />
                      <input
                        type="number"
                        min={0}
                        value={tier.price}
                        aria-label="ราคา"
                        onChange={(e) => setTier(tier.id, { price: Number(e.target.value) })}
                        onBlur={() => commitTiers()}
                        className="min-w-0 rounded-md bg-secondary px-2.5 py-1.5 text-right text-[13px] outline-none"
                      />
                      <input
                        type="number"
                        min={0}
                        value={tier.stock}
                        aria-label="สต็อก"
                        onChange={(e) => setTier(tier.id, { stock: Number(e.target.value) })}
                        onBlur={() => commitTiers()}
                        className="min-w-0 rounded-md bg-secondary px-2.5 py-1.5 text-right text-[13px] outline-none"
                      />
                      <button
                        type="button"
                        aria-label="ลบตัวเลือก"
                        className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive"
                        onClick={() => {
                          const tiers = (draft.tiers ?? []).filter((t) => t.id !== tier.id);
                          setDraft({ ...draft, tiers });
                          commitTiers(tiers);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </>
              ) : (
                <p className="px-4 py-4 text-[13px] text-muted-foreground">ยังไม่มีตัวเลือกราคา ลูกค้าจะยังซื้อสินค้านี้ไม่ได้</p>
              )}
            </Group>

            <div className="flex justify-between gap-3">
              <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 />
                ลบสินค้า
              </Button>
              <Button className="rounded-full px-5" onClick={onClose}>
                เสร็จสิ้น
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>ลบสินค้า “{draft.name}”?</AlertDialogTitle>
            <AlertDialogDescription>สินค้าจะหายจากหน้าร้านทันที และย้อนกลับไม่ได้</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                onClose();
                void inventory.deleteProduct(product.id);
              }}
            >
              ลบสินค้า
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export type ProductsHandle = { add: () => Promise<void> };

export const ProductsSection = forwardRef<ProductsHandle>(function ProductsSection(_props, ref) {
  const { inventory, categories } = useAdminData();
  const [editing, setEditing] = useState<SyncXProduct | null>(null);
  const [query, setQuery] = useState("");

  const add = async (category?: string) => {
    const created = await inventory.addProduct(category);
    if (created) {
      setEditing(created);
      if (!inventory.databaseMode) toast("เพิ่มสินค้าใน localStorage แล้ว");
    }
  };
  useImperativeHandle(ref, () => ({ add: () => add() }));

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const map = new Map<string, SyncXProduct[]>();
    if (!q) for (const c of categories.categories) if (c.isActive) map.set(c.name, []);
    for (const p of inventory.products) {
      if (q && !p.name.toLowerCase().includes(q)) continue;
      const name = p.category || "สินค้าทั่วไป";
      map.set(name, [...(map.get(name) ?? []), p]);
    }
    return Array.from(map.entries());
  }, [categories.categories, inventory.products, query]);

  if (inventory.loading) return <div className="h-64 animate-pulse rounded-2xl bg-card" />;

  return (
    <>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`ค้นหาสินค้า (${inventory.products.length} รายการ)`}
        aria-label="ค้นหาสินค้า"
        className="h-9 rounded-full bg-card px-4 text-[13px] shadow-[0_0_0_0.5px_var(--border)] outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
      />
      {groups.length ? (
        groups.map(([name, items]) => (
          <Group
            key={name}
            title={name}
            description={`${items.length} รายการ`}
            actions={
              <Button variant="ghost" size="sm" onClick={() => void add(name)}>
                <Plus />
                เพิ่ม
              </Button>
            }
          >
            {items.length ? (
              items.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setEditing(product)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-secondary/70"
                >
                  <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-secondary">
                    {product.imageUrl ? <img src={product.imageUrl} alt="" className="size-full object-cover" /> : <ShoppingBag className="size-4 text-muted-foreground" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{product.name}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {product.price} · คลัง {totalStock(product.tiers)} · {product.tiers?.length ?? 0} ตัวเลือก
                    </span>
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px]",
                      product.status === "active" || !product.status ? "bg-secondary" : "bg-foreground text-background",
                    )}
                  >
                    {statusLabels[product.status ?? "active"]}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground/60" />
                </button>
              ))
            ) : (
              <p className="px-4 py-3 text-[13px] text-muted-foreground">ยังไม่มีสินค้าในหมวดหมู่นี้</p>
            )}
          </Group>
        ))
      ) : (
        <Empty icon={<ShoppingBag className="size-6" strokeWidth={1.5} />}>{query ? "ไม่พบสินค้าที่ค้นหา" : "ยังไม่มีสินค้าในระบบ"}</Empty>
      )}
      {editing && <ProductEditor product={editing} onClose={() => setEditing(null)} />}
    </>
  );
});
