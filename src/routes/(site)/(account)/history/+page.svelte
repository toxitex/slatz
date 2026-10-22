<script lang="ts">
  import { resolve } from "$app/paths";
  import { api } from "$lib/api";
  import type { Topup } from "$lib/types";
  import { formatBaht } from "$lib/utils";

  let topups = $state<Topup[]>([]);
  let fetching = $state(true);

  api
    .get<Topup[]>("/api/topups")
    .then((rows) => (topups = rows))
    .catch(console.error)
    .finally(() => (fetching = false));

  const totalCredited = $derived(topups.reduce((sum, t) => sum + (t.amount ?? 0), 0));
</script>

<div class="flex items-end justify-between gap-4">
  <h2 class="display text-[28px]">ประวัติเติมเงิน <span class="text-muted-foreground">({topups.length})</span></h2>
  <p class="text-sm text-muted-foreground">รวมเติมทั้งหมด <strong class="text-foreground tabular-nums">{formatBaht(totalCredited)}</strong></p>
</div>

{#if fetching}
  <div class="mt-6 h-48 animate-pulse rounded-3xl bg-card"></div>
{:else if topups.length}
  <ul class="tile mt-6 divide-y divide-border px-6">
    {#each topups as topup (topup.id)}
      <li class="flex items-center justify-between gap-4 py-4">
        <div class="min-w-0">
          <p class="text-[15px] font-medium">เติมเครดิตด้วยรหัสคูปอง</p>
          <p class="mt-0.5 text-xs text-muted-foreground">
            <code class="font-mono">{topup.code}</code> · {new Date(topup.used_at).toLocaleString("th-TH")}
          </p>
        </div>
        <span class="shrink-0 text-[17px] font-semibold text-foreground tabular-nums">+{formatBaht(topup.amount)}</span>
      </li>
    {/each}
  </ul>
{:else}
  <div class="tile mt-6 px-6 py-16 text-center">
    <p class="text-[17px] text-muted-foreground">ยังไม่มีประวัติเติมเงิน</p>
    <a href={resolve("/topup")} class="link mt-3 text-[15px]">เติมเงินตอนนี้</a>
  </div>
{/if}
