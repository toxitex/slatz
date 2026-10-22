<script lang="ts">
  import { resolve } from "$app/paths";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import { countUp, reveal } from "$lib/attachments";
  import ProductCard from "$lib/components/ProductCard.svelte";
  import { Button } from "$lib/components/ui/button";
  import { getStores } from "$lib/stores";

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
  const latest = $derived(products.products.filter((p) => p.status !== "hidden").slice(0, 8));
  const shelf = $derived(categories.categories.filter((c) => c.isActive).slice(0, 8));
</script>

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
      <img
        src={config.heroImageUrl}
        alt=""
        class="mx-auto max-h-[560px] w-full rounded-[32px] object-cover"
      />
    </div>
  {/if}
</section>

{#if shelf.length}
  <section class="container-wide pt-14" aria-label="หมวดหมู่">
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

{#if latest.length}
  <section class="pt-16" aria-labelledby="latest-heading">
    <div class="container-wide flex items-end justify-between gap-4">
      <h2 id="latest-heading" class="display text-[28px] sm:text-[40px]">
        ล่าสุด. <span class="text-muted-foreground">สินค้าที่คัดมาให้คุณ</span>
      </h2>
      <a href={resolve("/store")} class="link shrink-0 text-sm max-sm:hidden">ดูทั้งหมด<ChevronRightIcon class="size-3.5" /></a>
    </div>
    <div class="mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-5 px-5 pb-8 [scrollbar-width:none] sm:scroll-px-[max(1.5rem,calc((100vw-1280px)/2+1.5rem))] sm:px-[max(1.5rem,calc((100vw-1280px)/2+1.5rem))]">
      {#each latest as product (product.id)}
        <ProductCard {product} buttonText={config.store.productButtonText} class="w-[78vw] max-w-[320px] shrink-0 snap-start" />
      {/each}
    </div>
  </section>
{/if}

<section class="container-wide pt-10" aria-labelledby="stats-heading">
  <h2 id="stats-heading" class="display text-[28px] sm:text-[40px]" {@attach reveal()}>
    ตัวเลข. <span class="text-muted-foreground">ที่ลูกค้าไว้วางใจ</span>
  </h2>
  <div class="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
    {#each stats as stat, i (stat.label)}
      <article class="tile flex flex-col justify-between p-6 sm:p-8" {@attach reveal(i * 70)}>
        <p class="text-sm font-semibold text-muted-foreground">{stat.label}</p>
        <p class="mt-8 flex items-baseline gap-1.5">
          <strong class="display text-[40px] tabular-nums sm:text-[56px]" {@attach countUp(stat.value)}></strong>
          {#if stat.unit}<span class="text-sm text-muted-foreground">{stat.unit}</span>{/if}
        </p>
      </article>
    {/each}
  </div>
</section>

<section class="container-wide pt-4 pb-20" aria-labelledby="announcement-heading">
  <article class="tile grid gap-6 p-8 sm:p-14 md:grid-cols-[1fr_1.3fr] md:items-center" {@attach reveal()}>
    <div>
      <p class="eyebrow">ประกาศ</p>
      <h2 id="announcement-heading" class="display mt-2 text-[32px] sm:text-[48px]">{config.announcementTitle}</h2>
    </div>
    <div>
      <p class="text-[19px] leading-relaxed text-foreground/80">{config.announcementBody}</p>
      <a href={resolve("/store")} class="link mt-5 text-[17px]">ไปที่ร้านค้า<ChevronRightIcon class="size-4" /></a>
    </div>
  </article>
</section>
