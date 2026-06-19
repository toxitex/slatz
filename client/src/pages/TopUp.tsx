import { useState } from "react";
import { useLocation } from "wouter";
import { DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { UserLayout } from "@/components/UserLayout";
import { ShinyText } from "@/components/fx";
import { api } from "@/lib/api";
import { LiquidButton } from "@/components/animate-ui/components/buttons/liquid";
import { GravityStarsBackground } from "@/components/animate-ui/components/backgrounds/gravity-stars";

/**
 * Design philosophy reminder: Cyber-Noir Thai Commerce.
 * Top-up wallet page refactored with Tailwind utility classes inside UserLayout.
 */

export default function TopUp() {
  const { user, loading, refresh } = useAuth();
  const [, navigate] = useLocation();
  const [couponCode, setCouponCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && !user) {
    navigate("/login");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = couponCode.trim();
    if (!code) {
      toast.error("กรุณากรอกรหัสคูปอง");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post<{ amount: number; balance: number }>("/api/topup", { code });
      toast.success(`เติมเงินสำเร็จ จำนวน ฿${res.amount.toLocaleString("th-TH")}`);
      setCouponCode("");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เติมเงินไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <UserLayout activeTab="topup">
      <GravityStarsBackground
        className="absolute inset-0 pointer-events-none opacity-[0.15]"
        style={{ color: "var(--syncx-accent, #e60039)" }}
        starsCount={60}
        starsSize={1.1}
        movementSpeed={0.2}
        mouseInfluence={110}
        gravityStrength={50}
      />
      
      <div className="flex flex-col gap-6 max-w-2xl w-full mx-auto relative z-10">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-6 bg-[var(--syncx-accent)] rounded-full shadow-[0_0_10px_var(--syncx-accent)]" />
          <span className="text-sm font-bold tracking-wider text-white uppercase">เติมเงิน / Topup Balance</span>
        </div>

        <div className="syncx-glass p-6 rounded-2xl flex flex-col gap-6 items-center">
          <div className="w-12 h-12 rounded-xl bg-[var(--syncx-accent)]/10 text-[var(--syncx-accent)] flex items-center justify-center shadow-lg"><DollarSign size={24} /></div>
          
          <div className="text-center">
            <h2 className="text-base font-bold text-white uppercase tracking-wide">เติมเงินระบบคูปอง</h2>
            <p className="text-xs text-gray-400 mt-1">ยอดคงเหลือ / Current Balance: <strong><ShinyText>฿{user.balance.toLocaleString("th-TH")}</ShinyText></strong></p>
          </div>

          <form className="flex flex-col gap-4 w-full border-t border-[var(--syncx-border)] pt-5" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-1.5 w-full">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">รหัสคูปอง / Coupon Code</span>
              <input
                type="text"
                className="syncx-input"
                placeholder="กรอกรหัสคูปอง"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                disabled={submitting}
              />
            </label>
            <LiquidButton
              asChild
              hoverScale={1.03}
              tapScale={0.97}
              size={null}
              variant={null}
              style={{
                display: "flex",
                width: "100%",
                '--liquid-button-background-color': 'rgba(230,0,57,0.08)',
                '--liquid-button-color': 'var(--syncx-button, #e60039)',
              } as React.CSSProperties}
            >
              <button type="submit" className="w-full py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[var(--syncx-button)] rounded-xl hover:brightness-110 shadow-lg shadow-[var(--syncx-glow)] flex items-center justify-center transition-all cursor-pointer border-none" disabled={submitting}>
                {submitting ? "กำลังตรวจสอบ..." : "ยืนยันเติมเงิน / Confirm Topup"}
              </button>
            </LiquidButton>
          </form>

          <div className="w-full border-t border-[var(--syncx-border)] pt-5 flex flex-col gap-3 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider">วิธีเติมเงินผ่านคูปอง / Guide</h3>
            <ol className="list-decimal pl-4 space-y-1 text-gray-400">
              <li>รับรหัสคูปองจากกิจกรรมหรือทีมงานผู้ดูแลระบบ</li>
              <li>กรอกรหัสคูปองลงในช่องด้านบนและกดยืนยัน</li>
              <li>ระบบจะทำการตรวจสอบและเพิ่มเครดิตเข้าบัญชีของคุณทันที</li>
              <li>หากมีปัญหา สามารถติดต่อทีมงานช่วยเหลือได้ตลอด 24 ชม.</li>
            </ol>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
