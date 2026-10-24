<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
  import SearchIcon from "@lucide/svelte/icons/search";
  import { reveal } from "$lib/attachments";
  import ProductCard from "$lib/components/ProductCard.svelte";
  import { getStores } from "$lib/stores";

  const { site, products, categories } = getStores();
  products.ensureLoaded();
  categories.ensureLoaded();

  let query = $state("");

  const name = $derived(page.params.name ?? "");
  const category = $derived(categories.categories.find((c) => c.name === name));
  const inCategory = $derived(products.products.filter((p) => p.category === name && p.status !== "hidden"));
  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inCategory;
    return inCategory.filter((p) => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q));
  });
  const bannerUrl = $derived(category?.imageUrl || inCategory.find((p) => p.imageUrl)?.imageUrl || "");
</script>

<section class="container-wide pt-12 sm:pt-16">
  <nav class="mb-4 flex items-center gap-1 text-xs text-muted-foreground" aria-label="Breadcrumb">
    <a href={resolve("/store")} class="hover:text-foreground">ร้านค้า</a>
    <ChevronRightIcon class="size-3" />
    <span class="text-foreground">{name}</span>
  </nav>
  <header class="flex flex-col justify-between gap-6 md:flex-row md:items-end">
    <div>
      <h1 class="reveal display text-[40px] sm:text-[64px]">{name}</h1>
      <p class="mt-1 text-[17px] text-muted-foreground">{inCategory.length} สินค้าในหมวดหมู่นี้</p>
    </div>
    <label class="flex h-11 w-full items-center gap-2 rounded-full bg-card px-4 text-sm md:max-w-xs">
      <SearchIcon class="size-4 text-muted-foreground" />
      <input
        bind:value={query}
        placeholder="ค้นหาสินค้าในหมวดหมู่นี้..."
        class="w-full bg-transparent outline-none placeholder:text-muted-foreground"
      />
    </label>
  </header>

  {#if bannerUrl}
    <div class="mt-8 overflow-hidden rounded-[32px]" {@attach reveal()}>
      <img src={bannerUrl} alt={name} class="h-56 w-full object-cover sm:h-80" />
    </div>
  {/if}
</section>

<section class="container-wide pt-8 pb-24">
  {#if products.error}
    <button
      type="button"
      class="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-card p-4 text-sm text-destructive"
      onclick={() => products.refresh()}
    >
      โหลดสินค้าไม่สำเร็จ: {products.error} <RefreshCwIcon class="size-4" />
    </button>
  {/if}

  {#if products.loading || categories.loading}
    <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {#each Array(4) as _, i (i)}
        <div class="aspect-[3/4] animate-pulse rounded-3xl bg-card"></div>
      {/each}
    </div>
  {:else if filtered.length}
    <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {#each filtered as product, i (product.id)}
        <div {@attach reveal((i % 4) * 60)}>
          <ProductCard {product} buttonText={site.config.store.productButtonText} class="h-full" />
        </div>
      {/each}
    </div>
  {:else}
    <div class="tile px-6 py-20 text-center">
      <p class="display text-2xl">{query ? `ไม่พบสินค้าที่ตรงกับ “${query}”` : site.config.store.emptyStateText}</p>
      <a href={resolve("/store")} class="link mt-4 text-[17px]">กลับไปที่ร้านค้า<ChevronRightIcon class="size-4" /></a>
    </div>
  {/if}
</section>
