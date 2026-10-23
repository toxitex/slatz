<script lang="ts">
  import CopyIcon from "@lucide/svelte/icons/copy";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import WalletIcon from "@lucide/svelte/icons/wallet";
  import { toast } from "svelte-sonner";
  import { api, errorMessage } from "$lib/api";
  import { Button } from "$lib/components/ui/button";
  import type { Voucher } from "$lib/types";
  import { cn, formatBaht } from "$lib/utils";
  import SettingsGroup from "./SettingsGroup.svelte";
  import SettingsRow from "./SettingsRow.svelte";

  type Filter = "all" | "available" | "used";

  let vouchers = $state<Voucher[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let filter = $state<Filter>("available");

  let amount = $state(100);
  let count = $state(1);
  let prefix = $state("TOPUP");
  let customCode = $state("");
  let creating = $state(false);
  let created = $state<string[]>([]);

  const visible = $derived(
    vouchers.filter((v) => (filter === "all" ? true : filter === "used" ? v.is_used : !v.is_used)),
  );
  const availableValue = $derived(vouchers.filter((v) => !v.is_used).reduce((sum, v) => sum + v.amount, 0));

  export async function refresh() {
    loading = true;
    try {
      vouchers = await api.get<Voucher[]>("/api/vouchers");
      error = null;
    } catch (err) {
      error = errorMessage(err);
    } finally {
      loading = false;
    }
  }

  void refresh();

  async function create(event: SubmitEvent) {
    event.preventDefault();
    if (!(amount > 0)) {
      toast.error("กรุณาระบุจำนวนเงิน");
      return;
    }
    creating = true;
    try {
      const body = customCode.trim()
        ? { amount, code: customCode.trim() }
        : { amount, count: Math.min(100, Math.max(1, Math.round(count))), prefix: prefix.trim() || undefined };
      const res = await api.post<{ codes: string[] }>("/api/vouchers", body);
      created = res.codes;
      customCode = "";
      toast.success(`สร้างบัตรเติมเงิน ${res.codes.length} ใบแล้ว`);
      filter = "available";
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      creating = false;
    }
  }

  async function copy(text: string, label = "คัดลอกแล้ว") {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  }

  async function remove(voucher: Voucher) {
    try {
      await api.delete(`/api/vouchers/${voucher.id}`);
      vouchers = vouchers.filter((v) => v.id !== voucher.id);
      toast("ลบบัตรแล้ว");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const inputClass =
    "w-full max-w-[12rem] rounded-md bg-transparent px-1 py-1 text-right text-muted-foreground outline-none focus:bg-secondary focus:text-foreground";
</script>

<form onsubmit={create}>
  <SettingsGroup title="สร้างบัตรเติมเงิน" description="ลูกค้านำรหัสไปเติมเงินที่หน้า เติมเงิน">
    <SettingsRow label="มูลค่าต่อใบ (บาท)">
      <input type="number" min="1" bind:value={amount} aria-label="มูลค่าต่อใบ" class={inputClass} />
    </SettingsRow>
    <SettingsRow label="จำนวนใบ" hint="สูงสุด 100 ใบต่อครั้ง">
      <input type="number" min="1" max="100" bind:value={count} disabled={!!customCode.trim()} aria-label="จำนวนใบ" class={inputClass} />
    </SettingsRow>
    <SettingsRow label="คำนำหน้ารหัส">
      <input bind:value={prefix} disabled={!!customCode.trim()} aria-label="คำนำหน้ารหัส" class={cn(inputClass, "uppercase")} />
    </SettingsRow>
    <SettingsRow label="หรือกำหนดรหัสเอง" hint="สร้าง 1 ใบด้วยรหัสนี้">
      <input bind:value={customCode} placeholder="เช่น WELCOME500" aria-label="รหัสกำหนดเอง" class={cn(inputClass, "uppercase")} />
    </SettingsRow>
    <div class="flex items-center justify-between gap-3 px-4 py-3">
      <span class="text-xs text-muted-foreground">
        รวม {formatBaht(amount * (customCode.trim() ? 1 : Math.max(1, count || 1)))}
      </span>
      <Button type="submit" size="sm" disabled={creating}>{creating ? "กำลังสร้าง..." : "สร้างบัตร"}</Button>
    </div>
  </SettingsGroup>
</form>

{#if created.length}
  <SettingsGroup title={`สร้างล่าสุด (${created.length} ใบ)`}>
    {#snippet actions()}
      <Button variant="ghost" size="sm" onclick={() => copy(created.join("\n"), "คัดลอกรหัสทั้งหมดแล้ว")}>
        <CopyIcon />คัดลอกทั้งหมด
      </Button>
    {/snippet}
    <div class="stagger-in flex flex-wrap gap-2 p-4">
      {#each created as code, i (code)}
        <button
          type="button"
          class="rounded-full bg-secondary px-3 py-1 font-mono text-xs tracking-wider transition-colors hover:bg-foreground hover:text-background"
          style="--i: {i}"
          onclick={() => copy(code)}
        >
          {code}
        </button>
      {/each}
    </div>
  </SettingsGroup>
{/if}

<section class="flex flex-col gap-2">
  <div class="flex flex-wrap items-end justify-between gap-3 px-1">
    <div>
      <h3 class="text-[13px] font-semibold">บัตรทั้งหมด</h3>
      <p class="text-xs text-muted-foreground">พร้อมใช้ {vouchers.filter((v) => !v.is_used).length} ใบ · มูลค่า {formatBaht(availableValue)}</p>
    </div>
    <div class="inline-flex rounded-full bg-foreground/[0.06] p-0.5 text-xs">
      {#each [{ key: "available", label: "พร้อมใช้" }, { key: "used", label: "ใช้แล้ว" }, { key: "all", label: "ทั้งหมด" }] as option (option.key)}
        <button
          type="button"
          class={cn(
            "rounded-full px-3 py-1 transition-colors",
            filter === option.key ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
          onclick={() => (filter = option.key as Filter)}
        >
          {option.label}
        </button>
      {/each}
    </div>
  </div>

  {#if error}
    <p class="rounded-2xl bg-card px-4 py-3 text-[13px] text-destructive">{error}</p>
  {:else if loading && !vouchers.length}
    <div class="h-40 animate-pulse rounded-2xl bg-card"></div>
  {:else if visible.length}
    <ul class="divide-y divide-border overflow-hidden rounded-2xl bg-card text-[13px] shadow-[0_0_0_0.5px_var(--syncx-border)]">
      {#each visible as voucher (voucher.id)}
        <li class="flex items-center gap-3 px-4 py-2.5">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 font-mono tracking-wider hover:text-muted-foreground"
            onclick={() => copy(voucher.code)}
            aria-label={`คัดลอก ${voucher.code}`}
          >
            {voucher.code}<CopyIcon class="size-3 text-muted-foreground" />
          </button>
          <span class="ml-auto shrink-0 tabular-nums">{formatBaht(voucher.amount)}</span>
          <span
            class={cn(
              "w-36 shrink-0 truncate text-right text-[11px]",
              voucher.is_used ? "text-muted-foreground" : "font-medium",
            )}
            title={voucher.used_by_email ?? undefined}
          >
            {voucher.is_used ? `ใช้แล้ว · ${voucher.used_by_email ?? "—"}` : "พร้อมใช้"}
          </span>
          <button
            type="button"
            class="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive disabled:invisible"
            aria-label={`ลบ ${voucher.code}`}
            disabled={voucher.is_used}
            onclick={() => remove(voucher)}
          >
            <Trash2Icon class="size-3.5" />
          </button>
        </li>
      {/each}
    </ul>
  {:else}
    <div class="flex flex-col items-center gap-2 rounded-2xl bg-card px-6 py-12 text-center text-[13px] text-muted-foreground">
      <WalletIcon class="size-6" strokeWidth={1.5} />
      ไม่มีบัตรในหมวดนี้
    </div>
  {/if}
</section>
