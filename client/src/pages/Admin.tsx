import { useEffect, useRef, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Lock, Moon, Plus, RefreshCw, Search, Sun } from "lucide-react";
import { toast } from "sonner";
import { LogoIcon } from "@/components/LogoIcon";
import { Button } from "@/components/ui/button";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { cn } from "@/lib/utils";
import { AdminDataProvider, useAdminData } from "./admin/AdminData";
import { BackupSection } from "./admin/BackupSection";
import { CategoriesSection, CouponsSection } from "./admin/CatalogSections";
import { ConfigSection } from "./admin/ConfigSections";
import { OverviewSection, type RefreshHandle } from "./admin/OverviewSection";
import { ProductsSection, type ProductsHandle } from "./admin/ProductsSection";
import { OrdersSection, UsersSection } from "./admin/SalesSections";
import { isConfigSection, sectionGroups, sectionItems, type SectionKey } from "./admin/sections";
import { SaveStatus } from "./admin/ui";
import { VouchersSection } from "./admin/VouchersSection";

const ACCESS_KEY = "syncx-admin-access";
const CODE_KEY = "syncx-admin-access-code";
const SECTION_KEY = "syncx-admin-section";
const THEME_KEY = "syncx-admin-theme";

type VerifyResult = "ok" | "invalid" | "offline";

/** The server holds the only copy of the access code; the bundle never contains it. */
async function verifyAdminCode(code: string): Promise<VerifyResult> {
  try {
    const res = await fetch("/api/admin/verify", { method: "POST", credentials: "include", headers: { "X-Admin-Access-Code": code } });
    if (res.ok) return "ok";
    return res.status === 403 ? "invalid" : "offline";
  } catch {
    return "offline";
  }
}

function useAdminTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) === "dark");
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("admin-theme");
    root.classList.toggle("admin-dark", dark);
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    return () => root.classList.remove("admin-theme", "admin-dark");
  }, [dark]);
  return { dark, toggle: () => setDark((d) => !d) };
}

function Gate({ onUnlock }: { onUnlock: (code: string) => void }) {
  const { config } = useSiteConfig();
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setVerifying(true);
    const result = await verifyAdminCode(trimmed);
    setVerifying(false);
    if (result === "ok") onUnlock(trimmed);
    else toast.error(result === "invalid" ? "รหัสแอดมินไม่ถูกต้อง" : "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่");
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(80%_60%_at_50%_0%,var(--card),var(--background))] px-5">
      <section className="w-full max-w-[400px] text-center" aria-label="Admin access required">
        <span className="mx-auto grid size-16 place-items-center rounded-[18px] bg-foreground text-background shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
          {config.logoImageUrl ? <img src={config.logoImageUrl} alt="" className="size-full rounded-[18px] object-cover" /> : <LogoIcon size={28} />}
        </span>
        <h1 className="mt-6 text-[28px] font-semibold tracking-tight">แดชบอร์ด {config.siteName}</h1>
        <p className="mt-1.5 text-[15px] text-muted-foreground">ใส่รหัสแอดมินเพื่อจัดการร้านค้า</p>
        <form onSubmit={submit} className="mt-8 flex flex-col gap-3">
          <input
            type="password"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="รหัสแอดมิน"
            aria-label="รหัสแอดมิน"
            autoComplete="current-password"
            className="h-12 rounded-xl border border-input bg-card px-4 text-[15px] outline-none transition-shadow focus:shadow-[0_0_0_4px_var(--ring)]"
          />
          <Button type="submit" disabled={verifying} className="h-12 rounded-full text-[15px]">
            {verifying ? "กำลังตรวจสอบ..." : "เข้าสู่แดชบอร์ด"}
          </Button>
        </form>
        <a href="/" className="mt-6 inline-flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground">
          กลับหน้าร้าน
          <ChevronRight className="size-3.5" />
        </a>
      </section>
    </main>
  );
}

function Shell({ onLock, dark, onToggleTheme }: { onLock: () => void; dark: boolean; onToggleTheme: () => void }) {
  const { config } = useSiteConfig();
  const { inventory, categories, coupons } = useAdminData();
  const [active, setActive] = useState<SectionKey>(() => {
    const saved = sessionStorage.getItem(SECTION_KEY);
    return sectionItems.find((item) => item.key === saved)?.key ?? "overview";
  });
  const [filter, setFilter] = useState("");
  const [mobileDetail, setMobileDetail] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<RefreshHandle>(null);
  const productsRef = useRef<ProductsHandle>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setMobileDetail(false);
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const select = (key: SectionKey) => {
    setActive(key);
    setMobileDetail(true);
    sessionStorage.setItem(SECTION_KEY, key);
  };

  const item = sectionItems.find((i) => i.key === active) ?? sectionItems[0];
  const q = filter.trim().toLowerCase();
  const groups = q
    ? sectionGroups
        .map((g) => ({ ...g, items: g.items.filter((i) => `${i.label} ${i.description}`.toLowerCase().includes(q)) }))
        .filter((g) => g.items.length)
    : sectionGroups;

  const refreshable: SectionKey[] = ["overview", "products", "categories", "coupons", "vouchers", "users", "orders"];
  const refresh = async () => {
    if (active === "products") await inventory.refreshProducts();
    else if (active === "categories") await categories.refresh();
    else if (active === "coupons") await coupons.refresh();
    else await Promise.all([sectionRef.current?.refresh(), active === "overview" ? inventory.refreshProducts() : undefined]);
    toast("โหลดข้อมูลล่าสุดแล้ว");
  };

  const addAction =
    active === "products"
      ? { label: "เพิ่มสินค้า", run: () => productsRef.current?.add() }
      : active === "categories"
        ? { label: "เพิ่มหมวดหมู่", run: () => categories.addCategory() }
        : active === "coupons"
          ? { label: "เพิ่มคูปอง", run: () => coupons.addCoupon() }
          : null;

  const subtitle =
    active === "products"
      ? `${inventory.products.length} รายการ`
      : active === "categories"
        ? `${categories.categories.length} หมวด`
        : active === "coupons"
          ? `${coupons.coupons.length} โค้ด`
          : item.description;

  return (
    <div className="flex h-dvh bg-background text-[13px] text-foreground">
      <aside
        className={cn(
          "flex w-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar backdrop-blur-2xl md:w-[264px]",
          mobileDetail && "max-md:hidden",
        )}
      >
        <div className="flex items-center gap-2.5 px-4 pt-5 pb-3">
          <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-[9px] bg-foreground text-background">
            {config.logoImageUrl ? <img src={config.logoImageUrl} alt="" className="size-full object-cover" /> : <LogoIcon size={15} />}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold">{config.siteName}</p>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className={cn("size-1.5 rounded-full", inventory.databaseMode ? "bg-foreground" : "bg-destructive")} />
              {inventory.loading ? "กำลังโหลด..." : inventory.databaseMode ? "SQLite ออนไลน์" : "SQLite ออฟไลน์"}
            </p>
          </div>
        </div>

        <label className="mx-3 mb-1 flex h-8 items-center gap-1.5 rounded-lg bg-foreground/[0.06] px-2.5 text-muted-foreground">
          <Search className="size-3.5" />
          <input
            ref={searchRef}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="ค้นหา"
            aria-label="ค้นหาหัวข้อ"
            className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded border border-border px-1 text-[10px] md:inline">⌘K</kbd>
        </label>

        <nav className="flex-1 overflow-y-auto px-2 pb-4" aria-label="หัวข้อแดชบอร์ด">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="px-2.5 pt-4 pb-1 text-[11px] font-semibold text-muted-foreground">{group.title}</p>
              <ul className="max-md:divide-y max-md:divide-border max-md:overflow-hidden max-md:rounded-xl max-md:bg-card">
                {group.items.map((entry) => {
                  const selected = entry.key === active;
                  const Icon = entry.icon;
                  return (
                    <li key={entry.key}>
                      <button
                        type="button"
                        onClick={() => select(entry.key)}
                        aria-current={selected ? "page" : undefined}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors max-md:rounded-none max-md:py-2.5",
                          selected ? "md:bg-foreground md:text-background" : "hover:bg-sidebar-accent",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-6 shrink-0 place-items-center rounded-[7px]",
                            selected ? "bg-background/15 md:text-background" : "bg-foreground/[0.08] text-foreground",
                          )}
                        >
                          <Icon className="size-3.5" strokeWidth={2} />
                        </span>
                        <span className="flex-1 truncate">{entry.label}</span>
                        <ChevronRight className="size-4 text-muted-foreground/60 md:hidden" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 border-t border-sidebar-border p-3">
          <Button asChild variant="secondary" size="sm" className="flex-1 rounded-full">
            <a href="/" target="_blank" rel="noopener">
              หน้าร้าน
              <ExternalLink />
            </a>
          </Button>
          <Button variant="secondary" size="icon" className="size-8 rounded-full" aria-label={dark ? "โหมดสว่าง" : "โหมดมืด"} onClick={onToggleTheme}>
            {dark ? <Sun /> : <Moon />}
          </Button>
          <Button variant="secondary" size="icon" className="size-8 rounded-full" aria-label="ล็อกแดชบอร์ด" onClick={onLock}>
            <Lock />
          </Button>
        </div>
      </aside>

      <main className={cn("flex min-w-0 flex-1 flex-col", !mobileDetail && "max-md:hidden")}>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <button type="button" className="-ml-1 flex items-center font-medium md:hidden" onClick={() => setMobileDetail(false)}>
            <ChevronLeft className="size-5" />
            เมนู
          </button>
          <div className="min-w-0 flex-1 max-md:text-center">
            <h1 className="truncate text-[15px] font-semibold">{item.label}</h1>
            <p className="truncate text-[11px] text-muted-foreground max-md:hidden">{subtitle}</p>
          </div>
          {isConfigSection(active) && <SaveStatus />}
          {refreshable.includes(active) && (
            <Button variant="ghost" size="icon" className="size-8 rounded-full" aria-label="โหลดใหม่" onClick={() => void refresh()}>
              <RefreshCw />
            </Button>
          )}
          {addAction && (
            <Button size="sm" className="rounded-full px-3.5" onClick={() => void addAction.run()}>
              <Plus />
              {addAction.label}
            </Button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto">
          <div key={active} className="admin-rise mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
            {active === "overview" && <OverviewSection ref={sectionRef} onNavigate={select} />}
            {isConfigSection(active) && <ConfigSection section={active} />}
            {active === "products" && <ProductsSection ref={productsRef} />}
            {active === "categories" && <CategoriesSection />}
            {active === "coupons" && <CouponsSection />}
            {active === "vouchers" && <VouchersSection ref={sectionRef} />}
            {active === "users" && <UsersSection ref={sectionRef} />}
            {active === "orders" && <OrdersSection ref={sectionRef} />}
            {active === "backup" && <BackupSection />}
            {!inventory.databaseMode && ["products", "categories", "coupons"].includes(active) && (
              <p className="text-center text-[11px] text-muted-foreground">โหมดสำรอง — ข้อมูลถูกเก็บในเบราว์เซอร์นี้เท่านั้น</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Admin() {
  const theme = useAdminTheme();
  const [authorized, setAuthorized] = useState(() => sessionStorage.getItem(ACCESS_KEY) === "granted");

  useEffect(() => {
    if (!authorized) return;
    // The code may have been rotated on the server since this tab was unlocked.
    void verifyAdminCode(sessionStorage.getItem(CODE_KEY) ?? "").then((result) => {
      if (result !== "invalid") return;
      sessionStorage.removeItem(ACCESS_KEY);
      sessionStorage.removeItem(CODE_KEY);
      setAuthorized(false);
      toast.error("รหัสแอดมินถูกเปลี่ยน กรุณาเข้าสู่ระบบอีกครั้ง");
    });
  }, [authorized]);

  const unlock = (code: string) => {
    sessionStorage.setItem(ACCESS_KEY, "granted");
    sessionStorage.setItem(CODE_KEY, code);
    setAuthorized(true);
    toast.success("เข้าสู่แดชบอร์ดแล้ว");
  };

  const lock = () => {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(CODE_KEY);
    setAuthorized(false);
    toast("ล็อกแดชบอร์ดแล้ว");
  };

  if (!authorized) return <Gate onUnlock={unlock} />;

  return (
    <AdminDataProvider>
      <Shell onLock={lock} dark={theme.dark} onToggleTheme={theme.toggle} />
    </AdminDataProvider>
  );
}
