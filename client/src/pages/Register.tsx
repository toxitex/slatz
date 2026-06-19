import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { AlertCircle, ArrowLeft, CheckCircle2, Mail, ShieldCheck, User, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { LogoIcon } from "@/components/LogoIcon";
import { LiquidButton } from "@/components/animate-ui/components/buttons/liquid";
import { GravityStarsBackground } from "@/components/animate-ui/components/backgrounds/gravity-stars";

/**
 * Design philosophy reminder: Cyber-Noir Thai Commerce.
 * Auth registration page refactored with Tailwind utility classes.
 */
function Logo() {
  const { config } = useSiteConfig();
  return (
    <Link href="/" className="flex items-center gap-2 font-bold text-sm text-white no-underline transition-opacity hover:opacity-90" aria-label="กลับหน้าหลัก">
      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[var(--syncx-border)] overflow-hidden shadow-inner flex-shrink-0"><LogoIcon size={14} /></span>
      <span>{config.siteName}</span>
    </Link>
  );
}

export default function Register() {
  const [, setLocation] = useLocation();
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!displayName || !email || !password || !confirmPassword) {
      setErrorMessage("กรุณากรอกข้อมูลสมัครสมาชิกให้ครบถ้วน");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("รหัสผ่านควรมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp(email, password, displayName);
    } catch (error) {
      setIsSubmitting(false);
      setErrorMessage(error instanceof Error ? error.message : "สมัครสมาชิกไม่สำเร็จ");
      return;
    }
    setIsSubmitting(false);

    setSuccessMessage("สมัครสมาชิกสำเร็จ กำลังพาไปยังร้านค้า...");
    toast.success("สมัครสมาชิกสำเร็จ");
    window.setTimeout(() => setLocation("/store"), 900);
  }

  return (
    <main className="syncx-page items-center justify-center p-4 relative !min-h-screen">
      <GravityStarsBackground
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{ color: "var(--syncx-accent, #e60039)" }}
        starsCount={70}
        starsSize={1.2}
        movementSpeed={0.25}
        mouseInfluence={120}
        gravityStrength={60}
      />
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[var(--syncx-accent)] opacity-[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-[var(--syncx-accent)] opacity-[0.03] rounded-full blur-3xl pointer-events-none" />

      <section className="w-full max-w-md relative z-10">
        <form className="syncx-glass p-8 rounded-2xl flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between border-b border-[var(--syncx-border)] pb-4">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors duration-200 no-underline cursor-pointer"><ArrowLeft size={14} className="text-[var(--syncx-accent)]" /> กลับหน้าหลัก</Link>
            <Logo />
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--syncx-accent)]/10 text-[var(--syncx-accent)] shadow-[0_0_15px_color-mix(in_srgb,var(--syncx-accent)_20%,transparent)]"><UserPlus size={17} /></span>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Create account</p>
              <h2 className="text-base font-bold text-white tracking-wide uppercase">สมัครสมาชิก / Register</h2>
            </div>
          </div>

          <label className="flex flex-col gap-1.5 w-full">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">ชื่อที่แสดง / Display Name</span>
            <div className="relative flex items-center">
              <User size={16} className="absolute left-3.5 text-gray-500 pointer-events-none" />
              <input
                type="text"
                autoComplete="name"
                placeholder="ชื่อของคุณ"
                className="syncx-input pl-10"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5 w-full">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">อีเมล / Email</span>
            <div className="relative flex items-center">
              <Mail size={16} className="absolute left-3.5 text-gray-500 pointer-events-none" />
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="syncx-input pl-10"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5 w-full">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">รหัสผ่าน / Password</span>
            <div className="relative flex items-center">
              <ShieldCheck size={16} className="absolute left-3.5 text-gray-500 pointer-events-none" />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="อย่างน้อย 6 ตัวอักษร"
                className="syncx-input pl-10"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5 w-full">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">ยืนยันรหัสผ่าน / Confirm Password</span>
            <div className="relative flex items-center">
              <ShieldCheck size={16} className="absolute left-3.5 text-gray-500 pointer-events-none" />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                className="syncx-input pl-10"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>
          </label>

          {errorMessage ? <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg"><AlertCircle size={15} />{errorMessage}</div> : null}
          {successMessage ? <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg"><CheckCircle2 size={15} />{successMessage}</div> : null}

          <LiquidButton
            asChild
            hoverScale={1.03}
            tapScale={0.97}
            size={null}
            variant={null}
            style={{
              display: "flex",
              '--liquid-button-background-color': 'color-mix(in srgb, var(--syncx-button) 8%, transparent)',
              '--liquid-button-color': 'var(--syncx-button, #e60039)',
            } as React.CSSProperties}
          >
            <button className="w-full py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[var(--syncx-button)] rounded-xl hover:brightness-110 shadow-lg shadow-[var(--syncx-glow)] flex items-center justify-center gap-2 transition-all cursor-pointer border-none" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
              <UserPlus size={15} />
            </button>
          </LiquidButton>

          <p className="text-center text-xs text-gray-400 mt-2">มีบัญชีอยู่แล้ว? <Link href="/login" className="text-[var(--syncx-accent)] hover:underline font-semibold ml-1">เข้าสู่ระบบที่นี่</Link></p>
        </form>
      </section>
    </main>
  );
}
