<script lang="ts">
  import { resolve } from "$app/paths";
  import ShoppingBagIcon from "@lucide/svelte/icons/shopping-bag";
  import { totalStock } from "$lib/stores/products.svelte";
  import type { SyncXProduct } from "$lib/types";
  import { cn } from "$lib/utils";

  let {
    product,
    buttonText,
    label = "",
    class: className = "",
  }: { product: SyncXProduct; buttonText: string; label?: string; class?: string } = $props();

  let imageFailed = $state(false);

  const eyebrow = $derived(label || product.category);
  const ready = $derived(
    product.status !== "out_of_stock" && (product.tiers?.length ? totalStock(product.tiers) > 0 : true),
  );
</script>

<a
  href={resolve(`/product/${product.id}`)}
  class={cn(
    "group flex flex-col rounded-[28px] bg-card p-5 shadow-float transition-transform duration-500 ease-apple hover:-translate-y-1 active:scale-[0.985] active:duration-100",
    className,
  )}
  aria-label={product.name}
>
  {#if eyebrow}
    <p class="text-[13px] font-semibold" style:color="var(--syncx-warn)">{eyebrow}</p>
  {/if}
  <h3 class="mt-2 line-clamp-2 text-[19px] leading-tight font-semibold tracking-tight">{product.name}</h3>
  <p class="mt-1 text-[13px] font-medium" style:color={ready ? "var(--syncx-ok)" : "var(--syncx-warn)"}>
    {ready ? "พร้อมส่ง" : "สินค้าหมด"}
  </p>
  <div class="mt-3 grid min-h-[148px] flex-1 place-items-center px-3 py-2">
    {#if product.imageUrl && !imageFailed}
      <img
        src={product.imageUrl}
        alt=""
        loading="lazy"
        class="max-h-[168px] w-full object-contain transition-transform duration-700 ease-apple group-hover:scale-[1.03]"
        onerror={() => (imageFailed = true)}
      />
    {:else}
      <ShoppingBagIcon class="size-10 text-muted-foreground/40" strokeWidth={1.25} />
    {/if}
  </div>
  <span
    class="mt-4 inline-flex h-9 w-fit items-center rounded-full bg-[var(--syncx-action)] px-4 text-[15px] font-medium text-white"
  >
    {buttonText}
  </span>
</a>
