<script lang="ts">
  import ReceiptIcon from "@lucide/svelte/icons/receipt";
  import { api, errorMessage } from "$lib/api";
  import type { Order } from "$lib/types";
  import { formatBaht } from "$lib/utils";

  let orders = $state<Order[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  export async function refresh() {
    loading = true;
    error = null;
    try {
      orders = await api.get<Order[]>("/api/admin/orders");
    } catch (err) {
      error = errorMessage(err);
    } finally {
      loading = false;
    }
  }

  void refresh();

  const revenue = $derived(orders.reduce((sum, o) => sum + (o.total ?? 0), 0));
</script>

<p class="px-1 text-[13px] leading-relaxed text-muted-foreground">
  รายการนี้คือคำสั่งซื้อที่ลูกค้าเห็นในหน้าคำสั่งซื้อ รวมคีย์ที่ระบบออกให้หลังชำระเงิน
</p>
{#if error}
  <p class="rounded-2xl bg-card px-4 py-3 text-[13px] text-destructive">{error}</p>
{/if}

{#if orders.length}
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
    <div class="rounded-2xl bg-card p-4">
      <p class="text-[11px] text-muted-foreground">คำสั่งซื้อทั้งหมด</p>
      <p class="mt-1 text-[22px] font-bold tabular-nums">{orders.length}</p>
    </div>
    <div class="rounded-2xl bg-card p-4">
      <p class="text-[11px] text-muted-foreground">ยอดขายรวม</p>
      <p class="mt-1 text-[22px] font-bold tabular-nums">{formatBaht(revenue)}</p>
    </div>
  </div>
{/if}

{#if loading && !orders.length}
  <div class="h-64 animate-pulse rounded-2xl bg-card"></div>
{:else if orders.length}
  <div class="overflow-x-auto rounded-2xl bg-card shadow-[0_0_0_0.5px_var(--syncx-border)]">
    <table class="w-full min-w-[960px] text-[13px]">
      <thead class="border-b border-border text-left text-[11px] text-muted-foreground">
        <tr>
          <th class="px-4 py-2 font-normal">เลขออเดอร์</th>
          <th class="px-4 py-2 font-normal">ลูกค้า</th>
          <th class="px-4 py-2 font-normal">อีเมล</th>
          <th class="px-4 py-2 font-normal">สินค้า</th>
          <th class="px-4 py-2 font-normal">ตัวเลือก</th>
          <th class="px-4 py-2 text-right font-normal">จำนวน</th>
          <th class="px-4 py-2 text-right font-normal">ราคารวม</th>
          <th class="px-4 py-2 font-normal">License Key</th>
          <th class="px-4 py-2 text-right font-normal">วันที่ซื้อ</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border">
        {#each orders as order (order.id)}
          <tr>
            <td class="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">{order.id.split("-").slice(1).join("-")}</td>
            <td class="px-4 py-2.5">{order.user_name || "—"}</td>
            <td class="px-4 py-2.5 text-muted-foreground">{order.user_email || "—"}</td>
            <td class="px-4 py-2.5">{order.product_name}</td>
            <td class="px-4 py-2.5 text-muted-foreground">{order.tier_label}</td>
            <td class="px-4 py-2.5 text-right tabular-nums">{order.quantity}</td>
            <td class="px-4 py-2.5 text-right tabular-nums">{formatBaht(order.total)}</td>
            <td class="px-4 py-2.5"><code class="rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px] select-all">{order.code_key}</code></td>
            <td class="px-4 py-2.5 text-right whitespace-nowrap text-muted-foreground">{new Date(order.created_at).toLocaleString("th-TH")}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <div class="flex flex-col items-center gap-2 rounded-2xl bg-card px-6 py-14 text-center text-[13px] text-muted-foreground">
    <ReceiptIcon class="size-6" strokeWidth={1.5} />
    ยังไม่มีรายการสั่งซื้อใดๆ ในระบบ
  </div>
{/if}
