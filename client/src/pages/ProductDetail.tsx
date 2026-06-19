import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { ArrowLeft, ChevronDown, ChevronUp, Home as HomeIcon, Menu, Minus, Plus, ShieldCheck, ShoppingCart, Store as StoreIcon, Tag, Ticket } from "lucide-react";
import { toast } from "sonner";
import { useSiteConfig, type ProductTier } from "@/contexts/SiteConfigContext";
import { useInventoryProducts } from "@/hooks/useInventoryProducts";
import { useCoupons } from "@/hooks/useCoupons";
import { useScrolled } from "@/hooks/useScrolled";
import { useAuth } from "@/hooks/useAuth";
import { UserMenu } from "@/components/UserMenu";
import { ShinyText, Magnetic } from "@/components/fx";
import { MobileNav, TopNav } from "@/pages/Store";
import { api } from "@/lib/api";
import { LogoIcon } from "@/components/LogoIcon";
import { RippleButton, RippleButtonRipples } from "@/components/animate-ui/components/buttons/ripple";
import { LiquidButton } from "@/components/animate-ui/components/buttons/liquid";

/**
 * Design philosophy reminder: Cyber-Noir Thai Commerce.
 * Product detail page rebuilt using standard Tailwind v4 utility styles.
 */

function formatBaht(amount: number): string {
  return `฿${amount.toLocaleString("th-TH")}`;
}

function priceRange(tiers: ProductTier[]): string | null {
  if (!tiers.length) return null;
  const prices = tiers.map((tier) => tier.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatBaht(min) : `${formatBaht(min)} - ${formatBaht(max)}`;
}

function totalStock(tiers: ProductTier[]): number {
  return tiers.reduce((sum, tier) => sum + Math.max(0, tier.stock || 0), 0);
}

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



export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { products, loading, error } = useInventoryProducts();
  const { validateCoupon } = useCoupons();
  const { user, refresh } = useAuth();
  const [purchaseOrder, setPurchaseOrder] = useState<any>(null);
  const [buying, setBuying] = useState(false);

  const product = useMemo(() => products.find((entry) => entry.id === params.id) ?? null, [params.id, products]);
  const tiers = product?.tiers ?? [];

  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountType: "percent" | "fixed"; discountValue: number } | null>(null);
  const [descriptionOpen, setDescriptionOpen] = useState(true);

  useEffect(() => {
    if (!selectedTierId && tiers.length) {
      const firstAvailable = tiers.find((tier) => tier.stock > 0) ?? tiers[0];
      setSelectedTierId(firstAvailable.id);
    }
  }, [selectedTierId, tiers]);

  const selectedTier = tiers.find((tier) => tier.id === selectedTierId) ?? null;
  const subtotal = selectedTier ? selectedTier.price * quantity : 0;
  const discountAmount = appliedCoupon
    ? appliedCoupon.discountType === "percent"
      ? Math.round((subtotal * appliedCoupon.discountValue) / 100)
      : Math.min(appliedCoupon.discountValue, subtotal)
    : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const handleApplyCoupon = () => {
    const trimmed = couponCode.trim();
    if (!trimmed) {
      toast("กรุณาใส่โค้ดส่วนลด");
      return;
    }
    const found = validateCoupon(trimmed);
    if (!found) {
      setAppliedCoupon(null);
      toast("โค้ดส่วนลดไม่ถูกต้องหรือหมดอายุ");
      return;
    }
    setAppliedCoupon({ code: found.code, discountType: found.discountType, discountValue: found.discountValue });
    toast(`ใช้โค้ด ${found.code} แล้ว`);
  };

  const handleClearCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const handleBuy = async () => {
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อนซื้อสินค้า");
      navigate("/login");
      return;
    }
    if (!selectedTier) {
      toast("กรุณาเลือกตัวเลือกสินค้า");
      return;
    }
    if (selectedTier.stock <= 0) {
      toast("สินค้าตัวเลือกนี้หมดชั่วคราว");
      return;
    }
    
    setBuying(true);
    try {
      const res = await api.post<{ success: boolean; order: any }>("/api/checkout", {
        productId: product?.id,
        tierId: selectedTier.id,
        quantity,
        couponCode: appliedCoupon?.code,
      });
      if (res.success) {
        setPurchaseOrder(res.order);
        toast.success("สั่งซื้อสินค้าสำเร็จ!");
        await refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "สั่งซื้อไม่สำเร็จ");
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <>
        <TopNav />
        <main className="syncx-page">
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-gray-400">
            <ShoppingCart size={28} className="animate-bounce text-[var(--syncx-accent)]" />
            <p className="text-sm font-medium">กำลังโหลดข้อมูลสินค้า...</p>
          </div>
        </main>
        <MobileNav />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <TopNav />
        <main className="syncx-page">
          <section className="max-w-md mx-auto my-24 text-center p-8 syncx-glass rounded-2xl flex flex-col items-center gap-4">
            <Tag size={32} className="text-gray-500" />
            <h1 className="text-xl font-bold text-white">ไม่พบสินค้านี้</h1>
            <p className="text-xs text-gray-400 leading-relaxed">{error ?? "สินค้าอาจถูกลบหรือยังไม่ได้เผยแพร่"}</p>
            <button className="syncx-btn-primary w-full" type="button" onClick={() => navigate("/store")}>กลับไปยังร้านค้า</button>
          </section>
        </main>
        <MobileNav />
      </>
    );
  }

  const stockTotal = totalStock(tiers);
  const range = priceRange(tiers);

  return (
    <>
      <TopNav />
      <main className="syncx-page">
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-16 w-full flex-grow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer bg-transparent border-none outline-none" type="button" onClick={() => navigate("/store")}>
            <ArrowLeft size={16} className="text-[var(--syncx-accent)]" />
            <span>ย้อนกลับ / Back</span>
          </button>
          <nav className="flex items-center gap-2 text-xs font-semibold tracking-wider text-gray-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors duration-200 no-underline">หน้าแรก</Link>
            <span>/</span>
            <strong className="text-white font-bold">{product.name}</strong>
          </nav>
        </div>

        <article className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Media Column (Left) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="product-image-frame">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} />
              ) : (
                <ShoppingCart size={56} className="text-gray-600" />
              )}
            </div>
            
            <div className="syncx-glass p-4 rounded-xl flex items-center gap-3">
              <ShieldCheck size={18} className="text-emerald-500 flex-shrink-0" />
              <div>
                <span className="block text-[10px] text-gray-400 uppercase font-semibold">Security System</span>
                <strong className="block text-xs font-bold text-white">ปลอดภัยและได้รับสินค้าทันทีหลังชำระเงิน</strong>
              </div>
            </div>
          </div>

          {/* Info/Checkout Column (Right) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] text-[var(--syncx-accent)] font-bold tracking-wider uppercase bg-[var(--syncx-accent)]/10 px-2.5 py-1 rounded-md w-fit">
                <Tag size={12} />
                {product.category || "General"}
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight uppercase leading-tight">{product.name}</h1>
              
              <div className="flex flex-wrap gap-2 mt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${product.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                  {product.status === "active" ? "เปิดขาย" : "หมดชั่วคราว"}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white/5 text-gray-400 border-white/5">
                  คงเหลือ {stockTotal} ชิ้น
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white/5 text-gray-400 border-white/5">
                  ขายแล้ว {product.totalSold ?? 0} ชิ้น
                </span>
              </div>
            </div>

            {/* Product Tiers Selector */}
            {tiers.length > 0 ? (
              <section className="flex flex-col gap-3" aria-label="ตัวเลือกสินค้า">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Tag size={13} className="text-[var(--syncx-accent)]" />
                  <span>เลือกตัวเลือกสินค้า / Options</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tiers.map((tier) => {
                    const isSelected = tier.id === selectedTierId;
                    const soldOut = tier.stock <= 0;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        className={`p-4 rounded-xl border transition-all duration-200 text-left relative flex flex-col justify-between gap-3 outline-none cursor-pointer ${
                          isSelected
                            ? "bg-[var(--syncx-accent)]/5 border-[var(--syncx-accent)] shadow-[0_0_15px_color-mix(in_srgb,var(--syncx-accent)_15%,transparent)]"
                            : soldOut
                            ? "bg-transparent border-white/5 opacity-50 cursor-not-allowed"
                            : "bg-black/30 border-[var(--syncx-border)] hover:border-gray-500"
                        }`}
                        onClick={() => !soldOut && setSelectedTierId(tier.id)}
                        disabled={soldOut}
                      >
                        <div className="flex flex-col">
                          <strong className={`text-sm font-bold tracking-wide transition-colors ${isSelected ? "text-[var(--syncx-accent)]" : "text-white"}`}>
                            {tier.label || "ตัวเลือก"}
                          </strong>
                          <span className="text-[10px] text-gray-400 font-medium mt-0.5">คงเหลือ {tier.stock} ชิ้น</span>
                        </div>
                        <div className="text-base font-extrabold text-white tracking-tight self-end">
                          {formatBaht(tier.price)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : (
              <section className="flex flex-col gap-2" aria-label="ราคา">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">ราคา / Price</div>
                <div className="text-2xl font-extrabold text-white tracking-tight">{product.price || "ติดต่อร้านค้า"}</div>
              </section>
            )}

            {/* Description Dropdown */}
            <section className="syncx-glass p-5 rounded-xl flex flex-col gap-2.5">
              <button type="button" className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-300 w-full outline-none cursor-pointer bg-transparent border-none" onClick={() => setDescriptionOpen((open) => !open)}>
                <span className="flex items-center gap-1.5">
                  <ShoppingCart size={13} className="text-[var(--syncx-accent)]" />
                  <span>รายละเอียดสินค้า / Description</span>
                </span>
                {descriptionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {descriptionOpen ? (
                <p className="text-xs text-gray-300 leading-relaxed font-normal whitespace-pre-line border-t border-[var(--syncx-border)] pt-2.5 mt-1">
                  {product.description || "ยังไม่มีคำอธิบายสินค้า"}
                </p>
              ) : null}
            </section>

            {/* Controls (Qty & Coupon) */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Qty Stepper */}
              <div className="syncx-glass p-4 rounded-xl flex flex-col gap-2 justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                  <Tag size={11} className="text-[var(--syncx-accent)]" />
                  <span>จำนวน / Quantity</span>
                </span>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex items-center bg-black/40 border border-[var(--syncx-border)] rounded-lg overflow-hidden h-9">
                    <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-9 h-full flex items-center justify-center hover:bg-white/5 transition-colors border-none bg-transparent cursor-pointer text-gray-400" aria-label="ลดจำนวน"><Minus size={12} /></button>
                    <span className="w-10 text-center text-sm font-bold text-white">{quantity}</span>
                    <button type="button" onClick={() => setQuantity((q) => q + 1)} className="w-9 h-full flex items-center justify-center hover:bg-white/5 transition-colors border-none bg-transparent cursor-pointer text-gray-400" aria-label="เพิ่มจำนวน"><Plus size={12} /></button>
                  </div>
                  <div className="text-right ml-auto">
                    <span className="block text-[9px] text-gray-500 uppercase font-semibold">Subtotal</span>
                    <strong className="block text-xs text-white tracking-wide mt-0.5">{formatBaht(subtotal)}</strong>
                  </div>
                </div>
              </div>

              {/* Coupons */}
              <div className="syncx-glass p-4 rounded-xl flex flex-col gap-2 justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Ticket size={12} className="text-[var(--syncx-accent)]" />
                  <span>โค้ดส่วนลด / Coupon</span>
                </span>
                <div className="flex gap-2 mt-1.5">
                  <input
                    type="text"
                    placeholder="กรอกโค้ดส่วนลด"
                    className="flex-grow h-9 px-3 rounded-lg bg-black/40 border border-[var(--syncx-border)] text-xs text-white outline-none focus:border-[var(--syncx-accent)] focus:ring-1 focus:ring-[var(--syncx-accent)] transition-all"
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value)}
                    onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); handleApplyCoupon(); } }}
                  />
                  {appliedCoupon ? (
                    <button type="button" className="h-9 px-3 text-xs font-semibold rounded-lg text-white border border-[var(--syncx-border)] hover:bg-white/5 transition-colors cursor-pointer bg-transparent" onClick={handleClearCoupon}>ยกเลิก</button>
                  ) : (
                    <button type="button" className="h-9 px-3 text-xs font-semibold rounded-lg text-white border border-[var(--syncx-border)] hover:bg-white/5 transition-colors cursor-pointer bg-transparent" onClick={handleApplyCoupon}>ใช้โค้ด</button>
                  )}
                </div>
                {appliedCoupon ? (
                  <small className="block text-[10px] text-emerald-400 mt-1 font-semibold">ใช้โค้ด <strong>{appliedCoupon.code}</strong> ลด {appliedCoupon.discountType === "percent" ? `${appliedCoupon.discountValue}%` : formatBaht(appliedCoupon.discountValue)}</small>
                ) : null}
              </div>
            </section>

            {/* Total checkout card */}
            <div className="syncx-glass p-5 rounded-2xl flex flex-col gap-4 border border-[var(--syncx-accent)]/30 shadow-[0_4px_30px_color-mix(in_srgb,var(--syncx-accent)_5%,transparent)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--syncx-accent)] opacity-[0.02] rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">ยอดชำระสุทธิ / Total</span>
                  {discountAmount > 0 ? (
                    <span className="text-[10px] text-gray-500 line-through mr-1 font-semibold">{formatBaht(subtotal)}</span>
                  ) : null}
                  <strong className="block text-2xl font-extrabold text-white tracking-tight mt-0.5">
                    {formatBaht(total)}
                  </strong>
                </div>
                {discountAmount > 0 ? (
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase border border-emerald-500/15">ส่วนลด -{formatBaht(discountAmount)}</span>
                  </div>
                ) : null}
              </div>

              <LiquidButton
                asChild
                hoverScale={1.02}
                tapScale={0.98}
                size={null}
                variant={null}
                style={{
                  display: "flex",
                  '--liquid-button-background-color': 'rgba(230,0,57,0.08)',
                  '--liquid-button-color': 'var(--syncx-button, #e60039)',
                } as React.CSSProperties}
              >
                <button className="w-full py-3 text-xs font-bold uppercase tracking-wider text-white bg-[var(--syncx-button)] rounded-xl hover:brightness-110 shadow-lg shadow-[var(--syncx-glow)] transition-all cursor-pointer border-none" type="button" onClick={handleBuy} disabled={buying || !selectedTier || selectedTier.stock <= 0}>
                  {buying ? "กำลังดำเนินการ..." : !selectedTier ? "กรุณาเลือกตัวเลือก" : selectedTier.stock <= 0 ? "สินค้าตัวเลือกนี้หมด" : "ซื้อเลย / Buy Now"}
                </button>
              </LiquidButton>
            </div>
          </div>
        </article>
      </div>
    </main>

    {purchaseOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[20000] p-4">
          <div className="bg-[#0b0b0e] border border-white/10 p-6 rounded-2xl w-full max-w-md relative shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="text-emerald-500" /> ทำรายการสำเร็จ!
            </h3>
            <p className="text-white/60 text-xs mb-4">ขอบคุณสำหรับการสั่งซื้อ ระบบได้ออกคีย์การใช้งานของคุณแล้ว</p>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-5 text-center">
              <span className="text-[10px] text-white/40 block mb-1">คีย์การใช้งานของคุณ (LICENSE KEY)</span>
              <code className="text-lg font-bold text-white tracking-wider block bg-black/40 py-2.5 rounded-lg border border-emerald-500/20 select-all">{purchaseOrder.code_key}</code>
            </div>

            <div className="text-xs text-white/70 space-y-2 mb-6">
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>สินค้า</span>
                <span className="text-white font-medium">{purchaseOrder.product_name}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>ตัวเลือก</span>
                <span className="text-white font-medium">{purchaseOrder.tier_label}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>จำนวน</span>
                <span className="text-white font-medium">{purchaseOrder.quantity} ชิ้น</span>
              </div>
              <div className="flex justify-between">
                <span>ยอดชำระสุทธิ</span>
                <strong className="text-[#e60039]">฿{purchaseOrder.total.toLocaleString("th-TH")}</strong>
              </div>
            </div>

            <button
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-emerald-600/20 border-none cursor-pointer"
              onClick={() => {
                setPurchaseOrder(null);
                navigate("/orders");
              }}
            >
              ดูประวัติการสั่งซื้อ
            </button>
          </div>
        </div>
      )}
      <MobileNav />
    </>
  );
}
