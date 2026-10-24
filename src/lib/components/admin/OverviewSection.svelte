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
    const width = 680;
    const height = 240;
    const pad = { l: 44, r: 20, t: 36, b: 28 };
    const max = Math.max(1, ...model.series);
    const innerW = width - pad.l - pad.r;
    const innerH = height - pad.t - pad.b;
    const coords = model.series.map((value, index) => {
      const x = pad.l + (model.series.length <= 1 ? innerW / 2 : (index / (model.series.length - 1)) * innerW);
      const y = pad.t + innerH - (value / max) * innerH;
      return { x, y, value, index };
    });
    const path = coords.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
    const grid = [0, 0.5, 1].map((step) => pad.t + innerH - step * innerH);
    return { width, height, pad, max, coords, path, grid, innerH };
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

<section class="rounded-3xl bg-[#0b0b0c] px-5 py-6 text-[#f5f5f7] sm:px-7 sm:py-7">
  <h2 class="text-[28px] leading-tight font-semibold tracking-tight sm:text-[34px]">
    {#if model.current > 0}{model.current} วันติด{/if}
    {#if model.current === 0}ออเดอร์ {OVERVIEW_WEEKS} สัปดาห์ล่าสุด{/if}
  </h2>
  <p class="mt-2 max-w-xl text-[14px] leading-relaxed text-[#86868b]">
    แต่ละช่องคือหนึ่งวัน นับจากคำสั่งซื้อจริง ช่องสว่างคือวันที่มีออเดอร์มากกว่า
  </p>

  <div class="mt-8 overflow-x-auto">
    <div class="flex min-w-max gap-2">
      <div class="flex w-4 flex-col gap-[3px] pt-5 text-[10px] text-[#86868b]">
        {#each ROW_LABELS as label, index (index)}
          <span class="grid h-[11px] place-items-center">{label}</span>
        {/each}
      </div>
      <div class="flex gap-[3px]" aria-label="ออเดอร์รายวัน 26 สัปดาห์">
        {#each model.weeks as week, weekIndex (weekIndex)}
          <div class="flex flex-col gap-[3px]">
            <span class="h-5 text-[10px] text-[#86868b]">{week.label}</span>
            {#each week.days as day (day.key)}
              <span
                class="size-[11px] rounded-[2px]"
                style:background={day.future ? "transparent" : shade(day.count)}
                title={day.future ? "" : `${day.key}: ${day.count} ออเดอร์`}
              ></span>
            {/each}
          </div>
        {/each}
      </div>
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
    <section class="rounded-3xl bg-[#0b0b0c] px-5 py-5 text-[#f5f5f7]">
      <p class="text-[32px] font-semibold tracking-tight tabular-nums">{figure.value}</p>
      <p class="mt-1 text-[14px]">{figure.label}</p>
      <p class="text-[12px] text-[#86868b]">{figure.note}</p>
    </section>
  {/each}
</div>

<section class="rounded-3xl bg-[#0b0b0c] px-5 py-6 text-[#f5f5f7] sm:px-7">
  <h2 class="text-center text-[26px] font-semibold tracking-tight sm:text-[32px]">ยอดขายสะสม</h2>
  <p class="mx-auto mt-2 max-w-lg text-center text-[14px] leading-relaxed text-[#86868b]">
    รวมจากออเดอร์ในช่วงเดียวกับตารางด้านบน จุดบนเส้นคือครั้งแรกที่ยอดถึงหลักพัน
  </p>
  <svg viewBox="0 0 {line.width} {line.height}" class="mt-4 w-full" role="img" aria-label="กราฟยอดขายสะสม">
    {#each line.grid as y, index (index)}
      <line x1={line.pad.l} x2={line.width - line.pad.r} {y} y2={y} stroke="#2c2c2e" stroke-width="1" />
      <text x={line.pad.l - 8} y={y + 4} fill="#86868b" font-size="11" text-anchor="end">
        {formatBaht(Math.round((line.max * index) / (line.grid.length - 1)))}
      </text>
    {/each}
    <path d={line.path} fill="none" stroke="#f5f5f7" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
    {#each model.milestones as mark (mark.amount)}
      {@const point = line.coords[mark.index]}
      <circle cx={point.x} cy={point.y} r="4" fill="#0b0b0c" stroke="#f5f5f7" stroke-width="2" />
      <text x={point.x} y={point.y - 10} fill="#f5f5f7" font-size="11" text-anchor="middle">{formatBaht(mark.amount)}</text>
    {/each}
    {#if line.coords.length}
      {@const last = line.coords[line.coords.length - 1]}
      <circle cx={last.x} cy={last.y} r="4" fill="#f5f5f7" />
    {/if}
  </svg>
</section>
