<script lang="ts">
  import { resolve } from "$app/paths";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import CheckIcon from "@lucide/svelte/icons/check";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import MinusIcon from "@lucide/svelte/icons/minus";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import ShieldCheckIcon from "@lucide/svelte/icons/shield-check";
  import ShoppingBagIcon from "@lucide/svelte/icons/shopping-bag";
  import ZapIcon from "@lucide/svelte/icons/zap";
  import { toast } from "svelte-sonner";
  import { slide } from "svelte/transition";
  import { api, errorMessage } from "$lib/api";
  import { glassPointer } from "$lib/attachments";
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import { getStores } from "$lib/stores";
  import { tierRange, totalStock } from "$lib/stores/products.svelte";
  import type { Coupon, Order } from "$lib/types";
  import { cn, formatBaht } from "$lib/utils";

  const { products, coupons, auth } = getStores();
  products.ensureLoaded();
  coupons.ensureLoaded();

  let pickedTierId = $state<string | null>(null);
  let quantity = $state(1);
  let couponCode = $state("");
  let appliedCoupon = $state<Coupon | null>(null);
  let descriptionOpen = $state(true);
  let buying = $state(false);
  let order = $state<Order | null>(null);

  const product = $derived(products.products.find((p) => p.id === page.params.id) ?? null);
  const tiers = $derived(product?.tiers ?? []);
  const defaultTierId = $derived((tiers.find((t) => t.stock > 0) ?? tiers[0])?.id ?? null);
  const selectedTier = $derived(tiers.find((t) => t.id === (pickedTierId ?? defaultTierId)) ?? null);
  const subtotal = $derived(selectedTier ? selectedTier.price * quantity : 0);
  const discount = $derived.by(() => {
    if (!appliedCoupon) return 0;
    return appliedCoupon.discountType === "percent"
      ? Math.round((subtotal * appliedCoupon.discountValue) / 100)
      : Math.min(appliedCoupon.discountValue, subtotal);
  });
  const total = $derived(Math.max(0, subtotal - discount));
  const range = $derived(tierRange(tiers));
  const stock = $derived(totalStock(tiers));

  const unavailable = $derived(product?.status === "out_of_stock");
  const buyLabel = $derived(
    buying
      ? "กำลังดำเนินการ..."
      : unavailable
        ? "สินค้าหมดชั่วคราว"
      : !selectedTier
        ? "กรุณาเลือกตัวเลือก"
        : selectedTier.stock <= 0
          ? "สินค้าตัวเลือกนี้หมด"
          : "ซื้อเลย",
  );

  function applyCoupon() {
    const code = couponCode.trim();
    if (!code) {
      toast("กรุณาใส่โค้ดส่วนลด");
      return;
    }
    const found = coupons.validate(code);
    appliedCoupon = found;
    toast(found ? `ใช้โค้ด ${found.code} แล้ว` : "โค้ดส่วนลดไม่ถูกต้องหรือหมดอายุ");
  }

  function clearCoupon() {
    appliedCoupon = null;
    couponCode = "";
  }

  async function buy() {
    if (!auth.user) {
      toast.error("กรุณาเข้าสู่ระบบก่อนซื้อสินค้า");
      await goto(resolve("/login"));
      return;
    }
    if (!product || !selectedTier) {
      toast("กรุณาเลือกตัวเลือกสินค้า");
      return;
    }
    if (selectedTier.stock <= 0) {
      toast("สินค้าตัวเลือกนี้หมดชั่วคราว");
      return;
    }
    buying = true;
    try {
      const res = await api.post<{ success: boolean; order: Order }>("/api/checkout", {
        productId: product.id,
        tierId: selectedTier.id,
        quantity,
        couponCode: appliedCoupon?.code,
      });
      if (res.success) {
        order = res.order;
        toast.success("สั่งซื้อสินค้าสำเร็จ!");
        await Promise.all([auth.refresh(), products.refresh()]);
      }
    } catch (err) {
      toast.error(errorMessage(err) || "สั่งซื้อไม่สำเร็จ");
    } finally {
      buying = false;
    }
  }

  function closeOrder() {
    order = null;
    void goto(resolve("/orders"));
  }
</script>

{#if products.loading && !product}
  <div class="grid flex-1 place-items-center py-32 text-muted-foreground">
    <ShoppingBagIcon class="size-8 animate-pulse" strokeWidth={1.25} />
    <p class="mt-3 text-sm">กำลังโหลดข้อมูลสินค้า...</p>
  </div>
{:else if !product}
  <section class="container-apple py-32 text-center">
    <h1 class="display text-[40px]">ไม่พบสินค้านี้</h1>
    <p class="mt-3 text-[17px] text-muted-foreground">{products.error ?? "สินค้าอาจถูกลบหรือยังไม่ได้เผยแพร่"}</p>
    <Button href={resolve("/store")} size="lg" class="mt-8">กลับไปยังร้านค้า</Button>
  </section>
{:else}
  <div class="sticky top-[68px] z-30 px-3">
    <div class="liquid-glass mx-auto flex h-11 max-w-[880px] items-center justify-between gap-4 rounded-full pr-1.5 pl-5" {@attach glassPointer}>
      <p class="truncate text-[15px] font-semibold tracking-tight">{product.name}</p>
      <div class="flex shrink-0 items-center gap-3">
        <span class="text-xs text-muted-foreground max-sm:hidden">
          {range ? (range.min === range.max ? formatBaht(range.min) : `${formatBaht(range.min)} – ${formatBaht(range.max)}`) : product.price}
        </span>
        <Button size="sm" class="h-8 px-4" onclick={() => document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth", block: "center" })}>
          ซื้อ
        </Button>
      </div>
    </div>
  </div>

  <section class="container-wide pt-10 pb-24">
    <nav class="mb-6 flex items-center gap-1 text-xs text-muted-foreground" aria-label="Breadcrumb">
      <a href={resolve("/store")} class="hover:text-foreground">ร้านค้า</a>
      <ChevronRightIcon class="size-3" />
      <a href={resolve(`/category/${encodeURIComponent(product.category)}`)} class="hover:text-foreground">{product.category}</a>
      <ChevronRightIcon class="size-3" />
      <span class="truncate text-foreground">{product.name}</span>
    </nav>

    <article class="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
      <div class="lg:sticky lg:top-36 lg:self-start">
        <div class="spotlight group grid aspect-square place-items-center overflow-hidden rounded-[32px] bg-card [--spot-color:#ffffff]" {@attach glassPointer}>
          {#if product.imageUrl}
            <img src={product.imageUrl} alt={product.name} class="size-full object-cover transition-transform duration-[1200ms] ease-apple group-hover:scale-[1.03]" />
          {:else}
            <ShoppingBagIcon class="size-16 text-muted-foreground/40" strokeWidth={1} />
          {/if}
        </div>
        <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div class="tile flex items-center gap-3 p-4">
            <ZapIcon class="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
            <span>ได้รับสินค้าทันทีหลังชำระเงิน</span>
          </div>
          <div class="tile flex items-center gap-3 p-4">
            <ShieldCheckIcon class="size-5 shrink-0 text-foreground" strokeWidth={1.75} />
            <span>ปลอดภัย ตรวจสอบได้</span>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-8">
        <header>
          <p class="text-sm font-semibold text-muted-foreground">{product.category || "ทั่วไป"}</p>
          <h1 class="display mt-1 text-[36px] sm:text-[48px]">ซื้อ {product.name}</h1>
          <div class="mt-3 flex flex-wrap gap-2 text-xs">
            <span
              class={cn(
                "rounded-full px-2.5 py-1",
                product.status === "active" ? "bg-foreground text-background" : "bg-secondary text-muted-foreground",
              )}
            >
              {product.status === "active" ? "เปิดขาย" : "หมดชั่วคราว"}
            </span>
            <span class="rounded-full bg-secondary px-2.5 py-1 text-muted-foreground">คงเหลือ {stock} ชิ้น</span>
            <span class="rounded-full bg-secondary px-2.5 py-1 text-muted-foreground">ขายแล้ว {product.totalSold ?? 0} ชิ้น</span>
          </div>
        </header>

        {#if tiers.length}
          <section aria-labelledby="tiers-heading">
            <h2 id="tiers-heading" class="text-[21px] font-semibold tracking-tight">
              ตัวเลือก. <span class="text-muted-foreground">เลือกแบบที่ใช่สำหรับคุณ</span>
            </h2>
            <div class="mt-4 grid gap-3" role="radiogroup">
              {#each tiers as tier (tier.id)}
                {@const selected = tier.id === selectedTier?.id}
                {@const soldOut = tier.stock <= 0}
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={soldOut}
                  class={cn(
                    "flex items-center justify-between gap-4 rounded-2xl border bg-card p-5 text-left transition-[border-color,box-shadow] duration-200",
                    selected ? "border-primary shadow-[0_0_0_1px_var(--syncx-button)]" : "border-foreground/15 hover:border-foreground/40",
                    soldOut && "cursor-not-allowed opacity-45",
                  )}
                  onclick={() => (pickedTierId = tier.id)}
                >
                  <span>
                    <span class="block text-[17px] font-semibold">{tier.label || "ตัวเลือก"}</span>
                    <span class="mt-0.5 block text-xs text-muted-foreground">
                      {soldOut ? "สินค้าหมด" : `คงเหลือ ${tier.stock} ชิ้น`}
                    </span>
                  </span>
                  <span class="text-[15px] tabular-nums">{formatBaht(tier.price)}</span>
                </button>
              {/each}
            </div>
          </section>
        {:else}
          <section>
            <h2 class="text-[21px] font-semibold tracking-tight">ราคา</h2>
            <p class="display mt-2 text-[32px]">{product.price || "ติดต่อร้านค้า"}</p>
          </section>
        {/if}

        <section class="grid gap-3 sm:grid-cols-2">
          <div class="tile p-5">
            <p class="text-xs font-semibold text-muted-foreground">จำนวน</p>
            <div class="mt-3 flex items-center justify-between">
              <div class="flex items-center rounded-full bg-secondary p-1">
                <button
                  type="button"
                  class="grid size-8 place-items-center rounded-full transition-colors hover:bg-card"
                  aria-label="ลดจำนวน"
                  onclick={() => (quantity = Math.max(1, quantity - 1))}
                >
                  <MinusIcon class="size-3.5" />
                </button>
                <span class="w-9 text-center text-[15px] font-semibold tabular-nums">{quantity}</span>
                <button
                  type="button"
                  class="grid size-8 place-items-center rounded-full transition-colors hover:bg-card"
                  aria-label="เพิ่มจำนวน"
                  onclick={() => (quantity += 1)}
                >
                  <PlusIcon class="size-3.5" />
                </button>
              </div>
              <span class="text-right">
                <span class="block text-[11px] text-muted-foreground">ยอดรวมย่อย</span>
                <span class="text-sm font-semibold tabular-nums">{formatBaht(subtotal)}</span>
              </span>
            </div>
          </div>

          <div class="tile p-5">
            <p class="text-xs font-semibold text-muted-foreground">โค้ดส่วนลด</p>
            <div class="mt-3 flex items-center gap-2">
              <input
                bind:value={couponCode}
                placeholder="กรอกโค้ดส่วนลด"
                class="h-10 min-w-0 flex-1 rounded-full bg-secondary px-4 text-sm uppercase outline-none placeholder:normal-case placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                onkeydown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyCoupon();
                  }
                }}
              />
              {#if appliedCoupon}
                <Button variant="ghost" class="h-10" onclick={clearCoupon}>ยกเลิก</Button>
              {:else}
                <Button variant="secondary" class="h-10" onclick={applyCoupon}>ใช้โค้ด</Button>
              {/if}
            </div>
            {#if appliedCoupon}
              <p class="mt-2 flex items-center gap-1 text-xs text-foreground" transition:slide={{ duration: 200 }}>
                <CheckIcon class="size-3.5" /> ใช้โค้ด <strong>{appliedCoupon.code}</strong> ลด
                {appliedCoupon.discountType === "percent" ? `${appliedCoupon.discountValue}%` : formatBaht(appliedCoupon.discountValue)}
              </p>
            {/if}
          </div>
        </section>

        <section id="checkout" class="tile border-beam p-6 [--beam-duration:8s]">
          <div class="flex items-end justify-between gap-4">
            <div>
              <p class="text-xs font-semibold text-muted-foreground">ยอดชำระสุทธิ</p>
              <p class="mt-1 flex items-baseline gap-2">
                <span class="display text-[32px] tabular-nums">{formatBaht(total)}</span>
                {#if discount > 0}
                  <span class="text-sm text-muted-foreground line-through">{formatBaht(subtotal)}</span>
                {/if}
              </p>
            </div>
            {#if discount > 0}
              <span class="rounded-full bg-foreground px-2.5 py-1 text-xs text-background">ส่วนลด −{formatBaht(discount)}</span>
            {/if}
          </div>
          <Button
            size="lg"
            class="mt-5 w-full"
            disabled={buying || unavailable || !selectedTier || selectedTier.stock <= 0}
            onclick={buy}
          >
            {buyLabel}
          </Button>
          {#if !auth.user && !auth.loading}
            <p class="mt-3 text-center text-xs text-muted-foreground">
              ต้อง<a href={resolve("/login")} class="text-link hover:underline">เข้าสู่ระบบ</a>ก่อนสั่งซื้อ
            </p>
          {/if}
        </section>

        <section class="border-t border-border pt-2">
          <button
            type="button"
            class="flex w-full items-center justify-between py-4 text-left text-[19px] font-semibold tracking-tight"
            aria-expanded={descriptionOpen}
            onclick={() => (descriptionOpen = !descriptionOpen)}
          >
            รายละเอียดสินค้า
            <ChevronDownIcon class={cn("size-5 transition-transform duration-300", descriptionOpen && "rotate-180")} />
          </button>
          {#if descriptionOpen}
            <p class="pb-4 text-[15px] leading-relaxed whitespace-pre-line text-foreground/80" transition:slide={{ duration: 250 }}>
              {product.description || "ยังไม่มีคำอธิบายสินค้า"}
            </p>
          {/if}
        </section>
      </div>
    </article>
  </section>
{/if}

<Dialog.Root open={order !== null} onOpenChange={(open) => !open && closeOrder()}>
  <Dialog.Content class="sm:max-w-md">
    {#if order}
      <div class="flex flex-col items-center pt-2 text-center">
        <span class="grid size-14 place-items-center rounded-full bg-foreground text-background">
          <CheckIcon class="size-7" strokeWidth={2.5} />
        </span>
        <Dialog.Title class="display mt-4 text-[28px]">ทำรายการสำเร็จ</Dialog.Title>
        <Dialog.Description class="mt-1 text-sm text-muted-foreground">
          ขอบคุณสำหรับการสั่งซื้อ ระบบได้ออกคีย์การใช้งานของคุณแล้ว
        </Dialog.Description>
      </div>
      <div class="rounded-2xl bg-secondary p-4 text-center">
        <p class="text-[11px] text-muted-foreground">คีย์การใช้งานของคุณ (LICENSE KEY)</p>
        <code class="mt-1 block font-mono text-lg font-semibold tracking-wider select-all">{order.code_key}</code>
      </div>
      <dl class="divide-y divide-border text-sm">
        <div class="flex justify-between py-2"><dt class="text-muted-foreground">สินค้า</dt><dd>{order.product_name}</dd></div>
        <div class="flex justify-between py-2"><dt class="text-muted-foreground">ตัวเลือก</dt><dd>{order.tier_label}</dd></div>
        <div class="flex justify-between py-2"><dt class="text-muted-foreground">จำนวน</dt><dd>{order.quantity} ชิ้น</dd></div>
        <div class="flex justify-between py-2">
          <dt class="text-muted-foreground">ยอดชำระสุทธิ</dt>
          <dd class="font-semibold">{formatBaht(order.total)}</dd>
        </div>
      </dl>
      <Button size="lg" class="w-full" onclick={closeOrder}>ดูประวัติการสั่งซื้อ</Button>
    {/if}
  </Dialog.Content>
</Dialog.Root>
