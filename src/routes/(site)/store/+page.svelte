<script lang="ts">
  import { resolve } from "$app/paths";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import { reveal } from "$lib/attachments";
  import { getStores } from "$lib/stores";

  const { site, products, categories } = getStores();
  products.ensureLoaded();
  categories.ensureLoaded();

  const tiles = $derived.by(() => {
    if (categories.categories.length) {
      return categories.categories
        .filter((cat) => cat.isActive)
        .map((cat) => {
          const inCategory = products.products.filter((p) => p.category === cat.name);
          return {
            name: cat.name,
            imageUrl: cat.imageUrl || inCategory.find((p) => p.imageUrl)?.imageUrl || "",
            count: inCategory.length,
          };
        });
    }
    const map = new Map<string, { count: number; imageUrl: string }>();
    for (const p of products.products) {
      if (!p.category) continue;
      const current = map.get(p.category);
      map.set(p.category, { count: (current?.count ?? 0) + 1, imageUrl: current?.imageUrl || p.imageUrl || "" });
    }
    return [...map].map(([name, value]) => ({ name, ...value }));
  });

  const loading = $derived(categories.loading && products.loading);
</script>

<section class="container-wide pt-12 pb-6 sm:pt-16">
  <nav class="mb-4 flex items-center gap-1 text-xs text-muted-foreground" aria-label="Breadcrumb">
    <a href={resolve("/")} class="hover:text-foreground">หน้าหลัก</a>
    <ChevronRightIcon class="size-3" />
    <span class="text-foreground">ร้านค้า</span>
  </nav>
  <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <h1 class="reveal display text-[40px] sm:text-[64px]">ร้านค้า</h1>
    <p class="reveal max-w-xs text-[17px] leading-snug text-muted-foreground sm:text-right" style="animation-delay: 80ms">
      วิธีที่ดีที่สุดในการเลือกซื้อ<br class="max-sm:hidden" /> {site.config.store.sectionTitle}
    </p>
  </div>
</section>

<section class="container-wide pb-24" aria-label="หมวดหมู่">
  {#if loading}
    <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {#each Array(3) as _, i (i)}
        <div class="aspect-[5/4] animate-pulse rounded-3xl bg-card"></div>
      {/each}
    </div>
  {:else if tiles.length}
    <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {#each tiles as tile, i (tile.name)}
        <a
          href={resolve(`/category/${encodeURIComponent(tile.name)}`)}
          class="group relative flex aspect-[5/4] flex-col overflow-hidden rounded-3xl bg-card p-7 transition-shadow duration-500 ease-apple hover:shadow-float"
          {@attach reveal(i * 60)}
        >
          <div class="relative z-10">
            <p class="text-xs font-semibold tracking-wide text-[#bf4800] uppercase">{tile.count} สินค้า</p>
            <h2 class="display mt-1 text-[28px]">{tile.name}</h2>
            <span class="link mt-2 text-sm">เลือกซื้อ<ChevronRightIcon class="size-3.5" /></span>
          </div>
          {#if tile.imageUrl}
            <img
              src={tile.imageUrl}
              alt=""
              loading="lazy"
              class="absolute inset-x-6 bottom-0 h-[58%] w-[calc(100%-3rem)] rounded-t-2xl object-cover transition-transform duration-700 ease-apple group-hover:scale-[1.04]"
            />
          {:else}
            <span class="display absolute right-6 bottom-2 text-[120px] leading-none text-foreground/5">
              {tile.name.charAt(0)}
            </span>
          {/if}
        </a>
      {/each}
    </div>
  {:else}
    <div class="tile px-6 py-20 text-center">
      <p class="display text-2xl">{site.config.store.emptyStateText}</p>
    </div>
  {/if}
</section>
