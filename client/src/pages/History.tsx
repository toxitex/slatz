import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Clock, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { UserLayout } from "@/components/UserLayout";
import { ShinyText } from "@/components/fx";
import { api } from "@/lib/api";
import { GravityStarsBackground } from "@/components/animate-ui/components/backgrounds/gravity-stars";

/**
 * Design philosophy reminder: Cyber-Noir Thai Commerce.
 * History page lists user credit vouchers history inside UserLayout.
 */

export default function History() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [topups, setTopups] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (user) {
      api.get<any[]>("/api/topups")
        .then(setTopups)
        .catch(console.error)
        .finally(() => setFetching(false));
    }
  }, [user]);

  const totalTopup = useMemo(() => topups.reduce((sum, v) => sum + (v.amount ?? 0), 0), [topups]);

  if (!loading && !user) {
    navigate("/login");
    return null;
  }

  return (
    <UserLayout activeTab="history">
      <GravityStarsBackground
        className="absolute inset-0 pointer-events-none opacity-[0.15]"
        style={{ color: "var(--syncx-accent, #e60039)" }}
        starsCount={60}
        starsSize={1.1}
        movementSpeed={0.2}
        mouseInfluence={110}
        gravityStrength={50}
      />
      
      <div className="flex flex-col gap-6 max-w-3xl w-full mx-auto relative z-10">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-6 bg-[var(--syncx-accent)] rounded-full shadow-[0_0_10px_var(--syncx-accent)]" />
          <span className="text-sm font-bold tracking-wider text-white uppercase">ประวัติการเติมเงิน / Topup History</span>
        </div>

        <div className="syncx-glass rounded-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-black/40 border-b border-[var(--syncx-border)]">
            <div className="flex items-center gap-2 text-sm font-bold text-white uppercase">
              <Clock size={18} className="text-[var(--syncx-accent)]" />
              <span>ประวัติการเติมเงิน ({topups.length} รายการ)</span>
            </div>
            <div className="text-xs text-gray-400">
              รวมเติมทั้งหมด / Total Credited: <strong className="text-white ml-1"><ShinyText>฿{totalTopup.toLocaleString("th-TH")}</ShinyText></strong>
            </div>
          </div>

          {fetching ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <RefreshCw className="animate-spin text-[var(--syncx-accent)]" size={20} />
              <p className="text-xs font-semibold uppercase tracking-wider">กำลังโหลดประวัติ...</p>
            </div>
          ) : topups.length ? (
            <div className="flex flex-col gap-3.5 p-5">
              {topups.map((topup) => (
                <div key={topup.id} className="bg-black/30 border border-[var(--syncx-border)] rounded-xl p-4 flex justify-between items-center transition-colors hover:border-gray-600 group">
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-white text-sm tracking-wide">เติมเครดิตผ่านรหัสคูปอง / Voucher Redemptions</h4>
                    <p className="text-[11px] text-gray-400">
                      รหัส: <code className="font-mono bg-black/30 text-white/80 py-0.5 px-1.5 rounded select-all border border-white/5">{topup.code}</code> | 
                      วันที่เติม: {new Date(topup.used_at).toLocaleString("th-TH")}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">ได้รับเครดิต</span>
                    <strong className="text-emerald-400 text-sm font-extrabold tracking-tight mt-0.5">+฿{topup.amount.toLocaleString("th-TH")}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-xs text-gray-500 italic">
              ยังไม่มีประวัติเติมเงิน
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
