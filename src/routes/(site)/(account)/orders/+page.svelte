<script lang="ts">
  import { resolve } from "$app/paths";
  import CopyIcon from "@lucide/svelte/icons/copy";
  import { toast } from "svelte-sonner";
  import { api, errorMessage } from "$lib/api";
  import type { Order } from "$lib/types";
  import { formatBaht } from "$lib/utils";

  let orders = $state<Order[]>([]);
  let fetching = $state(true);
  let failed = $state("");
  let copiedId = $state<string | null>(null);

  async function load() {
    fetching = true;
    failed = "";
    try {
      orders = await api.get<Order[]>("/api/orders");
    } catch (err) {
      failed = errorMessage(err) || "โหลดคำสั่งซื้อไม่สำเร็จ";
    } finally {
      fetching = false;
    }
  }

  void load();

  const totalSpent = $derived(orders.reduce((sum, o) => sum + (o.total ?? 0), 0));

  async function copy(id: string, key: string) {
    await navigator.clipboard.writeText(key);
    copiedId = id;
    toast.success("คัดลอกคีย์แล้ว");
  }
</script>

<div class="flex items-end justify-between gap-4">
  <h2 class="section-title">คำสั่งซื้อ <span class="text-muted-foreground">({orders.length})</span></h2>
  <p class="text-sm text-muted-foreground">รวมยอดทั้งหมด <strong class="text-foreground tabular-nums">{formatBaht(totalSpent)}</strong></p>
</div>

{#if failed}
  <div class="tile mt-6 px-6 py-16 text-center">
    <p class="text-[17px] text-muted-foreground">{failed}</p>
    <button type="button" class="press link mt-3 text-[15px]" onclick={load}>ลองอีกครั้ง</button>
  </div>
{:else if fetching}
  <div class="mt-6 space-y-3">
    {#each Array(3) as _, i (i)}<div class="h-28 animate-pulse rounded-3xl bg-card"></div>{/each}
  </div>
{:else if orders.length}
  <ul class="mt-6 divide-y divide-border overflow-hidden rounded-[28px] bg-secondary">
    {#each orders as order (order.id)}
      <li class="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0">
          <h3 class="text-[17px] font-semibold">{order.product_name}</h3>
          <p class="mt-0.5 text-xs text-muted-foreground">
            {order.tier_label} · {order.quantity} ชิ้น · {new Date(order.created_at).toLocaleString("th-TH")}
          </p>
          <button
            type="button"
            class="press mt-3 inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 font-mono text-sm tracking-wider transition-colors hover:bg-foreground/10"
            onclick={() => copy(order.id, order.code_key)}
            aria-label="คัดลอกคีย์"
          >
            {copiedId === order.id ? "คัดลอกแล้ว" : order.code_key}
            <CopyIcon class="size-3.5 text-muted-foreground" />
          </button>
        </div>
        <div class="shrink-0 sm:text-right">
          <p class="text-xs text-muted-foreground">ยอดชำระ</p>
          <p class="text-[19px] font-semibold tabular-nums">{formatBaht(order.total ?? 0)}</p>
        </div>
      </li>
    {/each}
  </ul>
{:else}
  <div class="tile mt-6 px-6 py-16 text-center">
    <p class="text-[17px] text-muted-foreground">ยังไม่มีประวัติการสั่งซื้อ</p>
    <a href={resolve("/store")} class="link mt-3 text-[15px]">เริ่มเลือกซื้อ</a>
  </div>
{/if}
