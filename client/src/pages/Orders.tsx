import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Clock, RefreshCw, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { UserLayout } from "@/components/UserLayout";
import { ShinyText } from "@/components/fx";
import { api } from "@/lib/api";
import { GravityStarsBackground } from "@/components/animate-ui/components/backgrounds/gravity-stars";

/**
 * Design philosophy reminder: Cyber-Noir Thai Commerce.
 * Orders page lists users completed orders with keys inside UserLayout.
 */

export default function Orders() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [orders, setOrders] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (user) {
      api.get<any[]>("/api/orders")
        .then(setOrders)
        .catch(console.error)
        .finally(() => setFetching(false));
    }
  }, [user]);

  const totalSpent = useMemo(() => orders.reduce((sum, o) => sum + (o.total ?? 0), 0), [orders]);

  if (!loading && !user) {
    navigate("/login");
    return null;
  }

  return (
    <UserLayout activeTab="orders">
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
          <span className="text-sm font-bold tracking-wider text-white uppercase">ประวัติการสั่งซื้อ / Order History</span>
        </div>

        <div className="syncx-glass rounded-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-black/40 border-b border-[var(--syncx-border)]">
            <div className="flex items-center gap-2 text-sm font-bold text-white uppercase">
              <Clock size={18} className="text-[var(--syncx-accent)]" />
              <span>ประวัติการสั่งซื้อ ({orders.length} รายการ)</span>
            </div>
            <div className="text-xs text-gray-400">
              รวมยอดทั้งหมด / Total Spent: <strong className="text-white ml-1"><ShinyText>฿{totalSpent.toLocaleString("th-TH")}</ShinyText></strong>
            </div>
          </div>

          {fetching ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <RefreshCw className="animate-spin text-[var(--syncx-accent)]" size={20} />
              <p className="text-xs font-semibold uppercase tracking-wider">กำลังโหลดประวัติ...</p>
            </div>
          ) : orders.length ? (
            <div className="flex flex-col gap-3.5 p-5">
              {orders.map((order) => (
                <div key={order.id} className="bg-black/30 border border-[var(--syncx-border)] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-gray-600 group">
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-white text-sm tracking-wide group-hover:text-[var(--syncx-accent)] transition-colors duration-200">{order.product_name}</h4>
                    <p className="text-[11px] text-gray-400">
                      ตัวเลือก: <span className="text-white">{order.tier_label}</span> | 
                      จำนวน: <span className="text-white"> {order.quantity} ชิ้น</span> | 
                      วันที่: <span className="text-white"> {new Date(order.created_at).toLocaleString("th-TH")}</span>
                    </p>
                    <div className="pt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1">
                        <ShieldCheck size={12} className="text-emerald-500" /> LICENSE KEY:
                      </span>
                      <code className="text-xs bg-red-950/20 text-[#e60039] font-mono py-0.5 px-2 rounded border border-red-900/10 select-all">
                        {order.code_key}
                      </code>
                    </div>
                  </div>
                  <div className="text-left md:text-right border-t md:border-t-0 border-[var(--syncx-border)] pt-3 md:pt-0 flex md:flex-col justify-between items-center md:items-end">
                    <span className="text-[10px] text-gray-500 uppercase font-bold md:block">ยอดชำระ</span>
                    <strong className="text-white text-base font-extrabold tracking-tight mt-0.5">฿{(order.total ?? 0).toLocaleString("th-TH")}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-xs text-gray-500 italic">
              ยังไม่มีประวัติการสั่งซื้อ
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
