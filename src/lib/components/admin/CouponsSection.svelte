<script lang="ts">
  import TicketIcon from "@lucide/svelte/icons/ticket";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import * as Select from "$lib/components/ui/select";
  import { Switch } from "$lib/components/ui/switch";
  import { getStores } from "$lib/stores";
  import type { Coupon } from "$lib/types";

  const { coupons } = getStores();

  const typeOptions = [
    { value: "percent", label: "% เปอร์เซ็นต์" },
    { value: "fixed", label: "฿ จำนวนคงที่" },
  ];
</script>

{#if coupons.coupons.length}
  <div class="overflow-hidden rounded-2xl bg-card shadow-[0_0_0_0.5px_var(--syncx-border)]">
    <div class="hidden grid-cols-[1.4fr_1.2fr_0.8fr_4rem_2rem] gap-3 border-b border-border px-4 py-2 text-[11px] text-muted-foreground md:grid">
      <span>โค้ด</span><span>ประเภท</span><span class="text-right">มูลค่าส่วนลด</span><span class="text-center">ใช้งาน</span><span></span>
    </div>
    <ul class="divide-y divide-border">
      {#each coupons.coupons as coupon (coupon.id)}
        <li class="grid grid-cols-2 items-center gap-3 px-4 py-2.5 text-[13px] md:grid-cols-[1.4fr_1.2fr_0.8fr_4rem_2rem]">
          <input
            value={coupon.code}
            aria-label="โค้ด"
            class="col-span-2 rounded-md bg-secondary px-2.5 py-1.5 font-mono tracking-wider uppercase outline-none md:col-span-1"
            onchange={(e) => coupons.update(coupon.id, { code: e.currentTarget.value.toUpperCase() })}
          />
          <Select.Root
            type="single"
            value={coupon.discountType}
            onValueChange={(value) => coupons.update(coupon.id, { discountType: value as Coupon["discountType"] })}
          >
            <Select.Trigger size="sm" class="h-8 w-full rounded-lg border-0 bg-secondary">
              {typeOptions.find((o) => o.value === coupon.discountType)?.label}
            </Select.Trigger>
            <Select.Content>
              {#each typeOptions as option (option.value)}
                <Select.Item value={option.value} label={option.label} />
              {/each}
            </Select.Content>
          </Select.Root>
          <input
            type="number"
            min="0"
            value={coupon.discountValue}
            aria-label="มูลค่าส่วนลด"
            class="rounded-md bg-secondary px-2.5 py-1.5 text-right outline-none"
            onchange={(e) => coupons.update(coupon.id, { discountValue: Number(e.currentTarget.value) || 0 })}
          />
          <span class="flex justify-start md:justify-center">
            <Switch
              checked={coupon.active}
              onCheckedChange={(active) => coupons.update(coupon.id, { active })}
              aria-label="เปิดใช้งาน"
            />
          </span>
          <button
            type="button"
            class="grid size-7 place-items-center justify-self-end rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive"
            aria-label={`ลบ ${coupon.code}`}
            onclick={() => coupons.remove(coupon.id)}
          >
            <Trash2Icon class="size-3.5" />
          </button>
        </li>
      {/each}
    </ul>
  </div>
{:else}
  <div class="flex flex-col items-center gap-2 rounded-2xl bg-card px-6 py-14 text-center text-[13px] text-muted-foreground">
    <TicketIcon class="size-6" strokeWidth={1.5} />
    ยังไม่มีคูปองส่วนลดในระบบ
  </div>
{/if}
