<script lang="ts">
  import { api, errorMessage } from "$lib/api";
  import { formatBaht } from "$lib/utils";
  import { buildOverview, OVERVIEW_WEEKS, type OrderRow } from "./overview-model";

  const SHADES = ["#2c2c2e", "#48484a", "#8e8e93", "#d1d1d6", "#f5f5f7"];
  const ROW_LABELS = ["จ", "", "อ", "", "พ", "", "ศ"];

  let orders = $state<OrderRow[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  export async function refresh() {
    loading = true;
    error = null;
    try {
      orders = await api.get<OrderRow[]>("/api/admin/orders");
    } catch (err) {
      orders = [];
      error = errorMessage(err);
    } finally {
      loading = false;
    }
  }

  void refresh();

  function shade(count: number) {
    if (count <= 0) return SHADES[0];
    if (count === 1) return SHADES[1];
    if (count <= 3) return SHADES[2];
    if (count <= 5) return SHADES[3];
    return SHADES[4];
  }

  const model = $derived(buildOverview(orders));

  const line = $derived.by(() => {
    const width = 720;
    const height = 280;
    const pad = { l: 64, r: 28, t: 24, b: 36 };
    const max = Math.max(1, ...model.series);
    const innerW = width - pad.l - pad.r;
    const innerH = height - pad.t - pad.b;
    const coords = model.series.map((value, index) => {
      const x = pad.l + (model.series.length <= 1 ? innerW / 2 : (index / (model.series.length - 1)) * innerW);
      const y = pad.t + innerH - (value / max) * innerH;
      return { x, y, value, index };
    });
    const path = coords.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
    const base = pad.t + innerH;
    const area =
      coords.length > 0
        ? `${path} L${coords[coords.length - 1].x.toFixed(1)},${base} L${coords[0].x.toFixed(1)},${base} Z`
        : "";
    const grid = [0, 0.5, 1].map((step) => ({
      y: pad.t + innerH - step * innerH,
      label: step === 0 ? "฿0" : formatBaht(Math.round(max * step)),
    }));
    const months = model.weeks.flatMap((week, index) => (week.label ? [{ index, label: week.label }] : []));
    return { width, height, pad, coords, path, area, grid, months, base };
  });

  const figures = $derived([
    { value: formatBaht(model.revenue), label: "ยอดขาย", note: `${OVERVIEW_WEEKS} สัปดาห์ล่าสุด` },
    { value: String(model.orderCount), label: "คำสั่งซื้อ", note: model.current > 0 ? `ติดต่อกัน ${model.current} วัน` : "ไม่มีออเดอร์วันนี้" },
    { value: String(model.units), label: "ชิ้นที่ขาย", note: `${model.activeDays} วันที่มีออเดอร์` },
  ]);
</script>

{#if error}
  <p class="rounded-2xl bg-card px-4 py-3 text-[13px] text-destructive">{error}</p>
{/if}

<section class="rounded-3xl bg-card px-5 py-6 text-foreground sm:px-7 sm:py-7">
  <h2 class="display text-[28px] font-bold leading-tight sm:text-[34px]">
    {#if model.current > 0}{model.current} วันติด{/if}
    {#if model.current === 0}ออเดอร์ {OVERVIEW_WEEKS} สัปดาห์ล่าสุด{/if}
  </h2>
  <p class="mt-2 max-w-xl text-[14px] leading-relaxed text-[#86868b]">
    แต่ละช่องคือหนึ่งวัน นับจากคำสั่งซื้อจริง ช่องสว่างคือวันที่มีออเดอร์มากกว่า
  </p>

  <div class="mt-8 overflow-x-auto" aria-label="ออเดอร์รายวัน 26 สัปดาห์">
    <div
      class="mx-auto grid w-max gap-[4px]"
      style:grid-template-columns="18px repeat({model.weeks.length}, 16px)"
    >
      <span></span>
      {#each model.weeks as week, weekIndex (weekIndex)}
        <span class="truncate text-[10px] text-[#86868b]">{week.label}</span>
      {/each}
      {#each ROW_LABELS as label, day (day)}
        <span class="grid size-4 place-items-center text-[10px] leading-none text-[#86868b]">{label}</span>
        {#each model.weeks as week, weekIndex (`${day}-${weekIndex}`)}
          {@const cell = week.days[day]}
          <span
            class="size-4 rounded-[3px]"
            style:background={cell.future ? "#161617" : shade(cell.count)}
            title={cell.future ? "" : `${cell.key}: ${cell.count} ออเดอร์`}
          ></span>
        {/each}
      {/each}
    </div>
    <div class="mt-4 flex items-center justify-between gap-4 text-[11px] text-[#86868b]">
      <p class="flex items-center gap-1.5">
        น้อย
        {#each SHADES as color, index (index)}
          <span class="size-[11px] rounded-[2px]" style:background={color}></span>
        {/each}
        มาก
      </p>
      <p>ยาวที่สุด {model.longest} วัน</p>
    </div>
  </div>

  {#if loading}
    <p class="mt-6 text-[12px] text-[#86868b]">กำลังโหลดคำสั่งซื้อ...</p>
  {/if}
</section>

<div class="grid gap-3 sm:grid-cols-3">
  {#each figures as figure (figure.label)}
    <section class="rounded-3xl bg-card px-5 py-5 text-foreground">
      <p class="display text-[32px] font-bold tabular-nums">{figure.value}</p>
      <p class="mt-1 text-[14px]">{figure.label}</p>
      <p class="text-[12px] text-[#86868b]">{figure.note}</p>
    </section>
  {/each}
</div>

<section class="rounded-3xl bg-card px-5 py-6 text-foreground sm:px-7">
  <h2 class="display text-center text-[26px] font-bold sm:text-[32px]">ยอดขายสะสม</h2>
  <p class="mx-auto mt-2 max-w-lg text-center text-[14px] leading-relaxed text-[#86868b]">
    รวมจากออเดอร์ในช่วงเดียวกับตารางด้านบน จุดบนเส้นคือครั้งแรกที่ยอดถึงหลักพัน
  </p>
  <svg viewBox="0 0 {line.width} {line.height}" class="mt-2 w-full" role="img" aria-label="กราฟยอดขายสะสม">
    <defs>
      <linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="currentColor" stop-opacity="0.18" />
        <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
      </linearGradient>
    </defs>
    {#each line.grid as row, index (index)}
      <line x1={line.pad.l} x2={line.width - line.pad.r} y1={row.y} y2={row.y} stroke="currentColor" stroke-opacity="0.16" stroke-width="1" />
      <text x="4" y={row.y + 4} fill="currentColor" fill-opacity="0.55" font-size="12">{row.label}</text>
    {/each}
    <path d={line.area} fill="url(#sales-fill)" />
    <path d={line.path} fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
    {#each line.months as month (month.index)}
      <text x={line.coords[month.index].x} y={line.height - 8} fill="currentColor" fill-opacity="0.55" font-size="11" text-anchor="middle">{month.label}</text>
    {/each}
    {#each model.milestones as mark, markIndex (mark.amount)}
      {@const point = line.coords[mark.index]}
      {@const nearEnd = point.x > line.width - line.pad.r - 48}
      <circle cx={point.x} cy={point.y} r="4.5" fill="var(--syncx-card)" stroke="currentColor" stroke-width="2" />
      <text
        x={nearEnd ? point.x - 8 : point.x + 8}
        y={point.y - 8 - (markIndex % 2) * 12}
        fill="currentColor"
        font-size="12"
        text-anchor={nearEnd ? "end" : "start"}
      >{formatBaht(mark.amount)}</text>
    {/each}
    {#if line.coords.length}
      {@const last = line.coords[line.coords.length - 1]}
      <circle cx={last.x} cy={last.y} r="4.5" fill="currentColor" />
    {/if}
  </svg>
</section>
