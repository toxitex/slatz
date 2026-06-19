import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "wouter";
import { ArrowLeft, Brush, Database, Download, FolderOpen, History, Image, KeyRound, LayoutGrid, Lock, LogIn, LogOut, Megaphone, PackagePlus, Plus, RefreshCw, RotateCcw, Save, Settings, ShoppingBag, Sparkles, Tag, Ticket, Trash2, Upload, Users, Wallet, ChevronDown, ChevronUp, ChevronRight, CheckCircle, Pause, XCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useSiteConfig, type Category, type Coupon, type ProductStatus, type ProductTier, type SiteConfig, type SyncXProduct } from "@/contexts/SiteConfigContext";
import { useInventoryProducts } from "@/hooks/useInventoryProducts";
import { useCoupons } from "@/hooks/useCoupons";
import { useCategories } from "@/hooks/useCategories";
import { useAuth } from "@/hooks/useAuth";
import { ShinyText, BorderBeam, Magnetic, SpotlightGlow, GlowingCards, ExpandableSearchBar, ExpandableSpeedDial } from "@/components/fx";
import { LogoIcon } from "@/components/LogoIcon";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger, useSidebar, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Design philosophy reminder: Cyber-Noir Thai Commerce.
 * The admin dashboard built on responsive Tailwind v4 classes and components.
 */

type SectionKey = keyof Pick<SiteConfig, "theme" | "stats" | "footer" | "store">;

type SidebarKey = "branding" | "colors" | "hero" | "announcement" | "stats" | "products" | "categories" | "coupons" | "orders" | "users" | "store-config" | "footer" | "backup";

type SidebarMenuItemProps = {
  label: string;
  icon: typeof Sparkles;
  key?: SidebarKey;
  items?: { key: SidebarKey; label: string; icon: typeof Sparkles }[];
};

const sidebarGroups: {
  title: string;
  items: SidebarMenuItemProps[];
}[] = [
  {
    title: "ภาพรวมระบบ",
    items: [
      { key: "stats", label: "วิเคราะห์ข้อมูล", icon: Settings },
    ],
  },
  {
    title: "จัดการร้านค้า",
    items: [
      {
        label: "คลังสินค้า",
        icon: ShoppingBag,
        items: [
          { key: "products", label: "สินค้า", icon: ShoppingBag },
          { key: "categories", label: "หมวดหมู่สินค้า", icon: LayoutGrid },
          { key: "coupons", label: "คูปองส่วนลด", icon: Ticket },
        ],
      },
      { key: "orders", label: "ประวัติคำสั่งซื้อ", icon: History },
      { key: "users", label: "จัดการลูกค้า", icon: Users },
      { key: "store-config", label: "ช่องทางการชำระเงิน", icon: Wallet },
    ],
  },
  {
    title: "ตกแต่งร้าน",
    items: [
      {
        label: "ออกแบบร้าน",
        icon: Brush,
        items: [
          { key: "branding", label: "ข้อมูลแบรนด์", icon: Sparkles },
          { key: "colors", label: "สีธีม", icon: Brush },
          { key: "hero", label: "แบนเนอร์สไลด์", icon: Image },
          { key: "announcement", label: "ประกาศบนเว็บ", icon: Megaphone },
          { key: "footer", label: "ฟุตเตอร์", icon: Save },
        ],
      },
    ],
  },
  {
    title: "จัดการระบบ",
    items: [
      { key: "backup", label: "จัดการข้อมูล", icon: Database },
    ],
  },
];

const sidebarItems = sidebarGroups.flatMap((group) => 
  group.items.flatMap((item) => (item.items ? item.items : [item as { key: SidebarKey; label: string; icon: typeof Sparkles }]))
);

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="flex flex-col gap-1.5 w-full">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="syncx-input" />
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1.5 w-full">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      <textarea value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} rows={4} className="syncx-input resize-none" />
    </label>
  );
}

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="syncx-glass p-6 md:p-8 rounded-2xl relative overflow-hidden flex flex-col gap-6 w-full">
      <BorderBeam size={70} duration={9} delay={1} />
      <div className="flex flex-col gap-1 border-b border-[var(--syncx-border)] pb-4 z-10">
        <span className="text-[10px] text-[var(--syncx-accent)] font-bold tracking-widest uppercase">{eyebrow}</span>
        <h2 className="text-base font-bold text-white tracking-wide uppercase">{title}</h2>
      </div>
      <div className="z-10 flex flex-col gap-6">{children}</div>
    </section>
  );
}

function newTier(): ProductTier {
  return {
    id: `tier-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    label: "",
    price: 0,
    stock: 0,
  };
}

function TierEditor({ tiers, onChange }: { tiers: ProductTier[]; onChange: (tiers: ProductTier[]) => void }) {
  const updateTier = (id: string, patch: Partial<ProductTier>) => {
    onChange(tiers.map((tier) => (tier.id === id ? { ...tier, ...patch } : tier)));
  };
  const removeTier = (id: string) => onChange(tiers.filter((tier) => tier.id !== id));
  const addTier = () => onChange([...tiers, newTier()]);

  return (
    <div className="flex flex-col gap-3 w-full border border-[var(--syncx-border)] bg-black/25 p-4 rounded-xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white flex items-center gap-1.5"><Tag size={13} className="text-[var(--syncx-accent)]" />ตัวเลือกราคา ({tiers.length} รายการ)</span>
        <button type="button" className="syncx-btn-secondary py-1 px-3 text-[11px] rounded-lg" onClick={addTier}><Plus size={13} />เพิ่มตัวเลือก</button>
      </div>
      {tiers.length === 0 ? (
        <p className="text-center text-xs text-gray-500 py-4 italic">ยังไม่มีตัวเลือกราคา</p>
      ) : (
        <div className="flex flex-col gap-2">
          {tiers.map((tier) => (
            <div key={tier.id} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <input type="text" placeholder="ชื่อตัวเลือก เช่น 7 วัน" value={tier.label} onChange={(event) => updateTier(tier.id, { label: event.target.value })} className="syncx-input flex-grow" />
              <input type="number" min={0} placeholder="ราคา (บาท)" value={tier.price} onChange={(event) => updateTier(tier.id, { price: Number(event.target.value) || 0 })} className="syncx-input w-full sm:w-28" />
              <input type="number" min={0} placeholder="สต็อก" value={tier.stock} onChange={(event) => updateTier(tier.id, { stock: Number(event.target.value) || 0 })} className="syncx-input w-full sm:w-24" />
              <button type="button" className="syncx-btn-danger p-2 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer" onClick={() => removeTier(tier.id)} aria-label="ลบตัวเลือก"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductEditor({ product, onChange, onDelete, categories }: { product: SyncXProduct; onChange: (patch: Partial<SyncXProduct>) => void; onDelete: () => void; categories: Category[] }) {
  const status: ProductStatus = product.status ?? "active";
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-32 aspect-square rounded-xl bg-black/40 border border-[var(--syncx-border)] flex items-center justify-center overflow-hidden flex-shrink-0">
          {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" /> : <ShoppingBag size={28} className="text-gray-600" />}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
          <Field label="ชื่อสินค้า" value={product.name} onChange={(value) => onChange({ name: value })} />
          <Field label="ราคาเริ่มต้น" value={product.price} onChange={(value) => onChange({ price: value })} placeholder="เช่น ฿299" />
          <label className="flex flex-col gap-1.5 w-full">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">หมวดหมู่</span>
            {categories.length > 0 ? (
              <Select value={product.category || "__none__"} onValueChange={(value) => onChange({ category: value === "__none__" ? "" : value })}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="— เลือกหมวดหมู่ —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— ไม่ระบุหมวดหมู่ —</SelectItem>
                  {categories.filter((c) => c.isActive).map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                  {product.category && !categories.some((c) => c.isActive && c.name === product.category) && (
                    <SelectItem value={product.category}>{product.category} (ไม่ได้ลงทะเบียน)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            ) : (
              <input type="text" value={product.category} placeholder="ชื่อหมวดหมู่" onChange={(event) => onChange({ category: event.target.value })} className="syncx-input" />
            )}
          </label>
          <Field label="ลิงก์รูปภาพสินค้า" value={product.imageUrl} onChange={(value) => onChange({ imageUrl: value })} placeholder="https://..." />
          <label className="flex flex-col gap-1.5 w-full">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">สถานะสินค้า</span>
            <Select value={status} onValueChange={(value) => onChange({ status: value as ProductStatus })}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active"><CheckCircle size={14} className="inline mr-1.5 text-green-500" />เปิดขาย</SelectItem>
                <SelectItem value="out_of_stock"><Pause size={14} className="inline mr-1.5 text-yellow-500" />หมดชั่วคราว</SelectItem>
                <SelectItem value="hidden"><EyeOff size={14} className="inline mr-1.5 text-gray-500" />ซ่อนจากหน้าร้าน</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <Field label="ยอดขายสะสม" value={String(product.totalSold ?? 0)} onChange={(value) => onChange({ totalSold: Number(value) || 0 })} type="number" />
          <div className="sm:col-span-2">
            <TextAreaField label="รายละเอียด" value={product.description} onChange={(value) => onChange({ description: value })} />
          </div>
          <div className="sm:col-span-2">
            <TierEditor tiers={product.tiers ?? []} onChange={(tiers) => onChange({ tiers })} />
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center border-t border-[var(--syncx-border)] pt-4">
        <button className="syncx-btn-danger py-1.5 px-4 rounded-lg text-xs" onClick={onDelete} type="button"><Trash2 size={14} />ลบสินค้า</button>
      </div>
    </div>
  );
}

function CategoryEditor({ category, onChange, onDelete }: { category: Category; onChange: (patch: Partial<Category>) => void; onDelete: () => void }) {
  return (
    <div className="syncx-glass p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-5">
      <div className="w-16 h-16 rounded-xl bg-black/40 border border-[var(--syncx-border)] flex items-center justify-center overflow-hidden flex-shrink-0">
        {category.imageUrl ? <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover" /> : <LayoutGrid size={22} className="text-gray-600" />}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 flex-grow w-full">
        <Field label="ชื่อหมวดหมู่" value={category.name} onChange={(name) => onChange({ name })} />
        <Field label="URL รูปแบนเนอร์" value={category.imageUrl} onChange={(imageUrl) => onChange({ imageUrl })} placeholder="https://..." />
        <Field label="ลำดับการแสดง" value={String(category.sortOrder)} type="number" onChange={(v) => onChange({ sortOrder: Number(v) || 0 })} />
        <label className="flex flex-col gap-1.5 w-full">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">สถานะ</span>
          <Select value={category.isActive ? "on" : "off"} onValueChange={(value) => onChange({ isActive: value === "on" })}>
            <SelectTrigger className="h-10 text-sm w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="on">👁 แสดง</SelectItem>
              <SelectItem value="off">🚫 ซ่อน</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </div>
      <button className="syncx-btn-danger self-stretch md:self-auto flex items-center justify-center py-2 px-4 rounded-lg text-xs cursor-pointer" type="button" onClick={onDelete}><Trash2 size={14} />ลบ</button>
    </div>
  );
}

function CouponEditor({ coupon, onChange, onDelete }: { coupon: Coupon; onChange: (patch: Partial<Coupon>) => void; onDelete: () => void }) {
  return (
    <div className="syncx-glass p-5 rounded-2xl flex flex-col md:flex-row items-stretch md:items-end gap-4">
      <label className="flex flex-col gap-1.5 w-full">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">โค้ด</span>
        <input type="text" value={coupon.code} onChange={(event) => onChange({ code: event.target.value.toUpperCase() })} className="syncx-input" />
      </label>
      <label className="flex flex-col gap-1.5 w-full">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">ประเภท</span>
        <Select value={coupon.discountType} onValueChange={(value) => onChange({ discountType: value as Coupon["discountType"] })}>
          <SelectTrigger className="h-10 text-sm w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percent">% เปอร์เซ็นต์</SelectItem>
            <SelectItem value="fixed">฿ จำนวนคงที่ (บาท)</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <label className="flex flex-col gap-1.5 w-full">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">มูลค่าส่วนลด</span>
        <input type="number" min={0} value={coupon.discountValue} onChange={(event) => onChange({ discountValue: Number(event.target.value) || 0 })} className="syncx-input" />
      </label>
      <label className="flex flex-col gap-1.5 w-full">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">สถานะ</span>
        <Select value={coupon.active ? "on" : "off"} onValueChange={(value) => onChange({ active: value === "on" })}>
          <SelectTrigger className="h-10 text-sm w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="on"><CheckCircle size={14} className="inline mr-1.5 text-green-500" />ใช้งานได้</SelectItem>
            <SelectItem value="off"><XCircle size={14} className="inline mr-1.5 text-red-500" />ปิด</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <button type="button" className="syncx-btn-danger py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer" onClick={onDelete}><Trash2 size={13} />ลบ</button>
    </div>
  );
}

type AdminUser = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  balance: number;
  created_at: string;
  order_count: number;
  total_spent: number;
};

function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { api } = await import("@/lib/api");
      const data = await api.get<AdminUser[]>("/api/users");
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const updateUser = useCallback(async (id: string, patch: { balance?: number; display_name?: string }) => {
    try {
      const { api } = await import("@/lib/api");
      await api.patch(`/api/users/${id}`, patch);
      toast.success("อัปเดตผู้ใช้แล้ว");
      void refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }, [refresh]);

  return { users, loading, error, refresh, updateUser };
}

type AdminOrder = {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  product_id: string;
  product_name: string;
  tier_id: string;
  tier_label: string;
  quantity: number;
  price: number;
  total: number;
  code_key: string;
  created_at: string;
};

function useAdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { api } = await import("@/lib/api");
      const data = await api.get<AdminOrder[]>("/api/admin/orders");
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return { orders, loading, error, refresh };
}

function UserRow({ user, onUpdate }: { user: AdminUser; onUpdate: (id: string, patch: { balance?: number; display_name?: string }) => void }) {
  const [editBalance, setEditBalance] = useState(false);
  const [balanceVal, setBalanceVal] = useState(String(user.balance));
  const [editName, setEditName] = useState(false);
  const [nameVal, setNameVal] = useState(user.display_name);

  const saveBalance = () => {
    const num = Number(balanceVal);
    if (!isNaN(num) && num >= 0) {
      onUpdate(user.id, { balance: num });
      setEditBalance(false);
    }
  };

  const saveName = () => {
    if (nameVal.trim()) {
      onUpdate(user.id, { display_name: nameVal.trim() });
      setEditName(false);
    }
  };

  return (
    <tr className="border-b border-[var(--syncx-border)] hover:bg-white/[0.01] transition-colors">
      <td className="p-3 align-middle">
        <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center overflow-hidden bg-black/40">
          {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users size={14} className="text-gray-500" />}
        </div>
      </td>
      <td className="p-3 align-middle font-medium text-white">
        {editName ? (
          <span className="flex items-center gap-1">
            <input type="text" value={nameVal} onChange={(e) => setNameVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveName()} autoFocus className="px-2 py-1 bg-black/60 border border-[var(--syncx-border)] rounded text-xs text-white outline-none w-28" />
            <button onClick={saveName} className="p-1 text-emerald-400 hover:text-emerald-300 font-bold bg-transparent border-none cursor-pointer text-xs">✓</button>
            <button onClick={() => { setEditName(false); setNameVal(user.display_name); }} className="p-1 text-red-400 hover:text-red-300 font-bold bg-transparent border-none cursor-pointer text-xs">✕</button>
          </span>
        ) : (
          <span className="cursor-pointer hover:text-[var(--syncx-accent)] transition-colors text-xs" onClick={() => setEditName(true)} title="คลิกเพื่อแก้ไข">{user.display_name || "—"}</span>
        )}
      </td>
      <td className="p-3 align-middle text-xs text-gray-400 select-all">{user.email}</td>
      <td className="p-3 align-middle text-xs">
        {editBalance ? (
          <span className="flex items-center gap-1">
            <input type="number" min={0} step={1} value={balanceVal} onChange={(e) => setBalanceVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveBalance()} autoFocus className="px-2 py-1 bg-black/60 border border-[var(--syncx-border)] rounded text-xs text-white outline-none w-20" />
            <button onClick={saveBalance} className="p-1 text-emerald-400 hover:text-emerald-300 font-bold bg-transparent border-none cursor-pointer text-xs">✓</button>
            <button onClick={() => { setEditBalance(false); setBalanceVal(String(user.balance)); }} className="p-1 text-red-400 hover:text-red-300 font-bold bg-transparent border-none cursor-pointer text-xs">✕</button>
          </span>
        ) : (
          <span className="cursor-pointer hover:text-[var(--syncx-accent)] transition-colors flex items-center gap-1 text-white font-bold" onClick={() => setEditBalance(true)} title="คลิกเพื่อแก้ไข">
            <Wallet size={12} className="text-gray-500" />฿{user.balance.toLocaleString("th-TH")}
          </span>
        )}
      </td>
      <td className="p-3 align-middle text-xs font-mono text-center text-gray-300">{user.order_count}</td>
      <td className="p-3 align-middle text-xs font-semibold text-right text-white">฿{user.total_spent.toLocaleString("th-TH")}</td>
      <td className="p-3 align-middle text-xs text-gray-500 text-right">{new Date(user.created_at).toLocaleDateString("th-TH")}</td>
    </tr>
  );
}

function AdminSidebar({
  activeSection,
  selectSection,
  databaseMode,
  handleLockAdmin
}: {
  activeSection: SidebarKey;
  selectSection: (key: SidebarKey) => void;
  databaseMode: boolean;
  handleLockAdmin: () => void;
}) {
  const { state } = useSidebar();
  const { user } = useAuth();
  const { config } = useSiteConfig();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-white/[0.06] bg-[#050507]/95 backdrop-blur-2xl">
      <SidebarHeader className={cn("flex flex-col gap-3 border-b border-white/[0.04] transition-all duration-300", isCollapsed ? "p-2" : "p-4")}>
        {/* Team Selector / Workspace Selector using DropdownMenu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex items-center bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/[0.08] hover:border-white/[0.12] hover:bg-white/[0.04] rounded-lg relative overflow-hidden group transition-all duration-300 outline-none cursor-pointer mx-auto",
              isCollapsed ? "w-9 h-9 justify-center" : "w-full p-2 gap-3 text-left rounded-xl"
            )}>
              <BorderBeam size={isCollapsed ? 30 : 60} duration={8} delay={0} />
              <SpotlightGlow size={isCollapsed ? 100 : 200} />
              {isCollapsed ? (
                config.logoImageUrl ? (
                  <img src={config.logoImageUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="flex items-center justify-center w-full h-full text-[var(--syncx-accent)] bg-gradient-to-br from-[var(--syncx-accent)]/20 to-[var(--syncx-accent)]/5">
                    <LogoIcon size={15} />
                  </span>
                )
              ) : (
                <>
                  <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--syncx-accent)]/20 to-[var(--syncx-accent)]/5 text-[var(--syncx-accent)] shadow-[0_0_20px_color-mix(in_srgb,var(--syncx-accent)_25%,transparent)] flex-shrink-0 border border-[var(--syncx-accent)]/20 overflow-hidden">
                    {config.logoImageUrl ? (
                      <img src={config.logoImageUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <LogoIcon size={15} />
                    )}
                  </span>
                  <div className="flex items-center justify-between flex-grow min-w-0">
                    <div className="min-w-0">
                      <strong className="block text-xs font-bold text-white tracking-wide truncate">{config.siteName || "SyncX Store"}</strong>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${databaseMode ? "bg-emerald-500 shadow-[0_0_6px_theme(colors.emerald.500)]" : "bg-amber-500 shadow-[0_0_6px_theme(colors.amber.500)]"} animate-pulse`} />
                        <span className="text-[9px] text-gray-400">{databaseMode ? "SQLite online" : "Local fallback"}</span>
                      </div>
                    </div>
                    <ChevronDown size={12} className="text-gray-400 opacity-60 ml-2 flex-shrink-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-black/95 border-white/[0.08] text-white" align="start" side={isCollapsed ? "right" : "bottom"} sideOffset={10}>
            <DropdownMenuLabel className="text-xs text-gray-500">Store Environment</DropdownMenuLabel>
            <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{config.siteName || "SyncX Store"}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/[0.08]" />
            <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer text-xs flex items-center gap-2" asChild>
              <Link href="/" className="w-full flex items-center gap-2">
                <ArrowLeft size={12} />
                <span>กลับหน้าร้าน</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent>
        {sidebarGroups.map((group) => {
          return (
            <SidebarGroup key={group.title}>
              {/* Group Label */}
              {!isCollapsed && (
                <div className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.12em] px-2 mb-1">
                  {group.title}
                </div>
              )}

              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    if (item.items) {
                      // Collapsible menu item (e.g. คลังสินค้า, ออกแบบร้าน)
                      const isSubActive = item.items.some(sub => sub.key === activeSection);
                      const ParentIcon = item.icon;

                      if (isCollapsed) {
                        // Collapsed state: Render as a DropdownMenu
                        return (
                          <SidebarMenuItem key={item.label}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                  isActive={isSubActive}
                                  tooltip={item.label}
                                  className={cn(
                                    "relative",
                                    isSubActive ? "text-white bg-white/[0.04]" : "text-gray-500 hover:text-gray-200 hover:bg-white/[0.02]"
                                  )}
                                >
                                  <ParentIcon size={14} className={cn(isSubActive ? "text-[var(--syncx-accent)]" : "text-gray-500")} />
                                </SidebarMenuButton>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-48 bg-black/95 border-white/[0.08] text-white" align="start" side="right" sideOffset={10}>
                                <DropdownMenuLabel className="text-xs text-gray-500">{item.label}</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/[0.08]" />
                                {item.items.map(sub => {
                                  const isSubItemActive = sub.key === activeSection;
                                  const SubIcon = sub.icon;
                                  return (
                                    <DropdownMenuItem
                                      key={sub.key}
                                      onClick={() => selectSection(sub.key)}
                                      className={cn(
                                        "focus:bg-white/10 focus:text-white cursor-pointer text-xs flex items-center gap-2",
                                        isSubItemActive && "bg-white/5 font-semibold text-white"
                                      )}
                                    >
                                      <SubIcon size={12} className={isSubItemActive ? "text-[var(--syncx-accent)]" : "text-gray-400"} />
                                      <span>{sub.label}</span>
                                    </DropdownMenuItem>
                                  );
                                })}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </SidebarMenuItem>
                        );
                      }

                      // Expanded state: Render as Collapsible
                      return (
                        <SidebarMenuItem key={item.label} className="w-full">
                          <Collapsible defaultOpen={isSubActive} className="group/collapsible w-full">
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton
                                className={cn(
                                  "relative flex items-center justify-between w-full text-left text-xs font-medium py-2 px-3 rounded-lg outline-none cursor-pointer transition-all duration-200 text-gray-500 hover:text-gray-200 hover:bg-white/[0.02]",
                                  isSubActive && "text-white"
                                )}
                              >
                                <span className="flex items-center gap-2.5">
                                  <ParentIcon size={13} className={cn("transition-colors", isSubActive ? "text-[var(--syncx-accent)]" : "text-gray-500")} />
                                  <span>{item.label}</span>
                                </span>
                                <ChevronRight size={12} className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-gray-500" />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="data-[state=closed]:animate-none data-[state=open]:animate-none">
                              <SidebarMenuSub className="pl-4 border-l border-white/[0.04] ml-5 mt-1 flex flex-col gap-0.5">
                                {item.items.map(sub => {
                                  const isSubItemActive = sub.key === activeSection;
                                  const SubIcon = sub.icon;
                                  return (
                                    <SidebarMenuSubItem key={sub.key}>
                                      <SidebarMenuSubButton
                                        asChild
                                        isActive={isSubItemActive}
                                        className={cn(
                                          "relative flex items-center gap-2.5 w-full text-left text-[11.5px] py-1.5 px-3 rounded-md transition-all duration-200 outline-none cursor-pointer border border-transparent hover:bg-white/[0.02]",
                                          isSubItemActive 
                                            ? "text-white font-semibold bg-white/[0.04] border-white/[0.06]" 
                                            : "text-gray-500 hover:text-gray-200"
                                        )}
                                      >
                                        <button onClick={() => selectSection(sub.key)} className="w-full flex items-center gap-2.5 text-left bg-transparent border-none p-0 cursor-pointer">
                                          <SubIcon size={12} className={cn("transition-colors", isSubItemActive ? "text-[var(--syncx-accent)]" : "text-gray-600")} />
                                          <span>{sub.label}</span>
                                        </button>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  );
                                })}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>
                        </SidebarMenuItem>
                      );
                    } else {
                      // Simple menu item
                      const isActive = item.key === activeSection;
                      const ItemIcon = item.icon;

                      return (
                        <SidebarMenuItem key={item.key} className="relative">
                          <SidebarMenuButton
                            isActive={isActive}
                            tooltip={item.label}
                            onClick={() => selectSection(item.key!)}
                            className={cn(
                              "relative",
                              isActive
                                ? "text-white font-semibold bg-white/[0.06] border border-white/[0.08]"
                                : "text-gray-500 hover:text-gray-200 hover:bg-white/[0.02]"
                            )}
                          >
                            <span className={cn(
                              "flex items-center gap-2.5 relative z-10",
                              isCollapsed && "justify-center"
                            )}>
                              <ItemIcon
                                size={14}
                                className={cn(
                                  "relative z-10 flex-shrink-0 transition-colors duration-200",
                                  isActive ? "text-[var(--syncx-accent)]" : "text-gray-500"
                                )}
                              />
                              {!isCollapsed && <span className="relative z-10">{item.label}</span>}
                            </span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    }
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className={cn("border-t border-white/[0.05] transition-all duration-300", isCollapsed ? "p-2" : "p-3")}>
        {/* User profile settings trigger with DropdownMenu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex items-center bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.06] rounded-lg transition-all duration-300 outline-none cursor-pointer mx-auto",
              isCollapsed ? "w-9 h-9 justify-center p-0" : "w-full p-2.5 justify-between gap-2 rounded-xl"
            )}>
              {isCollapsed ? (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white overflow-hidden ring-1 ring-white/5">
                  {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-[var(--syncx-accent)]">{user?.initial || "A"}</span>}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 overflow-hidden ring-1 ring-white/5">
                      {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-[var(--syncx-accent)]">{user?.initial || "A"}</span>}
                    </div>
                    <div className="min-w-0 text-left">
                      <span className="block text-[11px] font-bold text-white truncate max-w-[100px]">{user?.displayName || "Admin"}</span>
                      <span className="block text-[9px] text-gray-500 truncate max-w-[100px]">{user?.email || "admin@syncx.xyz"}</span>
                    </div>
                  </div>
                  <ChevronUp size={12} className="text-gray-400 opacity-60 ml-2 flex-shrink-0" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-black/95 border-white/[0.08] text-white" align="start" side={isCollapsed ? "right" : "top"} sideOffset={10}>
            <DropdownMenuLabel className="text-xs text-gray-500">บัญชีผู้ดูแลระบบ</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/[0.08]" />
            <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer text-xs flex items-center gap-2" disabled>
              <Users size={12} />
              <span>ข้อมูลส่วนตัว (เร็วๆ นี้)</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/[0.08]" />
            <DropdownMenuItem 
              onClick={handleLockAdmin}
              className="focus:bg-red-500/20 focus:text-red-400 text-red-400 cursor-pointer text-xs flex items-center gap-2"
            >
              <LogOut size={12} />
              <span>ล็อกแดชบอร์ด</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export default function Admin() {
  const { config, updateConfig, updateSection, resetConfig, exportConfig, importConfig } = useSiteConfig();
  const { user } = useAuth();
  const { products, loading, error, databaseMode, refreshProducts, addProduct, updateProduct, deleteProduct } = useInventoryProducts();
  const { coupons, loading: couponsLoading, error: couponsError, addCoupon, updateCoupon, deleteCoupon, refresh: refreshCoupons } = useCoupons();
  const { categories, loading: categoriesLoading, error: categoriesError, addCategory, updateCategory, deleteCategory, refresh: refreshCategories } = useCategories();
  const { users: adminUsers, loading: usersLoading, error: usersError, refresh: refreshUsers, updateUser } = useAdminUsers();
  const { orders: adminOrders, loading: ordersLoading, error: ordersError, refresh: refreshOrders } = useAdminOrders();
  const [importText, setImportText] = useState("");
  const [copied, setCopied] = useState(false);
  const adminAccessCode = import.meta.env.VITE_ADMIN_ACCESS_CODE || "syncx-admin";
  const [accessCode, setAccessCode] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(() => sessionStorage.getItem("syncx-admin-access") === "granted");
  const [editingProduct, setEditingProduct] = useState<SyncXProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<SyncXProduct | null>(null);
  const [activeSection, setActiveSection] = useState<SidebarKey>(() => {
    const saved = sessionStorage.getItem("syncx-admin-section") as SidebarKey | null;
    return saved && sidebarItems.some((item) => item.key === saved) ? saved : "branding";
  });
  const productCountLabel = useMemo(() => `${products.length} รายการ`, [products.length]);
  const groupedProducts = useMemo(() => {
    const groups: Record<string, SyncXProduct[]> = {};
    // First, initialize groups for all active categories in the database
    for (const cat of categories) {
      if (cat.isActive) {
        groups[cat.name] = [];
      }
    }
    // Group products
    for (const p of products) {
      const cat = p.category || "สินค้าทั่วไป";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    }
    return groups;
  }, [products, categories]);

  const selectSection = (key: SidebarKey) => {
    setActiveSection(key);
    sessionStorage.setItem("syncx-admin-section", key);
  };

  const activeItem = sidebarItems.find((item) => item.key === activeSection) ?? sidebarItems[0];

  const setNested = <K extends SectionKey>(section: K, patch: Partial<SiteConfig[K]>) => {
    updateSection(section, { ...config[section], ...patch });
  };

  const handleAddProduct = async (initialCategory?: string) => {
    const created = await addProduct(initialCategory);
    if (created) {
      setEditingProduct(created);
      if (!databaseMode) toast("เพิ่มสินค้าใน localStorage แล้ว");
    }
  };

  const handleAccessSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (accessCode.trim() === adminAccessCode) {
      sessionStorage.setItem("syncx-admin-access", "granted");
      sessionStorage.setItem("syncx-admin-access-code", accessCode.trim());
      setIsAuthorized(true);
      setAccessCode("");
      toast("เข้าสู่โหมดแอดมินแล้ว");
      return;
    }
    toast("รหัสแอดมินไม่ถูกต้อง");
  };

  const handleLockAdmin = () => {
    sessionStorage.removeItem("syncx-admin-access");
    sessionStorage.removeItem("syncx-admin-access-code");
    setIsAuthorized(false);
    toast("ล็อกแดชบอร์ดแอดมินแล้ว");
  };

  const handleExport = async () => {
    const exported = exportConfig();
    setImportText(exported);
    try {
      await navigator.clipboard.writeText(exported);
      setCopied(true);
      toast("คัดลอก JSON การตั้งค่าแล้ว");
    } catch {
      toast("สร้าง JSON แล้ว สามารถคัดลอกจากช่องด้านล่างได้");
    }
  };

  const handleImport = () => {
    if (!importText.trim()) {
      toast("กรุณาวาง JSON ก่อนนำเข้า");
      return;
    }
    const ok = importConfig(importText);
    toast(ok ? "นำเข้าการตั้งค่าเรียบร้อย" : "นำเข้าไม่สำเร็จ กรุณาตรวจสอบ JSON");
  };

  const handleLogoFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": file.type,
          "X-Admin-Access-Code": window.sessionStorage.getItem("syncx-admin-access-code") || "",
        },
        credentials: "include",
        body: arrayBuffer,
      });

      if (!response.ok) throw new Error("Upload failed");
      const { url } = await response.json();
      updateConfig({ logoImageUrl: url });
      toast.success("อัปโหลดโลโก้สำเร็จ");
    } catch (error) {
      console.error("Logo upload error:", error);
      toast.error("อัปโหลดโลโก้ล้มเหลว");
    }
  };

  const handleHeroFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": file.type,
          "X-Admin-Access-Code": window.sessionStorage.getItem("syncx-admin-access-code") || "",
        },
        credentials: "include",
        body: arrayBuffer,
      });

      if (!response.ok) throw new Error("Upload failed");
      const { url } = await response.json();
      updateConfig({ heroImageUrl: url });
      toast.success("อัปโหลดรูปฮีโร่สำเร็จ");
    } catch (error) {
      console.error("Hero upload error:", error);
      toast.error("อัปโหลดรูปฮีโร่ล้มเหลว");
    }
  };

  if (!isAuthorized) {
    return (
      <main className="syncx-page items-center justify-center p-4">
        <section className="syncx-glass p-8 rounded-2xl w-full max-w-md relative flex flex-col gap-6" aria-label="Admin access required">
          <BorderBeam size={80} duration={8} delay={0} />
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors duration-200 no-underline bg-transparent border-none cursor-pointer w-fit"><ArrowLeft size={15} />กลับหน้าร้าน</Link>
          <div className="w-12 h-12 rounded-xl bg-[var(--syncx-accent)]/10 text-[var(--syncx-accent)] flex items-center justify-center shadow-lg"><Lock size={22} /></div>
          <div>
            <span className="text-[10px] text-[var(--syncx-accent)] font-bold tracking-widest uppercase"><ShinyText speed={5}>PRIVATE CONTROL ROOM</ShinyText></span>
            <h1 className="text-xl font-extrabold text-white mt-1">สำหรับผู้ดูแลร้านเท่านั้น</h1>
            <p className="text-xs text-gray-400 leading-relaxed mt-2">แดชบอร์ดนี้ถูกซ่อนจากเมนูสาธารณะแล้ว และต้องใส่รหัสแอดมินก่อนแก้ไขสี โลโก้ คำบนเว็บไซต์ และข้อมูลสินค้า</p>
          </div>
          <form className="flex flex-col gap-4" onSubmit={handleAccessSubmit}>
            <label className="flex flex-col gap-1.5 w-full">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><KeyRound size={13} className="text-[var(--syncx-accent)]" />รหัสแอดมิน</span>
              <input type="password" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} placeholder="ใส่รหัสแอดมิน" autoComplete="current-password" className="syncx-input" />
            </label>
            <button className="syncx-btn-primary w-full py-2.5 text-xs" type="submit"><LogIn size={15} />เข้าสู่แดชบอร์ด</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen={true}>
        <AdminSidebar
          activeSection={activeSection}
          selectSection={selectSection}
          databaseMode={databaseMode}
          handleLockAdmin={handleLockAdmin}
        />

        <SidebarInset className="bg-[#050506] text-white min-h-screen flex flex-col flex-1 overflow-x-hidden">
          {/* Header */}
          <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 md:p-8 border-b border-[var(--syncx-border)] bg-black/10">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-white bg-white/5 border border-white/10 p-2 rounded-lg hover:bg-white/10 cursor-pointer" />
              <div>
                <span className="text-[10px] text-[var(--syncx-accent)] font-bold tracking-widest uppercase"><ShinyText speed={5}>CONTROL PANEL — {activeItem.label}</ShinyText></span>
                <h1 className="text-xl md:text-2xl font-extrabold text-white mt-1">จัดการระบบ SyncX</h1>
                <p className="text-xs text-gray-400 leading-relaxed mt-0.5">เลือกหัวข้อด้านซ้ายเพื่อตั้งค่าร้านค้า ปรับเปลี่ยนการแสดงผลและข้อมูลสินค้าสำเร็จทันที</p>
                
                {/* metrics/status info */}
                <div className="flex flex-wrap items-center gap-3 text-[10px] mt-3">
                  <span className="text-gray-500">สถานะระบบ:</span>
                  {loading ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                      <span>กำลังโหลดข้อมูล...</span>
                    </span>
                  ) : databaseMode ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>SQLite: ออนไลน์</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>SQLite: ออฟไลน์</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
            <ExpandableSearchBar placeholder="ค้นหา..." expandedWidth="15rem" />
            <Link href="/store" className="syncx-btn-secondary py-1.5 px-3.5 text-xs rounded-lg no-underline">ดูร้านค้า</Link>
            <button className="syncx-btn-secondary py-1.5 px-3.5 text-xs rounded-lg flex items-center gap-1 bg-transparent border-[var(--syncx-border)]" onClick={handleLockAdmin}><Lock size={13} />ล็อกแดชบอร์ด</button>
            {activeSection === "products" ? (
              <button className="syncx-btn-primary py-1.5 px-3.5 text-xs rounded-lg" onClick={() => void handleAddProduct()}><PackagePlus size={13} />เพิ่มสินค้า</button>
            ) : null}
            {activeSection === "categories" ? (
              <button className="syncx-btn-primary py-1.5 px-3.5 text-xs rounded-lg" onClick={() => void addCategory()}><Plus size={13} />เพิ่มหมวดหมู่</button>
            ) : null}
          </div>
        </header>

        <div className="p-6 md:p-8 flex flex-col gap-8 flex-grow">
          {activeSection === "branding" ? (
          <Section id="branding" eyebrow="BRAND" title="ข้อมูลแบรนด์">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="ชื่อเว็บ" value={config.siteName} onChange={(siteName) => updateConfig({ siteName })} />
              <Field label="คำอธิบาย SEO" value={config.seoDescription} onChange={(seoDescription) => updateConfig({ seoDescription })} placeholder="Meta description" />
              <Field label="ชื่อแบรนด์/โลโก้" value={config.logoText} onChange={(logoText) => updateConfig({ logoText })} />
              <Field label="ปุ่ม CTA" value={config.ctaText} onChange={(ctaText) => updateConfig({ ctaText })} placeholder="เช่น เริ่มต้นเลย!" />
              <Field label="ลิงก์รูปโลโก้" value={config.logoImageUrl} onChange={(logoImageUrl) => updateConfig({ logoImageUrl })} placeholder="https://..." />
              <label className="flex items-center justify-center gap-2 h-11 w-full rounded-xl border border-[var(--syncx-border)] hover:border-gray-500 transition-colors text-xs font-semibold text-white bg-black/30 cursor-pointer relative"><Upload size={14} />อัปโหลดโลโก้<input type="file" accept="image/*" onChange={handleLogoFile} className="absolute inset-0 opacity-0 cursor-pointer" /></label>
            </div>
          </Section>
          ) : null}

          {activeSection === "colors" ? (
          <Section id="colors" eyebrow="THEME" title="สีธีม">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              <Field label="Accent" type="color" value={config.theme.accentColor} onChange={(accentColor) => setNested("theme", { accentColor })} />
              <Field label="พื้นหลัง" type="color" value={config.theme.backgroundColor} onChange={(backgroundColor) => setNested("theme", { backgroundColor })} />
              <Field label="ปุ่ม" type="color" value={config.theme.buttonColor} onChange={(buttonColor) => setNested("theme", { buttonColor })} />
              <Field label="ข้อความหลัก" type="color" value={config.theme.textColor} onChange={(textColor) => setNested("theme", { textColor })} />
              <Field label="ข้อความรอง" type="color" value={config.theme.mutedTextColor} onChange={(mutedTextColor) => setNested("theme", { mutedTextColor })} />
              <Field label="การ์ดสินค้า" value={config.theme.cardColor} onChange={(cardColor) => setNested("theme", { cardColor })} placeholder="rgba(12, 12, 14, 0.72)" />
              <Field label="เส้นขอบ" value={config.theme.borderColor} onChange={(borderColor) => setNested("theme", { borderColor })} placeholder="rgba(255,255,255,0.08)" />
            </div>
          </Section>
          ) : null}

          {activeSection === "hero" ? (
          <Section id="hero" eyebrow="HERO" title="Hero / แบนเนอร์">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="ข้อความหลัก" value={config.heroHeadline} onChange={(heroHeadline) => updateConfig({ heroHeadline })} />
              <Field label="คำอธิบาย" value={config.heroSubtitle} onChange={(heroSubtitle) => updateConfig({ heroSubtitle })} />
              <Field label="ช่องค้นหา (Placeholder)" value={config.searchPlaceholder} onChange={(searchPlaceholder) => updateConfig({ searchPlaceholder })} />
              <Field label="ลิงก์รูปแบนเนอร์" value={config.heroImageUrl} onChange={(heroImageUrl) => updateConfig({ heroImageUrl })} placeholder="https://..." />
              <label className="flex items-center justify-center gap-2 h-11 w-full rounded-xl border border-[var(--syncx-border)] hover:border-gray-500 transition-colors text-xs font-semibold text-white bg-black/30 cursor-pointer relative"><Upload size={14} />อัปโหลดแบนเนอร์<input type="file" accept="image/*" onChange={handleHeroFile} className="absolute inset-0 opacity-0 cursor-pointer" /></label>
            </div>
          </Section>
          ) : null}

          {activeSection === "announcement" ? (
          <Section id="announcement" eyebrow="CONTENT" title="กระดานประกาศ">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="หัวข้อประกาศ" value={config.announcementTitle} onChange={(announcementTitle) => updateConfig({ announcementTitle })} />
              <TextAreaField label="รายละเอียดประกาศ" value={config.announcementBody} onChange={(announcementBody) => updateConfig({ announcementBody })} />
            </div>
          </Section>
          ) : null}

          {activeSection === "stats" ? (
          <Section id="stats" eyebrow="METRICS" title="ตัวเลขสถิติ">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              <Field label="ตัวเลข — ผู้ใช้" value={config.stats.users} onChange={(users) => setNested("stats", { users })} />
              <Field label="ป้ายกำกับ" value={config.stats.usersLabel} onChange={(usersLabel) => setNested("stats", { usersLabel })} />
              <Field label="หน่วยนับ" value={config.stats.usersUnit} onChange={(usersUnit) => setNested("stats", { usersUnit })} placeholder="คน" />
              <div className="hidden md:block" />
              
              <Field label="ตัวเลข — สินค้า" value={config.stats.products} onChange={(products) => setNested("stats", { products })} />
              <Field label="ป้ายกำกับ" value={config.stats.productsLabel} onChange={(productsLabel) => setNested("stats", { productsLabel })} />
              <Field label="หน่วยนับ" value={config.stats.productsUnit} onChange={(productsUnit) => setNested("stats", { productsUnit })} placeholder="รายการ" />
              <div className="hidden md:block" />

              <Field label="ตัวเลข — คลัง" value={config.stats.stock} onChange={(stock) => setNested("stats", { stock })} />
              <Field label="ป้ายกำกับ" value={config.stats.stockLabel} onChange={(stockLabel) => setNested("stats", { stockLabel })} />
              <Field label="หน่วยนับ" value={config.stats.stockUnit} onChange={(stockUnit) => setNested("stats", { stockUnit })} placeholder="ชิ้น" />
              <div className="hidden md:block" />

              <Field label="ตัวเลข — ขายแล้ว" value={config.stats.sold} onChange={(sold) => setNested("stats", { sold })} />
              <Field label="ป้ายกำกับ" value={config.stats.soldLabel} onChange={(soldLabel) => setNested("stats", { soldLabel })} />
              <Field label="หน่วยนับ" value={config.stats.soldUnit} onChange={(soldUnit) => setNested("stats", { soldUnit })} placeholder="ชิ้น" />
              <div className="hidden md:block" />
            </div>
          </Section>
          ) : null}

          {activeSection === "products" ? (
          <Section id="products" eyebrow="CATALOG" title={`สินค้าในร้าน (${productCountLabel})`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-3">
              <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5"><Database size={15} />{databaseMode ? "SQLite Backend" : "Local Fallback Mode"}</span>
              <div className="flex gap-2">
                <button className="syncx-btn-secondary py-1 px-3.5 text-xs rounded-lg flex items-center gap-1 bg-transparent cursor-pointer" onClick={() => void refreshProducts()}><RefreshCw size={13} />โหลดใหม่</button>
                <button className="syncx-btn-primary py-1 px-3.5 text-xs rounded-lg" onClick={() => void handleAddProduct()}><PackagePlus size={13} />เพิ่มสินค้า</button>
              </div>
            </div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400"><RefreshCw size={24} className="animate-spin text-[var(--syncx-accent)]" /><p className="text-xs font-bold uppercase tracking-wider">กำลังโหลดสินค้า...</p></div>
            ) : products.length || categories.length ? (
              <div className="flex flex-col gap-8">
                {Object.entries(groupedProducts).map(([categoryName, catProducts]) => (
                  <div key={categoryName} className="flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-1 h-3 bg-[var(--syncx-accent)] rounded-full shadow-[0_0_8px_var(--syncx-accent)]" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">{categoryName}</h3>
                        <span className="text-[10px] text-gray-500 font-semibold">({catProducts.length} ชิ้น)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleAddProduct(categoryName)}
                        className="syncx-btn-secondary py-1 px-2.5 text-[10px] rounded-lg flex items-center gap-1 bg-transparent border border-[var(--syncx-accent)]/20 hover:bg-[var(--syncx-accent)]/10 text-[var(--syncx-accent)] cursor-pointer"
                      >
                        <Plus size={11} />
                        เพิ่มสินค้า
                      </button>
                    </div>
                    {catProducts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-white/5 rounded-xl bg-black/10">
                        <p className="text-[11px] text-gray-500 italic">ยังไม่มีสินค้าในหมวดหมู่นี้</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {catProducts.map((p) => (
                          <div key={p.id} className="syncx-glass p-3.5 rounded-xl flex items-center justify-between gap-4 hover:border-gray-500/50 transition-all duration-300 relative overflow-hidden group">
                            <SpotlightGlow size={160} />
                            <div className="flex items-center gap-3 min-w-0 z-10">
                              <div className="w-10 h-10 rounded-lg bg-black/40 border border-[var(--syncx-border)] flex items-center justify-center overflow-hidden flex-shrink-0">
                                {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <ShoppingBag size={16} className="text-gray-600" />}
                              </div>
                              <div className="min-w-0">
                                <strong className="block text-xs font-bold text-white truncate max-w-[130px] sm:max-w-[160px]">{p.name}</strong>
                                <span className="block text-[10px] text-gray-400 mt-0.5 font-medium">
                                  {p.price} • คลัง {p.tiers?.reduce((sum, t) => sum + Math.max(0, t.stock || 0), 0) ?? 0}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditingProduct(p)}
                              className="syncx-btn-secondary py-1.5 px-3 text-[10px] rounded-lg cursor-pointer bg-transparent border border-white/10 hover:border-white/20 whitespace-nowrap z-10 self-center"
                            >
                              แก้ไขสินค้า
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <ShoppingBag size={28} className="text-gray-600" />
                <p className="text-xs text-gray-400 font-semibold">ยังไม่มีสินค้าในระบบ กรุณาเพิ่มรายการแรก</p>
              </div>
            )}
          </Section>
          ) : null}

          {activeSection === "categories" ? (
          <Section id="categories" eyebrow="CATEGORIES" title={`หมวดหมู่สินค้า (${categories.length} หมวด)`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-3">
              <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5"><LayoutGrid size={15} />{databaseMode ? "SQLite Backend" : "Local Fallback Mode"}</span>
              <div className="flex gap-2">
                <button className="syncx-btn-secondary py-1 px-3.5 text-xs rounded-lg flex items-center gap-1 bg-transparent cursor-pointer" onClick={() => void refreshCategories()}><RefreshCw size={13} />โหลดใหม่</button>
                <button className="syncx-btn-primary py-1 px-3.5 text-xs rounded-lg" onClick={() => void addCategory()}><Plus size={13} />เพิ่มหมวดหมู่</button>
              </div>
            </div>
            {categories.length ? (
              <div className="flex flex-col gap-4">
                {categories.map((cat) => (
                  <CategoryEditor key={cat.id} category={cat} onChange={(patch) => void updateCategory(cat.id, patch)} onDelete={() => void deleteCategory(cat.id)} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <FolderOpen size={28} className="text-gray-600" />
                <p className="text-xs text-gray-400 font-semibold">ยังไม่มีหมวดหมู่สินค้า กรุณาเพิ่มรายการแรก</p>
              </div>
            )}
          </Section>
          ) : null}

          {activeSection === "coupons" ? (
          <Section id="coupons" eyebrow="COUPONS" title={`คูปองส่วนลด (${coupons.length} โค้ด)`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-3">
              <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5"><Ticket size={15} />{databaseMode ? "SQLite Backend" : "Local Fallback Mode"}</span>
              <div className="flex gap-2">
                <button className="syncx-btn-secondary py-1 px-3.5 text-xs rounded-lg flex items-center gap-1 bg-transparent cursor-pointer" onClick={() => void refreshCoupons()}><RefreshCw size={13} />โหลดใหม่</button>
                <button className="syncx-btn-primary py-1 px-3.5 text-xs rounded-lg" onClick={() => void addCoupon()}><Plus size={13} />เพิ่มคูปอง</button>
              </div>
            </div>
            {coupons.length ? (
              <div className="flex flex-col gap-4">
                {coupons.map((coupon) => (
                  <CouponEditor key={coupon.id} coupon={coupon} onChange={(patch) => void updateCoupon(coupon.id, patch)} onDelete={() => void deleteCoupon(coupon.id)} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <Ticket size={28} className="text-gray-600" />
                <p className="text-xs text-gray-400 font-semibold">ยังไม่มีคูปองส่วนลดในระบบ</p>
              </div>
            )}
          </Section>
          ) : null}

          {activeSection === "users" ? (
          <Section id="users" eyebrow="USERS" title={`ผู้ใช้งานทั้งหมด (${adminUsers.length} คน)`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-3">
              <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5"><Users size={15} />จัดการลูกค้าและเครดิตระบบ</span>
              <button className="syncx-btn-secondary py-1 px-3.5 text-xs rounded-lg flex items-center gap-1 bg-transparent cursor-pointer" onClick={() => void refreshUsers()}><RefreshCw size={13} />โหลดใหม่</button>
            </div>
            {usersLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400"><RefreshCw size={24} className="animate-spin text-[var(--syncx-accent)]" /><p className="text-xs font-bold uppercase tracking-wider">กำลังโหลดข้อมูลผู้ใช้...</p></div>
            ) : adminUsers.length ? (
              <div className="w-full overflow-x-auto rounded-xl border border-[var(--syncx-border)] bg-black/20">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--syncx-border)] bg-black/40 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="p-3 w-12"></th>
                      <th className="p-3">ชื่อ</th>
                      <th className="p-3">อีเมล</th>
                      <th className="p-3">ยอดเงิน</th>
                      <th className="p-3 text-center">ออเดอร์</th>
                      <th className="p-3 text-right">ใช้จ่าย</th>
                      <th className="p-3 text-right">สมัครเมื่อ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((u) => (
                      <UserRow key={u.id} user={u} onUpdate={updateUser} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <Users size={28} className="text-gray-600" />
                <p className="text-xs text-gray-400 font-semibold">ยังไม่มีผู้ใช้ในระบบ</p>
              </div>
            )}
          </Section>
          ) : null}

          {activeSection === "orders" ? (
          <Section id="orders" eyebrow="ORDERS" title={`ประวัติคำสั่งซื้อทั้งหมด (${adminOrders.length} รายการ)`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-3">
              <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5"><History size={15} />ประวัติการสั่งซื้อLicense Keyของลูกค้า</span>
              <button className="syncx-btn-secondary py-1 px-3.5 text-xs rounded-lg flex items-center gap-1 bg-transparent cursor-pointer" onClick={() => void refreshOrders()}><RefreshCw size={13} />โหลดใหม่</button>
            </div>
            {ordersLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400"><RefreshCw size={24} className="animate-spin text-[var(--syncx-accent)]" /><p className="text-xs font-bold uppercase tracking-wider">กำลังโหลดข้อมูลออเดอร์...</p></div>
            ) : adminOrders.length ? (
              <div className="w-full overflow-x-auto rounded-xl border border-[var(--syncx-border)] bg-black/20">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--syncx-border)] bg-black/40 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="p-3">เลขออเดอร์</th>
                      <th className="p-3">ลูกค้า</th>
                      <th className="p-3">อีเมล</th>
                      <th className="p-3">สินค้า</th>
                      <th className="p-3">ตัวเลือก</th>
                      <th className="p-3 text-center">จำนวน</th>
                      <th className="p-3 text-right">ราคารวม</th>
                      <th className="p-3">คีย์ดิจิทัล (License Key)</th>
                      <th className="p-3 text-right">วันที่ซื้อ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminOrders.map((o) => (
                      <tr key={o.id} className="border-b border-[var(--syncx-border)] hover:bg-white/[0.01] transition-colors">
                        <td className="p-3 align-middle font-mono text-[11px] text-gray-500 select-all">{o.id.split('-').slice(1).join('-')}</td>
                        <td className="p-3 align-middle text-xs font-medium text-white">{o.user_name || "—"}</td>
                        <td className="p-3 align-middle text-xs text-gray-400">{o.user_email || "—"}</td>
                        <td className="p-3 align-middle text-xs font-semibold text-white">{o.product_name}</td>
                        <td className="p-3 align-middle text-xs text-gray-400">{o.tier_label}</td>
                        <td className="p-3 align-middle text-xs font-mono text-center text-gray-300">{o.quantity}</td>
                        <td className="p-3 align-middle text-xs font-bold text-right text-white">฿{o.total.toLocaleString("th-TH")}</td>
                        <td className="p-3 align-middle">
                          <code className="px-2 py-1 bg-red-950/40 text-[#e60039] border border-red-900/30 rounded font-mono text-[11px] select-all">
                            {o.code_key}
                          </code>
                        </td>
                        <td className="p-3 align-middle text-xs text-gray-500 text-right">{new Date(o.created_at).toLocaleString("th-TH")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <ShoppingBag size={28} className="text-gray-600" />
                <p className="text-xs text-gray-400 font-semibold">ยังไม่มีรายการสั่งซื้อใดๆ ในระบบ</p>
              </div>
            )}
          </Section>
          ) : null}

          {activeSection === "store-config" ? (
          <Section id="store-config" eyebrow="STORE" title="ข้อความหน้าร้านค้า">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="หัวข้อหมวดสินค้า" value={config.store.sectionTitle} onChange={(sectionTitle) => setNested("store", { sectionTitle })} />
              <Field label="ข้อความเมื่อไม่มีสินค้า" value={config.store.emptyStateText} onChange={(emptyStateText) => setNested("store", { emptyStateText })} />
              <Field label="ข้อความปุ่มสินค้า" value={config.store.productButtonText} onChange={(productButtonText) => setNested("store", { productButtonText })} placeholder="เช่น ดูรายละเอียด" />
            </div>
          </Section>
          ) : null}

          {activeSection === "footer" ? (
          <Section id="footer" eyebrow="FOOTER" title="ข้อมูลติดต่อและฟุตเตอร์">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <TextAreaField label="ข้อความแบรนด์ท้ายเว็บ" value={config.footer.brandText} onChange={(brandText) => setNested("footer", { brandText })} />
              <Field label="อีเมลติดต่อ" value={config.footer.contactEmail} onChange={(contactEmail) => setNested("footer", { contactEmail })} />
              <Field label="Discord URL" value={config.footer.discordUrl} onChange={(discordUrl) => setNested("footer", { discordUrl })} />
              <Field label="LINE URL" value={config.footer.lineUrl} onChange={(lineUrl) => setNested("footer", { lineUrl })} placeholder="https://line.me/..." />
              <Field label="Facebook URL" value={config.footer.facebookUrl} onChange={(facebookUrl) => setNested("footer", { facebookUrl })} placeholder="https://facebook.com/..." />
              <Field label="Instagram URL" value={config.footer.instagramUrl} onChange={(instagramUrl) => setNested("footer", { instagramUrl })} placeholder="https://instagram.com/..." />
            </div>
          </Section>
          ) : null}

          {activeSection === "backup" ? (
          <Section id="backup" eyebrow="BACKUP" title="จัดการข้อมูล (Backup)">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-3">
                <button className="syncx-btn-secondary py-1.5 px-4 text-xs rounded-lg cursor-pointer bg-transparent" onClick={handleExport}><Download size={14} />{copied ? "คัดลอกแล้ว" : "ส่งออก JSON"}</button>
                <button className="syncx-btn-secondary py-1.5 px-4 text-xs rounded-lg cursor-pointer bg-transparent" onClick={handleImport}><Upload size={14} />นำเข้า JSON</button>
                <button className="syncx-btn-danger py-1.5 px-4 text-xs rounded-lg cursor-pointer" onClick={() => { resetConfig(); toast("รีเซ็ตเป็นค่าเริ่มต้นแล้ว"); }}><RotateCcw size={14} />รีเซ็ตค่าเริ่มต้น</button>
              </div>
              <textarea className="syncx-input font-mono text-xs resize-none" value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="วางหรือคัดลอก JSON การตั้งค่าที่นี่" rows={9} />
            </div>
          </Section>
          ) : null}
        </div>
      </SidebarInset>

      <ExpandableSpeedDial
        direction="up"
        size="md"
        className="fixed bottom-6 right-6 z-50"
        actions={[
          {
            icon: <PackagePlus size={18} />,
            label: "เพิ่มสินค้า",
            onClick: () => void handleAddProduct()
          },
          {
            icon: <Plus size={18} />,
            label: "เพิ่มหมวดหมู่",
            onClick: () => void addCategory()
          },
          {
            icon: <Ticket size={18} />,
            label: "เพิ่มคูปอง",
            onClick: () => void addCoupon()
          },
          {
            icon: <Download size={18} />,
            label: "ส่งออก JSON",
            onClick: handleExport
          },
          {
            icon: <RefreshCw size={18} />,
            label: "โหลดใหม่",
            onClick: () => void refreshProducts()
          }
        ]}
      />

      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="max-w-3xl sm:max-w-3xl bg-black/80 backdrop-blur-xl border-[var(--syncx-border)] text-white p-6 md:p-8 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader className="border-b border-[var(--syncx-border)] pb-4 mb-4">
            <DialogTitle className="text-base font-bold tracking-wide text-white uppercase flex items-center gap-2">
              <ShoppingBag className="text-[var(--syncx-accent)]" size={18} />
              แก้ไขสินค้า: {editingProduct?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              แก้ไขข้อมูล รายละเอียด ตัวเลือกราคา และสต็อกสินค้า
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <ProductEditor
              product={editingProduct}
              onChange={(patch) => {
                setEditingProduct((prev) => prev ? { ...prev, ...patch } : null);
                void updateProduct(editingProduct.id, patch);
              }}
              onDelete={() => {
                setProductToDelete(editingProduct);
              }}
              categories={categories}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent className="bg-[#0c0c0e]/95 border-[var(--syncx-border)] text-white max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">ยืนยันการลบสินค้า</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 text-xs">
              คุณต้องการลบสินค้า "{productToDelete?.name}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="bg-transparent border border-white/10 hover:bg-white/5 text-white py-1.5 px-4 rounded-lg text-xs cursor-pointer">
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (productToDelete) {
                  void deleteProduct(productToDelete.id);
                  setProductToDelete(null);
                  setEditingProduct(null);
                }
              }}
              className="syncx-btn-primary bg-[#e60039] text-white hover:bg-[#ff3d6e] py-1.5 px-4 rounded-lg text-xs cursor-pointer"
            >
              ยืนยันการลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </SidebarProvider>
    </TooltipProvider>
  );
}
