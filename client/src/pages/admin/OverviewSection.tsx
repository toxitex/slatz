import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAdminData } from "./AdminData";
import type { SectionKey } from "./sections";
import { cardClass, formatBaht, StatusDot } from "./ui";

type AdminStats = {
  totals: {
    users: number;
    newUsers7d: number;
    orders: number;
    revenue: number;
    revenueToday: number;
    topupCredited: number;
    vouchersAvailable: number;
    vouchersAvailableValue: number;
    products: number;
    stock: number;
    sold: number;
  };
  sales: { day: string; orders: number; revenue: number }[];
  topProducts: { productId: string; productName: string; quantity: number; revenue: number }[];
  lowStock: { productId: string; productName: string; tierLabel: string; stock: number }[];
  recentOrders: {
    id: string;
    product_name: string;
    tier_label: string;
    quantity: number;
    total: number;
    created_at: string;
    user_email?: string;
    user_name?: string;
  }[];
};

export type RefreshHandle = { refresh: () => Promise<void> };

const chartConfig = { revenue: { label: "รายได้", color: "var(--chart-1)" } } satisfies ChartConfig;

const dayLabel = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString("th-TH", { day: "numeric", month: "short" });

export const OverviewSection = forwardRef<RefreshHandle, { onNavigate: (key: SectionKey) => void }>(function OverviewSection(
  { onNavigate },
  ref,
) {
  const { saveState, saveError, savedAt } = useSiteConfig();
  const { inventory } = useAdminData();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setStats(await api.get<AdminStats>("/api/admin/stats"));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useImperativeHandle(ref, () => ({ refresh }), [refresh]);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const chartData = useMemo(() => stats?.sales.map((d) => ({ ...d, label: dayLabel(d.day) })) ?? [], [stats]);
  const salesTotal = useMemo(() => stats?.sales.reduce((sum, d) => sum + d.revenue, 0) ?? 0, [stats]);
  const topMax = Math.max(1, ...(stats?.topProducts.map((p) => p.revenue) ?? [1]));

  const connections = [
    { label: "API เซิร์ฟเวอร์", ok: !error && !!stats, detail: error ?? (stats ? "เชื่อมต่อแล้ว" : "กำลังตรวจสอบ...") },
    {
      label: "ฐานข้อมูล SQLite",
      ok: inventory.databaseMode,
      detail: inventory.databaseMode ? "สินค้าโหลดจากฐานข้อมูล" : "ใช้ข้อมูลสำรองในเบราว์เซอร์",
    },
    {
      label: "การตั้งค่าหน้าร้าน",
      ok: saveState !== "error",
      detail:
        saveState === "error"
          ? `บันทึกไม่สำเร็จ: ${saveError}`
          : savedAt
            ? `บันทึกล่าสุด ${savedAt.toLocaleTimeString("th-TH")}`
            : "ยังไม่มีการแก้ไขในรอบนี้",
    },
    { label: "อัปเดตหน้าร้านแบบสด", ok: typeof BroadcastChannel !== "undefined", detail: "แท็บหน้าร้านที่เปิดอยู่อัปเดตทันที" },
  ];

  if (error && !stats) {
    return (
      <div className={cn(cardClass, "p-6 text-[13px]")}>
        <p className="font-semibold text-destructive">เชื่อมต่อ API ไม่ได้</p>
        <p className="mt-1 text-muted-foreground">{error}</p>
        <button type="button" className="mt-3 font-medium hover:underline" onClick={() => void refresh()}>
          ลองอีกครั้ง
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-card" />
        ))}
      </div>
    );
  }

  const kpis = [
    { label: "รายได้รวม", value: formatBaht(stats.totals.revenue), hint: `วันนี้ ${formatBaht(stats.totals.revenueToday)}` },
    { label: "คำสั่งซื้อ", value: stats.totals.orders.toLocaleString("th-TH"), hint: `ขายแล้ว ${stats.totals.sold.toLocaleString("th-TH")} ชิ้น` },
    { label: "ลูกค้า", value: stats.totals.users.toLocaleString("th-TH"), hint: `ใหม่ 7 วัน +${stats.totals.newUsers7d}` },
    { label: "สินค้าที่เปิดขาย", value: stats.totals.products.toLocaleString("th-TH"), hint: `คงคลัง ${stats.totals.stock.toLocaleString("th-TH")} ชิ้น` },
    { label: "ยอดเติมเงิน", value: formatBaht(stats.totals.topupCredited), hint: "จากบัตรที่ถูกใช้แล้ว" },
    {
      label: "บัตรเติมเงินพร้อมใช้",
      value: stats.totals.vouchersAvailable.toLocaleString("th-TH"),
      hint: `มูลค่า ${formatBaht(stats.totals.vouchersAvailableValue)}`,
      onClick: () => onNavigate("vouchers"),
    },
  ];

  return (
    <>
      <div className="admin-rise grid grid-cols-2 gap-3 md:grid-cols-3">
        {kpis.map((kpi, i) => (
          <button
            key={kpi.label}
            type="button"
            disabled={!kpi.onClick}
            onClick={kpi.onClick}
            style={{ ["--i" as string]: i }}
            className={cn(cardClass, "group p-4 text-left transition-transform enabled:hover:-translate-y-0.5")}
          >
            <p className="flex items-center justify-between text-[11px] text-muted-foreground">
              {kpi.label}
              {kpi.onClick && <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />}
            </p>
            <p className="mt-1 text-[22px] font-semibold tracking-tight tabular-nums">{kpi.value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{kpi.hint}</p>
          </button>
        ))}
      </div>

      <section className={cn(cardClass, "p-5")} aria-labelledby="sales-heading">
        <div className="flex items-end justify-between">
          <div>
            <h3 id="sales-heading" className="text-[13px] font-semibold">
              ยอดขาย 14 วันล่าสุด
            </h3>
            <p className="text-xs text-muted-foreground">รวม {formatBaht(salesTotal)}</p>
          </div>
        </div>
        <ChartContainer config={chartConfig} className="mt-4 aspect-auto h-48 w-full">
          <AreaChart data={chartData} margin={{ left: 4, right: 4, top: 8 }}>
            <defs>
              <linearGradient id="fill-revenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" formatter={(v) => formatBaht(Number(v))} />} />
            <Area dataKey="revenue" type="monotone" stroke="var(--color-revenue)" strokeWidth={2} fill="url(#fill-revenue)" />
          </AreaChart>
        </ChartContainer>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className={cn(cardClass, "p-5")}>
          <h3 className="text-[13px] font-semibold">สินค้าขายดี</h3>
          {stats.topProducts.length ? (
            <ul className="mt-3 space-y-3">
              {stats.topProducts.map((product) => (
                <li key={product.productId} className="text-[13px]">
                  <div className="flex justify-between gap-3">
                    <span className="truncate">{product.productName}</span>
                    <span className="shrink-0 tabular-nums">{formatBaht(product.revenue)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-foreground transition-[width] duration-700"
                      style={{ width: `${(product.revenue / topMax) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[13px] text-muted-foreground">ยังไม่มียอดขาย</p>
          )}
        </section>

        <section className={cn(cardClass, "p-5")}>
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold">สต็อกใกล้หมด</h3>
            <button type="button" className="text-xs font-medium hover:underline" onClick={() => onNavigate("products")}>
              จัดการสินค้า
            </button>
          </div>
          {stats.lowStock.length ? (
            <ul className="mt-2 divide-y divide-border text-[13px]">
              {stats.lowStock.map((item) => (
                <li key={`${item.productId}-${item.tierLabel}`} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate">
                    {item.productName} <span className="text-muted-foreground">· {item.tierLabel || "ตัวเลือก"}</span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] tabular-nums",
                      item.stock === 0 ? "bg-foreground text-background" : "bg-secondary",
                    )}
                  >
                    {item.stock === 0 ? "หมด" : `เหลือ ${item.stock}`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[13px] text-muted-foreground">สต็อกทุกตัวเลือกเพียงพอ</p>
          )}
        </section>
      </div>

      <section className={cn(cardClass, "p-5")}>
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold">คำสั่งซื้อล่าสุด</h3>
          <button type="button" className="text-xs font-medium hover:underline" onClick={() => onNavigate("orders")}>
            ดูทั้งหมด
          </button>
        </div>
        {stats.recentOrders.length ? (
          <ul className="mt-2 divide-y divide-border text-[13px]">
            {stats.recentOrders.map((order) => (
              <li key={order.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate">
                    {order.product_name}{" "}
                    <span className="text-muted-foreground">
                      · {order.tier_label} × {order.quantity}
                    </span>
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {order.user_name || order.user_email || "—"} · {new Date(order.created_at).toLocaleString("th-TH")}
                  </span>
                </span>
                <span className="shrink-0 font-medium tabular-nums">{formatBaht(order.total)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[13px] text-muted-foreground">ยังไม่มีคำสั่งซื้อ</p>
        )}
      </section>

      <section className={cn(cardClass, "p-5")} aria-labelledby="connection-heading">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 id="connection-heading" className="text-[13px] font-semibold">
              การเชื่อมต่อหน้าร้าน
            </h3>
            <p className="text-xs text-muted-foreground">ทุกการแก้ไขในแดชบอร์ดจะแสดงบนหน้าร้านทันที</p>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noopener"
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs transition-colors hover:bg-foreground hover:text-background"
          >
            เปิดหน้าร้าน
            <ExternalLink className="size-3" />
          </a>
        </div>
        <ul className="mt-3 divide-y divide-border text-[13px]">
          {connections.map((item) => (
            <li key={item.label} className="flex items-center gap-3 py-2.5">
              <StatusDot ok={item.ok} />
              <span className="flex-1">{item.label}</span>
              <span className={cn("max-w-[55%] truncate text-right text-xs", item.ok ? "text-muted-foreground" : "text-destructive")}>
                {item.detail}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
});
