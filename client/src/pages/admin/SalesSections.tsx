import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { Receipt, Users } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { RefreshHandle } from "./OverviewSection";
import { cardClass, Empty, formatBaht } from "./ui";

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

type AdminOrder = {
  id: string;
  user_email?: string;
  user_name?: string;
  product_name: string;
  tier_label: string;
  quantity: number;
  total: number;
  code_key: string;
  created_at: string;
};

function useRows<T>(path: string) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api.get<T[]>(path));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { rows, loading, error, refresh };
}

const searchClass =
  "h-9 rounded-full bg-card px-4 text-[13px] shadow-[0_0_0_0.5px_var(--border)] outline-none focus-visible:ring-3 focus-visible:ring-ring/25";
const cellInput = "w-full rounded-md bg-transparent px-1.5 py-1 outline-none hover:bg-secondary focus:bg-secondary";

export const UsersSection = forwardRef<RefreshHandle>(function UsersSection(_props, ref) {
  const { rows, loading, error, refresh } = useRows<AdminUser>("/api/users");
  const [query, setQuery] = useState("");
  useImperativeHandle(ref, () => ({ refresh }), [refresh]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((u) => `${u.display_name} ${u.email}`.toLowerCase().includes(q)) : rows;
  }, [query, rows]);

  const update = async (user: AdminUser, patch: { balance?: number; display_name?: string }) => {
    try {
      await api.patch(`/api/users/${user.id}`, patch);
      toast.success("อัปเดตลูกค้าแล้ว");
      void refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  if (error) return <p className={cn(cardClass, "px-4 py-3 text-[13px] text-destructive")}>{error}</p>;
  if (loading && !rows.length) return <div className="h-64 animate-pulse rounded-2xl bg-card" />;
  if (!rows.length) return <Empty icon={<Users className="size-6" strokeWidth={1.5} />}>ยังไม่มีลูกค้าในระบบ</Empty>;

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`ค้นหาลูกค้า (${rows.length} คน)`} aria-label="ค้นหาลูกค้า" className={searchClass} />
      <div className={cn(cardClass, "overflow-x-auto")}>
        <table className="w-full min-w-[720px] text-[13px]">
          <thead className="border-b text-left text-[11px] text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-normal">ชื่อ</th>
              <th className="px-4 py-2 font-normal">อีเมล</th>
              <th className="px-4 py-2 text-right font-normal">ยอดเงิน (฿)</th>
              <th className="px-4 py-2 text-right font-normal">ออเดอร์</th>
              <th className="px-4 py-2 text-right font-normal">ใช้จ่าย</th>
              <th className="px-4 py-2 text-right font-normal">สมัครเมื่อ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((user) => (
              <tr key={user.id}>
                <td className="px-3 py-1.5">
                  <input
                    key={user.display_name}
                    defaultValue={user.display_name}
                    aria-label="ชื่อที่แสดง"
                    className={cellInput}
                    onBlur={(e) => {
                      const name = e.target.value.trim();
                      if (name && name !== user.display_name) void update(user, { display_name: name });
                    }}
                  />
                </td>
                <td className="px-4 py-1.5 text-muted-foreground">{user.email}</td>
                <td className="px-3 py-1.5">
                  <input
                    key={user.balance}
                    type="number"
                    min={0}
                    defaultValue={user.balance}
                    aria-label="ยอดเงิน"
                    className={cn(cellInput, "text-right tabular-nums")}
                    onBlur={(e) => {
                      const balance = Number(e.target.value);
                      if (!Number.isNaN(balance) && balance >= 0 && balance !== user.balance) void update(user, { balance });
                    }}
                  />
                </td>
                <td className="px-4 py-1.5 text-right tabular-nums">{user.order_count}</td>
                <td className="px-4 py-1.5 text-right tabular-nums">{formatBaht(user.total_spent)}</td>
                <td className="px-4 py-1.5 text-right text-muted-foreground">{new Date(user.created_at).toLocaleDateString("th-TH")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
});

export const OrdersSection = forwardRef<RefreshHandle>(function OrdersSection(_props, ref) {
  const { rows, loading, error, refresh } = useRows<AdminOrder>("/api/admin/orders");
  const [query, setQuery] = useState("");
  useImperativeHandle(ref, () => ({ refresh }), [refresh]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? rows.filter((o) => `${o.product_name} ${o.user_email} ${o.user_name} ${o.code_key}`.toLowerCase().includes(q))
      : rows;
  }, [query, rows]);
  const revenue = rows.reduce((sum, o) => sum + (o.total ?? 0), 0);

  if (error) return <p className={cn(cardClass, "px-4 py-3 text-[13px] text-destructive")}>{error}</p>;
  if (loading && !rows.length) return <div className="h-64 animate-pulse rounded-2xl bg-card" />;
  if (!rows.length) return <Empty icon={<Receipt className="size-6" strokeWidth={1.5} />}>ยังไม่มีคำสั่งซื้อในระบบ</Empty>;

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className={cn(cardClass, "p-4")}>
          <p className="text-[11px] text-muted-foreground">คำสั่งซื้อทั้งหมด</p>
          <p className="mt-1 text-[22px] font-semibold tabular-nums">{rows.length.toLocaleString("th-TH")}</p>
        </div>
        <div className={cn(cardClass, "p-4")}>
          <p className="text-[11px] text-muted-foreground">ยอดขายรวม</p>
          <p className="mt-1 text-[22px] font-semibold tabular-nums">{formatBaht(revenue)}</p>
        </div>
      </div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาสินค้า ลูกค้า หรือ License Key" aria-label="ค้นหาคำสั่งซื้อ" className={searchClass} />
      <div className={cn(cardClass, "overflow-x-auto")}>
        <table className="w-full min-w-[880px] text-[13px]">
          <thead className="border-b text-left text-[11px] text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-normal">ลูกค้า</th>
              <th className="px-4 py-2 font-normal">สินค้า</th>
              <th className="px-4 py-2 text-right font-normal">จำนวน</th>
              <th className="px-4 py-2 text-right font-normal">ราคารวม</th>
              <th className="px-4 py-2 font-normal">License Key</th>
              <th className="px-4 py-2 text-right font-normal">วันที่ซื้อ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-2.5">
                  <span className="block">{order.user_name || "—"}</span>
                  <span className="block text-[11px] text-muted-foreground">{order.user_email || ""}</span>
                </td>
                <td className="px-4 py-2.5">
                  {order.product_name} <span className="text-muted-foreground">· {order.tier_label}</span>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{order.quantity}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{formatBaht(order.total)}</td>
                <td className="px-4 py-2.5">
                  <code className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px] select-all">{order.code_key}</code>
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap text-muted-foreground">{new Date(order.created_at).toLocaleString("th-TH")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
});
