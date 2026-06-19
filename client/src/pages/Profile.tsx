import { useState } from "react";
import { useLocation } from "wouter";
import { Calendar, DollarSign, Eye, EyeOff, Lock, Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { UserLayout } from "@/components/UserLayout";
import { ShinyText } from "@/components/fx";
import { LiquidButton } from "@/components/animate-ui/components/buttons/liquid";
import { GravityStarsBackground } from "@/components/animate-ui/components/backgrounds/gravity-stars";

/**
 * Design philosophy reminder: Cyber-Noir Thai Commerce.
 * Profile page: user info card and credentials update form embedded in UserLayout.
 */

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

function formatThaiDate(dateString?: string): string {
  if (!dateString) return "ไม่ทราบ";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "ไม่ทราบ";
  const day = date.getDate();
  const month = THAI_MONTHS[date.getMonth()];
  const year = date.getFullYear() + 543; // Buddhist era
  return `${day} ${month} ${year}`;
}

export default function Profile() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && !user) {
    navigate("/login");
    return null;
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();

    if (!currentPassword.trim()) {
      toast.error("กรุณากรอกรหัสผ่านปัจจุบัน");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/auth/change-password", {
        currentPassword,
        newPassword,
      });
      toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <UserLayout activeTab="profile">
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
          <span className="text-sm font-bold tracking-wider text-white uppercase">โปรไฟล์ / Account Profile</span>
        </div>

        {/* Profile info card */}
        <div className="syncx-glass p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-[var(--syncx-accent)]/10 text-white font-bold border border-white/10 flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
            {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : user.initial}
          </div>
          <div className="flex flex-col gap-2 flex-grow text-center sm:text-left">
            <h2 className="text-lg font-bold text-white tracking-wide">{user.displayName}</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs text-gray-400 justify-center sm:justify-start">
              <span className="flex items-center gap-1.5 justify-center sm:justify-start">
                <DollarSign size={14} className="text-[var(--syncx-accent)]" /> ยอดเงิน / Balance: <strong><ShinyText>฿{user.balance.toLocaleString("th-TH")}</ShinyText></strong>
              </span>
              <span className="flex items-center gap-1.5 justify-center sm:justify-start">
                <Calendar size={14} className="text-gray-500" /> สมาชิกตั้งแต่ / Joined: {formatThaiDate(user.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Password change card */}
        <div className="syncx-glass p-6 rounded-2xl flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-[var(--syncx-border)] pb-3 text-sm font-bold text-white uppercase">
            <Lock size={16} className="text-[var(--syncx-accent)]" />
            <span>เปลี่ยนรหัสผ่าน / Change Password</span>
          </div>
          <form className="flex flex-col gap-4" onSubmit={handlePasswordChange}>
            <div className="relative flex items-center w-full">
              <Lock size={15} className="absolute left-3.5 text-gray-500 pointer-events-none" />
              <input
                type={showCurrent ? "text" : "password"}
                placeholder="รหัสผ่านปัจจุบัน"
                className="syncx-input pl-10 pr-10"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={submitting}
              />
              <button
                type="button"
                className="absolute right-3 text-gray-400 hover:text-white cursor-pointer bg-transparent border-none outline-none"
                onClick={() => setShowCurrent((v) => !v)}
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            
            <div className="relative flex items-center w-full">
              <Lock size={15} className="absolute left-3.5 text-gray-500 pointer-events-none" />
              <input
                type={showNew ? "text" : "password"}
                placeholder="รหัสผ่านใหม่ (6+ ตัวอักษร)"
                className="syncx-input pl-10 pr-10"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={submitting}
              />
              <button
                type="button"
                className="absolute right-3 text-gray-400 hover:text-white cursor-pointer bg-transparent border-none outline-none"
                onClick={() => setShowNew((v) => !v)}
                tabIndex={-1}
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <div className="relative flex items-center w-full">
              <Lock size={15} className="absolute left-3.5 text-gray-500 pointer-events-none" />
              <input
                type="password"
                placeholder="ยืนยันรหัสผ่านใหม่"
                className="syncx-input pl-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
              />
            </div>

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
              <button type="submit" className="w-full py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[var(--syncx-button)] rounded-xl hover:brightness-110 shadow-lg shadow-[var(--syncx-glow)] flex items-center justify-center gap-2 transition-all cursor-pointer border-none" disabled={submitting}>
                <Save size={15} />
                {submitting ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่ / Save Password"}
              </button>
            </LiquidButton>
          </form>
        </div>
      </div>
    </UserLayout>
  );
}
