<script lang="ts">
  import { resolve } from "$app/paths";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import { reveal } from "$lib/attachments";
  import ProductCard from "$lib/components/ProductCard.svelte";
  import { getStores } from "$lib/stores";
  import { cn } from "$lib/utils";

  const { site, products, categories } = getStores();
  const titleType = $derived(
    { sm: "text-[32px] sm:text-[36px]", md: "text-[34px] sm:text-[40px]", lg: "text-[36px] sm:text-[44px]" }[
      site.config.home.titleSize
    ],
  );
  products.ensureLoaded();
  categories.ensureLoaded();

  const tiles = $derived.by(() => {
    if (categories.categories.length) {
      return categories.categories
        .filter((cat) => cat.isActive)
        .map((cat) => {
          const inCategory = products.products.filter((p) => p.category === cat.name && p.status !== "hidden");
          return {
            name: cat.name,
            imageUrl: cat.imageUrl || inCategory.find((p) => p.imageUrl)?.imageUrl || "",
            count: inCategory.length,
          };
        });
    }
    const grouped: Record<string, { count: number; imageUrl: string }> = {};
    for (const p of products.products) {
      if (!p.category || p.status === "hidden") continue;
      const current = grouped[p.category];
      grouped[p.category] = { count: (current?.count ?? 0) + 1, imageUrl: current?.imageUrl || p.imageUrl || "" };
    }
    return Object.entries(grouped).map(([name, value]) => ({ name, ...value }));
  });
  const visibleTiles = $derived(tiles.filter((tile) => tile.count > 0));

  const latest = $derived(products.products.filter((p) => p.status !== "hidden").slice(0, 10));
  const loading = $derived(categories.loading && products.loading);
</script>

<section class="container-wide pt-8 pb-2 sm:pt-10">
  <h1 class={cn("display tracking-tight", titleType)}>{site.config.store.headline}</h1>
  <p class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[17px] text-muted-foreground sm:text-[19px]">
    {#if site.config.store.headlineAccent.trim()}
      <span>{site.config.store.headlineAccent}</span>
    {/if}
    <a href="#categories" class="link">เลือกซื้อ<ChevronRightIcon class="size-4" /></a>
  </p>
</section>

{#if latest.length}
  <section class="pt-8 pb-6" aria-label={site.config.store.latestTitle}>
    <div
      class="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-6 sm:scroll-px-[max(1.5rem,calc((100vw-1280px)/2+1.5rem))] sm:px-[max(1.5rem,calc((100vw-1280px)/2+1.5rem))]"
    >
      {#each latest as product (product.id)}
        <ProductCard
          {product}
          label={site.config.store.latestTitle}
          buttonText={site.config.store.buyText}
          class="w-[min(78vw,300px)] shrink-0 snap-start"
        />
      {/each}
    </div>
  </section>
{/if}

<section id="categories" class="container-wide scroll-mt-24 pt-6 pb-24" aria-label="หมวดหมู่">
  {#if site.config.store.sectionTitle.trim() && (loading || visibleTiles.length)}
    <h2 class="display text-[22px] sm:text-[26px]">{site.config.store.sectionTitle}</h2>
  {/if}
  {#if loading}
    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each Array(3) as _, i (i)}
        <div class="aspect-[5/4] animate-pulse rounded-[28px] bg-card"></div>
      {/each}
    </div>
  {:else if visibleTiles.length}
    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each visibleTiles as tile, i (tile.name)}
        <a
          href={resolve(`/category/${encodeURIComponent(tile.name)}`)}
          class="group relative flex aspect-[5/4] flex-col overflow-hidden rounded-[28px] bg-card p-7 shadow-float transition-transform duration-500 ease-apple hover:-translate-y-1"
          {@attach reveal(i * 60)}
        >
          <div class="relative z-10">
            <p class="text-[13px] font-semibold" style:color="var(--syncx-warn)">{tile.count} สินค้า</p>
            <h2 class="display mt-1 text-[22px]">{tile.name}</h2>
            <span class="link mt-2 text-[15px]">เลือกซื้อ<ChevronRightIcon class="size-4" /></span>
          </div>
          {#if tile.imageUrl}
            <img
              src={tile.imageUrl}
              alt=""
              loading="lazy"
              class="absolute inset-x-6 bottom-0 h-[52%] w-[calc(100%-3rem)] object-contain transition-transform duration-700 ease-apple group-hover:scale-[1.04]"
            />
          {:else}
            <span class="display absolute right-6 bottom-2 text-[72px] leading-none text-foreground/5">
              {tile.name.charAt(0)}
            </span>
          {/if}
        </a>
      {/each}
    </div>
  {:else if !latest.length && !loading}
    <div class="tile mt-6 px-6 py-20 text-center">
      <p class="display text-2xl">{site.config.store.emptyStateText}</p>
    </div>
  {/if}
</section>
