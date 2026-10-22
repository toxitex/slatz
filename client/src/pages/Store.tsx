import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, Menu, ShoppingCart, Store as StoreIcon, User, Wallet, Clock, LogOut, LogIn, UserPlus, Settings, Search } from "lucide-react";
import { toast } from "sonner";
import { useSiteConfig, type SyncXProduct } from "@/contexts/SiteConfigContext";
import { useInventoryProducts } from "@/hooks/useInventoryProducts";
import { useCategories } from "@/hooks/useCategories";
import { useScrolled } from "@/hooks/useScrolled";
import { useAuth } from "@/hooks/useAuth";
import { UserMenu } from "@/components/UserMenu";
import { SpotlightGlow, BorderBeam, ShinyText, GlowingCards, ExpandableSpeedDial, RevealFx } from "@/components/fx";
import { LogoIcon } from "@/components/LogoIcon";
import { SearchModal } from "@/components/SearchModal";
import { RippleButton, RippleButtonRipples } from "@/components/animate-ui/components/buttons/ripple";
import { RippleButton as RippleButtonRaw } from "@/components/animate-ui/primitives/buttons/ripple";

/**
 * Design philosophy reminder: Cyber-Noir Thai Commerce.
 * Rebuilt using standard Tailwind CSS v4 styling wrappers, dynamic design tokens.
 */
const navItems = [
  { href: "/", label: "หน้าหลัก", icon: Home },
  { href: "/store", label: "ร้านค้า", icon: StoreIcon },
];

function Logo() {
  const { config } = useSiteConfig();
  return (
    <Link href="/" className="syncx-logo" aria-label={`${config.logoText} home`}>
      <span className="syncx-logo-mark">
        {config.logoImageUrl ? <img src={config.logoImageUrl} alt="" /> : <LogoIcon size={16} />}
      </span>
      <span>{config.logoText}</span>
    </Link>
  );
}

export function TopNav() {
  const { config } = useSiteConfig();
  const scrolled = useScrolled();
  const { user, signOut } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const contact = () => toast(`ติดต่อเราได้ที่ ${config.footer.contactEmail}`);

  return (
    <>
      <header className={`top-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-shell">
          <Logo />
          <nav className="nav-links" aria-label="Primary navigation">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="nav-link">{item.label}</Link>
            ))}
            {user && (
              <>
                <Link href="/topup" className="nav-link">เติมเงิน</Link>
                <Link href="/history" className="nav-link">ประวัติ</Link>
              </>
            )}
            <button className="nav-link cursor-pointer bg-transparent border-none outline-none" onClick={contact}>ติดต่อเรา</button>
          </nav>
          <div className="nav-actions">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none outline-none flex items-center justify-center mr-1"
              title="ค้นหา"
              aria-label="Open Search"
            >
              <Search size={18} />
            </button>
            {user ? (
              <UserMenu user={user} onSignOut={signOut} />
            ) : (
              <>
                <Link href="/login" className="auth-outline no-underline">
                  เข้าสู่ระบบ
                </Link>
                <Link href="/register" className="auth-primary no-underline">
                  สมัครสมาชิก
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

export function MobileNav() {
  const { user, signOut } = useAuth();
  const [location, navigate] = useLocation();
  const isAdminGranted = typeof window !== "undefined" && window.sessionStorage.getItem("syncx-admin-access") === "granted";

  const actions = user ? [
    {
      icon: <User size={18} />,
      label: "โปรไฟล์",
      onClick: () => navigate("/profile")
    },
    {
      icon: <Wallet size={18} />,
      label: "เติมเงิน",
      onClick: () => navigate("/topup")
    },
    {
      icon: <Clock size={18} />,
      label: "ประวัติการซื้อ",
      onClick: () => navigate("/history")
    },
    ...(isAdminGranted ? [{
      icon: <Settings size={18} />,
      label: "แอดมินแดชบอร์ด",
      onClick: () => navigate("/admin")
    }] : []),
    {
      icon: <LogOut size={18} className="text-[#e60039]" />,
      label: "ออกจากระบบ",
      onClick: () => {
        signOut();
        toast.success("ออกจากระบบแล้ว");
      }
    }
  ] : [
    {
      icon: <LogIn size={18} />,
      label: "เข้าสู่ระบบ",
      onClick: () => navigate("/login")
    },
    {
      icon: <UserPlus size={18} />,
      label: "สมัครสมาชิก",
      onClick: () => navigate("/register")
    },
    ...(isAdminGranted ? [{
      icon: <Settings size={18} />,
      label: "แอดมินแดชบอร์ด",
      onClick: () => navigate("/admin")
    }] : [])
  ];

  const isHomeActive = location === "/";
  const isStoreActive = location.startsWith("/store") || location.startsWith("/category") || location.startsWith("/product");

  return (
    <>
      <nav className="fixed bottom-0 left-0 w-full md:hidden bg-black/80 backdrop-blur-xl border-t border-[var(--syncx-border)] h-16 grid grid-cols-2 z-40 items-center justify-center text-center shadow-lg shadow-black/80" aria-label="Mobile navigation">
        <Link href="/" className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-all duration-200 outline-none ${isHomeActive ? "text-[var(--syncx-accent)] drop-shadow-[0_0_8px_var(--syncx-accent)] scale-105" : "text-gray-400 hover:text-gray-200"}`}>
          <Home size={19} />
          <span>หน้าหลัก</span>
        </Link>
        <Link href="/store" className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-all duration-200 outline-none ${isStoreActive ? "text-[var(--syncx-accent)] drop-shadow-[0_0_8px_var(--syncx-accent)] scale-105" : "text-gray-400 hover:text-gray-200"}`}>
          <StoreIcon size={19} />
          <span>ร้านค้า</span>
        </Link>
      </nav>
      
      <ExpandableSpeedDial
        actions={actions}
        direction="up"
        size="md"
        className="fixed right-4 bottom-[76px] z-[10003] md:hidden"
      />
    </>
  );
}

export function Footer() {
  const { config } = useSiteConfig();
  return (
    <footer className="w-full mt-auto border-t border-[var(--syncx-border)] bg-black/40 backdrop-blur-sm py-12 px-4 md:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-6 flex flex-col gap-3">
          <Logo />
          <p className="text-xs text-gray-400 leading-relaxed max-w-sm mt-2">{config.footer.brandText}</p>
          <a href={`mailto:${config.footer.contactEmail}`} className="text-xs text-[var(--syncx-accent)] hover:underline mt-1">ติดต่อเรา</a>
        </div>
        <div className="md:col-span-6 flex flex-col md:items-end gap-3 text-sm">
          <h3 className="font-bold text-white tracking-wide">เมนู</h3>
          <div className="flex flex-wrap gap-4 text-xs text-gray-400 md:justify-end">
            <Link href="/" className="hover:text-white transition-colors duration-200">หน้าหลัก</Link>
            <Link href="/store" className="hover:text-white transition-colors duration-200">ร้านค้า</Link>

            {config.footer.discordUrl && <a href={config.footer.discordUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors duration-200">Discord</a>}
            {config.footer.lineUrl && <a href={config.footer.lineUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors duration-200">LINE</a>}
            {config.footer.facebookUrl && <a href={config.footer.facebookUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors duration-200">Facebook</a>}
            {config.footer.instagramUrl && <a href={config.footer.instagramUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors duration-200">Instagram</a>}
          </div>
        </div>
        <div className="col-span-12 border-t border-[var(--syncx-border)] pt-6 flex flex-col sm:flex-row sm:justify-between text-[11px] text-gray-500 gap-2">
          <div>Copyright © 2026 {config.siteName} | All rights reserved</div>
          <div className="hidden sm:block">Designed with premium experiences</div>
        </div>
      </div>
    </footer>
  );
}

export function formatBaht(amount: number): string {
  return `฿${amount.toLocaleString("th-TH")}`;
}

export function ProductCard({ product, buttonText }: { product: SyncXProduct; buttonText: string }) {
  const [imgErr, setImgErr] = useState(false);
  const tiers = product.tiers ?? [];
  let priceLabel = product.price;
  if (tiers.length) {
    const prices = tiers.map((tier) => tier.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    priceLabel = min === max ? formatBaht(min) : `${formatBaht(min)} - ${formatBaht(max)}`;
  }
  return (
    <article className="product-card">
      <Link href={`/product/${product.id}`} className="block w-full h-full no-underline" aria-label={product.name}>
        <div className="product-image-frame">
          {product.imageUrl && !imgErr ? (
            <img src={product.imageUrl} alt={product.name} onError={() => setImgErr(true)} />
          ) : (
            <ShoppingCart size={30} className="text-gray-600" />
          )}
          <div className="product-hover-cta">
            <span>{buttonText}</span>
          </div>
          <div className="product-info-name">{product.name}</div>
          <div className="product-info-price">{priceLabel}</div>
        </div>
      </Link>
    </article>
  );
}

export default function Store() {
  const { config } = useSiteConfig();
  const { products } = useInventoryProducts();
  const { categories: dbCategories, loading: categoriesLoading } = useCategories();

  const categories = useMemo(() => {
    if (dbCategories.length > 0) {
      return dbCategories
        .filter((cat) => cat.isActive)
        .map((cat) => {
          const catProducts = products.filter((p) => p.category === cat.name);
          const firstProductWithImage = catProducts.find((p) => p.imageUrl);
          return {
            name: cat.name,
            imageUrl: cat.imageUrl || firstProductWithImage?.imageUrl || "",
            count: catProducts.length,
          };
        });
    }
    const map = new Map<string, { count: number; imageUrl: string }>();
    products.forEach((p) => {
      if (!p.category) return;
      const cur = map.get(p.category);
      map.set(p.category, { count: (cur?.count ?? 0) + 1, imageUrl: cur?.imageUrl || p.imageUrl || "" });
    });
    return Array.from(map.entries()).map(([name, { count, imageUrl }]) => ({ name, count, imageUrl }));
  }, [dbCategories, products]);

  return (
    <>
      <TopNav />
      <main className="syncx-page">
        <section className="max-w-7xl mx-auto px-4 md:px-6 pt-28 pb-12 w-full flex-grow">
          <RevealFx className="mb-8">
            <nav className="flex items-center gap-2 mb-4 text-xs font-medium text-[var(--syncx-muted)]" aria-label="Store breadcrumb">
              <Link href="/store" className="hover:text-white transition-colors duration-200 no-underline">ร้านค้า</Link>
              <span>/</span>
              <span className="text-white">หมวดหมู่</span>
            </nav>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-[-0.035em] text-white">{config.store.sectionTitle}</h1>
          </RevealFx>

          {!categoriesLoading && categories.length > 0 && (
            <RevealFx delay={0.15} className="category-banner">
              {categories.map(({ name, count, imageUrl }) => (
                <Link
                  key={name}
                  href={`/category/${encodeURIComponent(name)}`}
                  className="category-banner-card"
                  style={imageUrl ? { backgroundImage: `url("${imageUrl}")` } : {}}
                >
                  <div className="category-banner-overlay" />
                  <div className="category-banner-body">
                    <span className="category-banner-name">{name}</span>
                    <span className="category-banner-count">{count} สินค้า</span>
                  </div>
                  <span className="category-banner-watermark">CAT</span>
                </Link>
              ))}
            </RevealFx>
          )}
        </section>
        <Footer />
      </main>
      <MobileNav />
    </>
  );
}
