<script lang="ts">
  import { resolve } from "$app/paths";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import ShoppingBagIcon from "@lucide/svelte/icons/shopping-bag";
  import { countUp, reveal, scrollProgress, segmentWords } from "$lib/attachments";
  import { Button } from "$lib/components/ui/button";
  import { getStores } from "$lib/stores";
  import { tierRange } from "$lib/stores/products.svelte";
  import type { SyncXProduct } from "$lib/types";
  import { cn, formatBaht } from "$lib/utils";

  const { site, products, categories, ui } = getStores();
  products.ensureLoaded();
  categories.ensureLoaded();

  const config = $derived(site.config);
  const stats = $derived([
    { label: config.stats.usersLabel, value: config.stats.users, unit: config.stats.usersUnit },
    { label: config.stats.productsLabel, value: config.stats.products, unit: config.stats.productsUnit },
    { label: config.stats.stockLabel, value: config.stats.stock, unit: config.stats.stockUnit },
    { label: config.stats.soldLabel, value: config.stats.sold, unit: config.stats.soldUnit },
  ]);
  const visible = $derived(products.products.filter((p) => p.status !== "hidden"));
  const featured = $derived(visible.slice(0, 2));
  const tiles = $derived(visible.slice(2, 6));
  const shelf = $derived(categories.categories.filter((c) => c.isActive).slice(0, 8));
  const showcase = $derived(visible.filter((p) => p.imageUrl).slice(0, 3));
  const words = $derived(segmentWords(config.announcementBody));

  function tagline(product: SyncXProduct) {
    return product.description.split("\n").find((line) => line.trim()) || product.category;
  }

  function priceLine(product: SyncXProduct) {
    const range = tierRange(product.tiers ?? []);
    return range ? `เริ่มต้น ${formatBaht(range.min)}` : product.price;
  }
</script>

{#snippet links(product: SyncXProduct, dark: boolean)}
  <div class="mt-5 flex flex-wrap items-center justify-center gap-3">
    <Button href={resolve(`/product/${product.id}`)} class="h-10 px-5 text-[15px]">เรียนรู้เพิ่มเติม</Button>
    <Button
      href={resolve(`/product/${product.id}`)}
      variant="outline"
      class={cn(
        "h-10 border-primary bg-transparent px-5 text-[15px] text-primary hover:bg-primary hover:text-primary-foreground",
        dark && "border-[#2997ff] text-[#2997ff] hover:bg-[#2997ff]",
      )}
    >
      ซื้อ
    </Button>
  </div>
{/snippet}

{#snippet media(product: SyncXProduct, className: string)}
  {#if product.imageUrl}
    <img src={product.imageUrl} alt={product.name} loading="lazy" class={cn("object-cover", className)} />
  {:else}
    <div class={cn("grid place-items-center bg-white/5", className)}>
      <ShoppingBagIcon class="size-14 opacity-30" strokeWidth={1} />
    </div>
  {/if}
{/snippet}

<div class="bg-card py-2.5 text-center text-sm text-foreground/80">
  <span>{config.announcementTitle}</span>
  <a href={resolve("/store")} class="link ml-1">เลือกซื้อเลย<ChevronRightIcon class="size-3.5" /></a>
</div>

<section class="bg-card pb-16 text-center sm:pb-24">
  <div class="container-apple pt-14 sm:pt-20">
    <p class="reveal text-[17px] font-semibold text-[#bf4800] sm:text-[21px]">{config.siteName}</p>
    <h1 class="reveal display mx-auto mt-2 max-w-4xl text-[48px] sm:text-[80px]" style="animation-delay: 80ms">
      <span class="text-sheen">{config.heroHeadline}</span>
    </h1>
    <p
      class="reveal mx-auto mt-4 max-w-2xl text-[21px] leading-snug text-muted-foreground sm:text-[28px]"
      style="animation-delay: 160ms"
    >
      {config.heroSubtitle}
    </p>
    <div class="reveal mt-8 flex flex-wrap items-center justify-center gap-4" style="animation-delay: 240ms">
      <Button href={resolve("/store")} size="lg">{config.ctaText}</Button>
      <button type="button" class="link text-[17px]" onclick={ui.openSearch}>
        ค้นหาสินค้า<ChevronRightIcon class="size-4" />
      </button>
    </div>
  </div>

  {#if config.heroImageUrl}
    <div class="container-wide mt-14" {@attach reveal()}>
      <img src={config.heroImageUrl} alt="" class="mx-auto max-h-[560px] w-full rounded-[32px] object-cover" />
    </div>
  {:else if showcase.length}
    <div class="container-wide mt-14" {@attach reveal()}>
      <div
        class="relative flex h-[260px] items-end justify-center overflow-hidden rounded-[32px] bg-[radial-gradient(120%_90%_at_50%_100%,color-mix(in_srgb,var(--syncx-accent)_14%,var(--syncx-bg))_0%,var(--syncx-bg)_70%)] sm:h-[440px]"
      >
        {#each showcase as product, i (product.id)}
          {@const center = i === 1 || showcase.length === 1}
          <a
            href={resolve(`/product/${product.id}`)}
            class={cn(
              "group relative -mx-6 mb-[-4%] block overflow-hidden rounded-[28px] bg-card shadow-float transition-transform duration-700 ease-apple hover:-translate-y-2 sm:-mx-10",
              center ? "z-10 w-[58%] max-w-[420px] sm:w-[38%]" : "w-[42%] max-w-[300px] sm:w-[28%]",
              i === 0 && showcase.length > 1 && "-rotate-6",
              i === 2 && "rotate-6",
            )}
            aria-label={product.name}
          >
            <img src={product.imageUrl} alt="" class="aspect-[4/3] w-full object-cover" />
            <span class="block truncate px-4 py-3 text-left text-sm font-semibold">{product.name}</span>
          </a>
        {/each}
      </div>
    </div>
  {/if}
</section>

<!-- apple.com-style full-bleed product stories, alternating light and dark. -->
{#each featured as product, i (product.id)}
  {@const dark = i % 2 === 1}
  <section
    class={cn("mt-3 overflow-hidden pt-12 text-center sm:pt-14", dark ? "bg-black text-[#f5f5f7]" : "bg-card")}
    aria-label={product.name}
  >
    <div class="container-apple" {@attach reveal()}>
      <h2 class="display text-[40px] sm:text-[56px]">{product.name}</h2>
      <p class={cn("mt-1 text-[21px] sm:text-[28px]", dark ? "text-[#86868b]" : "text-muted-foreground")}>{tagline(product)}</p>
      <p class={cn("mt-1 text-sm", dark ? "text-[#86868b]" : "text-muted-foreground")}>{priceLine(product)}</p>
      {@render links(product, dark)}
    </div>
    <div class="container-wide mt-10" {@attach reveal(120)}>
      {@render media(product, "mx-auto h-[280px] w-full max-w-[980px] rounded-t-[32px] sm:h-[460px]")}
    </div>
  </section>
{/each}

{#if tiles.length}
  <section class="grid gap-3 px-3 pt-3 md:grid-cols-2" aria-label="สินค้าแนะนำ">
    {#each tiles as product, i (product.id)}
      {@const dark = i === 1 || i === 2}
      <article
        class={cn("flex flex-col overflow-hidden pt-12 text-center", dark ? "bg-black text-[#f5f5f7]" : "bg-card")}
        {@attach reveal((i % 2) * 80)}
      >
        <h3 class="display px-6 text-[32px] sm:text-[40px]">{product.name}</h3>
        <p class={cn("mt-1 px-6 text-[19px]", dark ? "text-[#86868b]" : "text-muted-foreground")}>{tagline(product)}</p>
        {@render links(product, dark)}
        <div class="mt-8 flex flex-1 items-end justify-center px-10">
          {@render media(product, "h-[240px] w-full max-w-[520px] rounded-t-[28px] sm:h-[300px]")}
        </div>
      </article>
    {/each}
  </section>
{/if}

{#if shelf.length}
  <section class="container-wide pt-20" aria-label="หมวดหมู่">
    <h2 class="display mb-8 text-center text-[28px] sm:text-[40px]" {@attach reveal()}>เลือกซื้อตามหมวดหมู่</h2>
    <div class="flex gap-6 overflow-x-auto pb-2 [scrollbar-width:none] sm:justify-center">
      {#each shelf as category, i (category.id)}
        <a
          href={resolve(`/category/${encodeURIComponent(category.name)}`)}
          class="group flex w-24 shrink-0 flex-col items-center gap-3 text-center"
          {@attach reveal(i * 40)}
        >
          <span class="grid size-20 place-items-center overflow-hidden rounded-2xl bg-card transition-transform duration-500 ease-apple group-hover:scale-105">
            {#if category.imageUrl}
              <img src={category.imageUrl} alt="" class="size-full object-cover" loading="lazy" />
            {:else}
              <span class="display text-2xl text-muted-foreground">{category.name.charAt(0)}</span>
            {/if}
          </span>
          <span class="line-clamp-2 text-xs font-medium">{category.name}</span>
        </a>
      {/each}
    </div>
  </section>
{/if}

<!-- Words light up as the statement scrolls through the viewport. -->
<section class="container-apple py-24 sm:py-32" aria-labelledby="announcement-heading" {@attach scrollProgress}>
  <p id="announcement-heading" class="eyebrow mb-4">{config.announcementTitle}</p>
  <p class="display text-[32px] leading-[1.15] sm:text-[56px]" aria-label={config.announcementBody}>
    {#each words as word, i (i)}
      <span
        aria-hidden="true"
        class="transition-opacity duration-150"
        style:opacity={`clamp(0.18, calc((var(--progress, 0) - ${i / words.length}) * ${words.length / 3} + 0.18), 1)`}
      >{word}</span>
    {/each}
  </p>
  <a href={resolve("/store")} class="link mt-8 text-[19px]">ไปที่ร้านค้า<ChevronRightIcon class="size-4" /></a>
</section>

<section class="bg-black py-20 text-[#f5f5f7] sm:py-28" aria-labelledby="stats-heading">
  <div class="container-wide">
    <h2 id="stats-heading" class="display text-center text-[32px] sm:text-[48px]" {@attach reveal()}>
      ตัวเลขที่ลูกค้าไว้วางใจ
    </h2>
    <div class="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
      {#each stats as stat, i (stat.label)}
        <div class="text-center" {@attach reveal(i * 80)}>
          <p class="flex items-baseline justify-center gap-1.5">
            <strong
              class="display bg-gradient-to-b from-white to-[#86868b] bg-clip-text text-[48px] text-transparent tabular-nums sm:text-[72px]"
              {@attach countUp(stat.value)}
            ></strong>
            {#if stat.unit}<span class="text-[17px] text-[#86868b]">{stat.unit}</span>{/if}
          </p>
          <p class="mt-1 text-[17px] text-[#86868b]">{stat.label}</p>
        </div>
      {/each}
    </div>
  </div>
</section>
