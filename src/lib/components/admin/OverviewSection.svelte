<script lang="ts">
  import { resolve } from "$app/paths";
  import ExternalLinkIcon from "@lucide/svelte/icons/external-link";
  import { api, errorMessage } from "$lib/api";
  import { getStores } from "$lib/stores";
  import type { AdminStats } from "$lib/types";
  import { cn, formatBaht } from "$lib/utils";
  import SalesChart from "./SalesChart.svelte";
  import type { SectionKey } from "./sections";

  let { onnavigate }: { onnavigate: (key: SectionKey) => void } = $props();

  const { site, products } = getStores();

  let stats = $state<AdminStats | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let hovered = $state<number | null>(null);
  let salesChart = $state<SalesChart>();

  export async function refresh() {
    loading = true;
    void salesChart?.refresh();
    try {
      stats = await api.get<AdminStats>("/api/admin/stats");
      error = null;
    } catch (err) {
      error = errorMessage(err);
    } finally {
      loading = false;
    }
  }

  void refresh();

  const maxRevenue = $derived(Math.max(1, ...(stats?.sales.map((d) => d.revenue) ?? [1])));
  const salesTotal = $derived(stats?.sales.reduce((sum, d) => sum + d.revenue, 0) ?? 0);
  const topMax = $derived(Math.max(1, ...(stats?.topProducts.map((p) => p.revenue) ?? [1])));

  const kpis = $derived(
    stats
      ? [
          { label: "รายได้รวม", value: formatBaht(stats.totals.revenue), hint: `วันนี้ ${formatBaht(stats.totals.revenueToday)}` },
          { label: "คำสั่งซื้อ", value: stats.totals.orders.toLocaleString("th-TH"), hint: `ขายแล้ว ${stats.totals.sold.toLocaleString("th-TH")} ชิ้น` },
          { label: "ลูกค้า", value: stats.totals.users.toLocaleString("th-TH"), hint: `ใหม่ 7 วัน +${stats.totals.newUsers7d}` },
          { label: "สินค้าที่เปิดขาย", value: stats.totals.products.toLocaleString("th-TH"), hint: `คงคลัง ${stats.totals.stock.toLocaleString("th-TH")} ชิ้น` },
          { label: "ยอดเติมเงิน", value: formatBaht(stats.totals.topupCredited), hint: "จากบัตรที่ใช้แล้ว" },
          {
            label: "บัตรพร้อมใช้",
            value: stats.totals.vouchersAvailable.toLocaleString("th-TH"),
            hint: `มูลค่า ${formatBaht(stats.totals.vouchersAvailableValue)}`,
          },
        ]
      : [],
  );

  const connections = $derived([
    { label: "API เซิร์ฟเวอร์", ok: !error && stats !== null, detail: error ?? (stats ? "เชื่อมต่อแล้ว" : "กำลังตรวจสอบ...") },
    {
      label: "ฐานข้อมูล SQLite",
      ok: products.databaseMode,
      detail: products.databaseMode ? "สินค้าโหลดจากฐานข้อมูล" : "ใช้ข้อมูลสำรองในเบราว์เซอร์",
    },
    {
      label: "การตั้งค่าหน้าร้าน",
      ok: site.saveState !== "error",
      detail:
        site.saveState === "error"
          ? `บันทึกไม่สำเร็จ: ${site.saveError}`
          : site.savedAt
            ? `บันทึกล่าสุด ${site.savedAt.toLocaleTimeString("th-TH")}`
            : "ยังไม่มีการแก้ไขในรอบนี้",
    },
    {
      label: "อัปเดตหน้าร้านแบบสด",
      ok: typeof BroadcastChannel !== "undefined",
      detail: "หน้าร้านที่เปิดอยู่จะอัปเดตทันทีเมื่อบันทึก",
    },
  ]);

  function dayLabel(day: string) {
    const date = new Date(`${day}T00:00:00Z`);
    return date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  }
</script>

<SalesChart bind:this={salesChart} />

{#if error && !stats}
  <div class="rounded-2xl bg-card p-6 text-[13px]">
    <p class="font-semibold text-destructive">เชื่อมต่อ API ไม่ได้</p>
    <p class="mt-1 text-muted-foreground">{error}</p>
    <button type="button" class="mt-3 text-link hover:underline" onclick={refresh}>ลองอีกครั้ง</button>
  </div>
{:else if loading && !stats}
  <div class="grid grid-cols-2 gap-3 md:grid-cols-3">
    {#each Array(6) as _, i (i)}<div class="h-24 animate-pulse rounded-2xl bg-card"></div>{/each}
  </div>
  <div class="h-64 animate-pulse rounded-2xl bg-card"></div>
{:else if stats}
  <div class="stagger-in grid grid-cols-2 gap-3 md:grid-cols-3">
    {#each kpis as kpi, i (kpi.label)}
      <div class="rounded-2xl bg-card p-4 shadow-[0_0_0_0.5px_var(--syncx-border)]" style="--i: {i}">
        <p class="text-[11px] text-muted-foreground">{kpi.label}</p>
        <p class="mt-1 text-[22px] font-semibold tracking-tight tabular-nums">{kpi.value}</p>
        <p class="mt-0.5 text-[11px] text-muted-foreground">{kpi.hint}</p>
      </div>
    {/each}
  </div>

  <section class="rounded-2xl bg-card p-5 shadow-[0_0_0_0.5px_var(--syncx-border)]" aria-labelledby="sales-heading">
    <div class="flex items-end justify-between gap-3">
      <div>
        <h3 id="sales-heading" class="text-[13px] font-semibold">ยอดขาย 14 วันล่าสุด</h3>
        <p class="text-xs text-muted-foreground">รวม {formatBaht(salesTotal)}</p>
      </div>
      <p class="h-8 text-right text-xs tabular-nums" aria-live="polite">
        {#if hovered !== null}
          <span class="block font-semibold">{formatBaht(stats.sales[hovered].revenue)}</span>
          <span class="text-muted-foreground">{dayLabel(stats.sales[hovered].day)} · {stats.sales[hovered].orders} ออเดอร์</span>
        {/if}
      </p>
    </div>
    <div class="mt-4 flex h-40 items-end gap-1.5" role="img" aria-label="กราฟยอดขายรายวัน">
      {#each stats.sales as day, i (day.day)}
        <button
          type="button"
          class="group flex h-full flex-1 flex-col justify-end"
          aria-label={`${dayLabel(day.day)} ${formatBaht(day.revenue)}`}
          onmouseenter={() => (hovered = i)}
          onmouseleave={() => (hovered = null)}
          onfocus={() => (hovered = i)}
          onblur={() => (hovered = null)}
        >
          <span
            class={cn(
              "bar-grow block w-full rounded-t-md transition-colors",
              day.revenue ? "bg-foreground/80 group-hover:bg-foreground" : "bg-foreground/10",
            )}
            style="height: {Math.max(3, (day.revenue / maxRevenue) * 100)}%; --i: {i}"
          ></span>
        </button>
      {/each}
    </div>
    <div class="mt-2 flex justify-between text-[10px] text-muted-foreground">
      <span>{dayLabel(stats.sales[0].day)}</span>
      <span>วันนี้</span>
    </div>
  </section>

  <div class="grid gap-4 md:grid-cols-2">
    <section class="rounded-2xl bg-card p-5 shadow-[0_0_0_0.5px_var(--syncx-border)]">
      <h3 class="text-[13px] font-semibold">สินค้าขายดี</h3>
      {#if stats.topProducts.length}
        <ul class="mt-3 space-y-3">
          {#each stats.topProducts as product (product.productId)}
            <li class="text-[13px]">
              <div class="flex justify-between gap-3">
                <span class="truncate">{product.productName}</span>
                <span class="shrink-0 tabular-nums">{formatBaht(product.revenue)}</span>
              </div>
              <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div class="bar-fill h-full rounded-full bg-foreground" style="width: {(product.revenue / topMax) * 100}%"></div>
              </div>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="mt-3 text-[13px] text-muted-foreground">ยังไม่มียอดขาย</p>
      {/if}
    </section>

    <section class="rounded-2xl bg-card p-5 shadow-[0_0_0_0.5px_var(--syncx-border)]">
      <div class="flex items-center justify-between">
        <h3 class="text-[13px] font-semibold">สต็อกใกล้หมด</h3>
        <button type="button" class="text-xs text-link hover:underline" onclick={() => onnavigate("products")}>จัดการสินค้า</button>
      </div>
      {#if stats.lowStock.length}
        <ul class="mt-3 divide-y divide-border text-[13px]">
          {#each stats.lowStock as item (`${item.productId}-${item.tierLabel}`)}
            <li class="flex items-center justify-between gap-3 py-2">
              <span class="min-w-0 truncate">{item.productName} <span class="text-muted-foreground">· {item.tierLabel || "ตัวเลือก"}</span></span>
              <span
                class={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] tabular-nums",
                  item.stock === 0 ? "bg-foreground text-background" : "bg-secondary",
                )}
              >
                {item.stock === 0 ? "หมด" : `เหลือ ${item.stock}`}
              </span>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="mt-3 text-[13px] text-muted-foreground">สต็อกทุกตัวเลือกเพียงพอ</p>
      {/if}
    </section>
  </div>

  <section class="rounded-2xl bg-card p-5 shadow-[0_0_0_0.5px_var(--syncx-border)]">
    <div class="flex items-center justify-between">
      <h3 class="text-[13px] font-semibold">คำสั่งซื้อล่าสุด</h3>
      <button type="button" class="text-xs text-link hover:underline" onclick={() => onnavigate("orders")}>ดูทั้งหมด</button>
    </div>
    {#if stats.recentOrders.length}
      <ul class="mt-2 divide-y divide-border text-[13px]">
        {#each stats.recentOrders as order (order.id)}
          <li class="flex items-center justify-between gap-3 py-2.5">
            <span class="min-w-0">
              <span class="block truncate">{order.product_name} <span class="text-muted-foreground">· {order.tier_label} × {order.quantity}</span></span>
              <span class="block truncate text-[11px] text-muted-foreground">
                {order.user_name || order.user_email || "—"} · {new Date(order.created_at).toLocaleString("th-TH")}
              </span>
            </span>
            <span class="shrink-0 font-medium tabular-nums">{formatBaht(order.total)}</span>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="mt-3 text-[13px] text-muted-foreground">ยังไม่มีคำสั่งซื้อ</p>
    {/if}
  </section>
{/if}

<section class="rounded-2xl bg-card p-5 shadow-[0_0_0_0.5px_var(--syncx-border)]" aria-labelledby="connection-heading">
  <div class="flex items-center justify-between gap-3">
    <div>
      <h3 id="connection-heading" class="text-[13px] font-semibold">การเชื่อมต่อหน้าร้าน</h3>
      <p class="text-xs text-muted-foreground">ทุกการแก้ไขในแดชบอร์ดจะแสดงบนหน้าร้านทันที</p>
    </div>
    <a
      href={resolve("/")}
      target="_blank"
      rel="noopener"
      class="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs transition-colors hover:bg-foreground hover:text-background"
    >
      เปิดหน้าร้าน<ExternalLinkIcon class="size-3" />
    </a>
  </div>
  <ul class="mt-3 divide-y divide-border text-[13px]">
    {#each connections as item (item.label)}
      <li class="flex items-center gap-3 py-2.5">
        <span class="relative grid size-2.5 place-items-center">
          {#if item.ok}<span class="absolute size-2.5 animate-ping rounded-full bg-foreground/30"></span>{/if}
          <span class={cn("size-2 rounded-full", item.ok ? "bg-foreground" : "bg-destructive")}></span>
        </span>
        <span class="flex-1">{item.label}</span>
        <span class={cn("max-w-[55%] truncate text-right text-xs", item.ok ? "text-muted-foreground" : "text-destructive")}>
          {item.detail}
        </span>
      </li>
    {/each}
  </ul>
</section>
