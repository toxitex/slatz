<script lang="ts">
  import { resolve } from "$app/paths";
  import ShoppingBagIcon from "@lucide/svelte/icons/shopping-bag";
  import { tierRange } from "$lib/stores/products.svelte";
  import type { SyncXProduct } from "$lib/types";
  import { cn, formatBaht } from "$lib/utils";

  let {
    product,
    buttonText,
    class: className = "",
  }: { product: SyncXProduct; buttonText: string; class?: string } = $props();

  let imageFailed = $state(false);

  const range = $derived(tierRange(product.tiers ?? []));
  const priceLabel = $derived(
    range ? (range.min === range.max ? formatBaht(range.min) : `เริ่มต้น ${formatBaht(range.min)}`) : product.price,
  );
  const soldOut = $derived(product.status === "out_of_stock");
</script>

<a
  href={resolve(`/product/${product.id}`)}
  class={cn(
    "group flex flex-col overflow-hidden rounded-3xl bg-card transition-[transform,box-shadow] duration-500 ease-apple hover:-translate-y-1 hover:shadow-float",
    className,
  )}
  aria-label={product.name}
>
  <div class="relative grid aspect-[4/3] place-items-center overflow-hidden bg-muted">
    {#if product.imageUrl && !imageFailed}
      <img
        src={product.imageUrl}
        alt={product.name}
        loading="lazy"
        class="size-full object-cover transition-transform duration-700 ease-apple group-hover:scale-[1.03]"
        onerror={() => (imageFailed = true)}
      />
    {:else}
      <ShoppingBagIcon class="size-10 text-muted-foreground/50" strokeWidth={1.25} />
    {/if}
    {#if soldOut}
      <span class="absolute top-3 left-3 rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur">
        สินค้าหมดชั่วคราว
      </span>
    {/if}
  </div>
  <div class="flex flex-1 flex-col gap-1 p-5">
    {#if product.category}
      <span class="text-[11px] font-semibold tracking-wide text-[#bf4800] uppercase">{product.category}</span>
    {/if}
    <h3 class="line-clamp-2 text-[17px] leading-snug font-semibold">{product.name}</h3>
    <div class="mt-auto flex items-end justify-between gap-2 pt-3">
      <span class="text-sm text-foreground/80">{priceLabel}</span>
      <span
        class="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100 max-md:hidden"
      >
        {buttonText}
      </span>
    </div>
  </div>
</a>
