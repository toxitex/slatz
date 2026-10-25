<script lang="ts">
  import { resolve } from "$app/paths";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import ShoppingBagIcon from "@lucide/svelte/icons/shopping-bag";
  import { countUp, glassPointer, reveal, scrollProgress, segmentWords } from "$lib/attachments";
  import Grainient from "$lib/components/fx/Grainient.svelte";
  import MorphingText from "$lib/components/fx/MorphingText.svelte";
  import { Button } from "$lib/components/ui/button";
  import { getStores } from "$lib/stores";
  import { tierRange } from "$lib/stores/products.svelte";
  import type { SyncXProduct } from "$lib/types";
  import { cn, formatBaht, isDarkColor } from "$lib/utils";

  const { site, products, categories, ui } = getStores();
  products.ensureLoaded();
  categories.ensureLoaded();

  const config = $derived(site.config);
  const darkTheme = $derived(isDarkColor(config.theme.backgroundColor));
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
  const subtitleWords = $derived(segmentWords(config.heroSubtitle));
  const headlinePhrases = $derived(
    [config.heroHeadline, ...(config.heroMorphWords ?? "").split(",")].map((t) => t.trim()).filter(Boolean),
  );

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
    <Button
      href={resolve(`/product/${product.id}`)}
      class={cn("h-10 px-5 text-[15px]", dark && "bg-white text-black hover:bg-white/85")}
    >
      {config.store.learnMoreText}
    </Button>
    <Button
      href={resolve(`/product/${product.id}`)}
      variant="outline"
      class={cn(
        "h-10 border-foreground/80 bg-transparent px-5 text-[15px] hover:bg-foreground hover:text-background",
        dark && "border-white/70 text-white hover:bg-white hover:text-black",
      )}
    >
      {config.store.buyText}
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

<section class="relative -mt-[72px] overflow-hidden pt-[72px] pb-16 text-center sm:pb-24">
  <Grainient
    class="!absolute inset-0"
    colors={darkTheme
      ? ["#000000", "#161618", "#2c2c2e", "#48484a", "#6e6e73"]
      : ["#ffffff", "#f3f3f5", "#dcdce0", "#aeaeb2", "#6e6e73"]}
    angle={125}
    speed={0.55}
    flow={1.1}
    silk={0.65}
    softness={1}
    grainAmount={0.045}
    contrast={0.95}
    stir={0.8}
  />
  <div
    class="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_38%,rgba(255,255,255,0.82),rgba(255,255,255,0)_75%),linear-gradient(to_bottom,transparent_70%,var(--syncx-bg))]"
  ></div>

  <div class="relative container-apple pt-12 sm:pt-16">
    <a
      href={resolve("/store")}
      class="liquid-glass border-beam reveal inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] [--beam-duration:5s]"
      {@attach glassPointer}
    >
      <span class="size-1.5 rounded-full bg-foreground"></span>
      <span>{config.announcementTitle}</span>
      <span class="font-medium">เลือกซื้อเลย</span>
      <ChevronRightIcon class="size-3.5" />
    </a>
    <p class="reveal mt-8 text-[17px] font-semibold text-muted-foreground sm:text-[21px]" style="animation-delay: 60ms">
      {config.siteName}
    </p>
    <h1 class="reveal display mx-auto mt-2 max-w-5xl" style="animation-delay: 120ms">
      {#if headlinePhrases.length > 1}
        <MorphingText
          texts={headlinePhrases}
          class="h-[1.15em] text-[clamp(36px,9.5vw,88px)] leading-[1.1] whitespace-nowrap"
        />
      {:else}
        <span class="text-sheen text-[clamp(40px,9.5vw,88px)]">{config.heroHeadline}</span>
      {/if}
    </h1>
    <p class="mx-auto mt-5 max-w-2xl text-[21px] leading-snug text-muted-foreground sm:text-[28px]">
      {#each subtitleWords as word, i (i)}<span class="blur-word whitespace-pre" style="--i: {i}">{word}</span>{/each}
    </p>
    <div class="reveal mt-9 flex flex-wrap items-center justify-center gap-3" style="animation-delay: 380ms">
      <Button href={resolve("/store")} size="lg" class="px-7">{config.ctaText}</Button>
      <button
        type="button"
        class="liquid-glass inline-flex h-12 items-center gap-1.5 rounded-full px-6 text-[17px] font-medium transition-transform active:scale-95"
        onclick={ui.openSearch}
        {@attach glassPointer}
      >
        {config.searchButtonText}<ChevronRightIcon class="size-4" />
      </button>
    </div>
  </div>

  {#if config.heroImageUrl}
    <div class="relative container-wide mt-14" {@attach reveal()}>
      <img src={config.heroImageUrl} alt="" class="mx-auto max-h-[560px] w-full rounded-[32px] object-cover" />
    </div>
  {:else if showcase.length}
    <div class="relative container-wide mt-14" {@attach reveal()}>
      <div class="liquid-glass relative flex h-[260px] items-end justify-center overflow-hidden rounded-[36px] [--glass-alpha:45%] [-webkit-backdrop-filter:none] [backdrop-filter:none] sm:h-[440px]">
        {#each showcase as product, i (product.id)}
          {@const center = i === 1 || showcase.length === 1}
          <a
            href={resolve(`/product/${product.id}`)}
            class={cn(
              "group float-y relative -mx-6 mb-[-4%] block overflow-hidden rounded-[28px] bg-card shadow-float transition-transform duration-700 ease-apple hover:-translate-y-2 sm:-mx-10",
              center ? "z-10 w-[58%] max-w-[420px] sm:w-[38%]" : "w-[42%] max-w-[300px] sm:w-[28%]",
              i === 0 && showcase.length > 1 && "-rotate-6",
              i === 2 && "rotate-6",
            )}
            style="--float-delay: {i * -1.6}s"
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
    class={cn("group mt-3 overflow-hidden pt-12 text-center sm:pt-14", dark ? "bg-black text-[#f5f5f7]" : "bg-card")}
    aria-label={product.name}
  >
    <div class="container-apple" {@attach reveal()}>
      <h2 class="display text-[40px] sm:text-[56px]">{product.name}</h2>
      <p class={cn("mt-1 text-[21px] sm:text-[28px]", dark ? "text-[#86868b]" : "text-muted-foreground")}>{tagline(product)}</p>
      <p class={cn("mt-1 text-sm", dark ? "text-[#86868b]" : "text-muted-foreground")}>{priceLine(product)}</p>
      {@render links(product, dark)}
    </div>
    <div class="container-wide mt-10" {@attach reveal(120)}>
      <div class="mx-auto max-w-[980px] overflow-hidden rounded-t-[32px]">
        {@render media(
          product,
          "h-[280px] w-full transition-transform duration-[1400ms] ease-apple group-hover:scale-[1.03] sm:h-[460px]",
        )}
      </div>
    </div>
  </section>
{/each}

{#if tiles.length}
  <section class="grid gap-3 px-3 pt-3 md:grid-cols-2" aria-label="สินค้าแนะนำ">
    {#each tiles as product, i (product.id)}
      {@const dark = i === 1 || i === 2}
      <article
        class={cn(
          "group spotlight border-beam border-beam-hover flex flex-col overflow-hidden pt-12 text-center",
          dark ? "bg-black text-[#f5f5f7] [--beam-color:#ffffff] [--spot-color:#636366]" : "bg-card [--spot-color:#e8e8ed]",
        )}
        {@attach reveal((i % 2) * 80)}
        {@attach glassPointer}
      >
        <h3 class="display px-6 text-[32px] sm:text-[40px]">{product.name}</h3>
        <p class={cn("mt-1 px-6 text-[19px]", dark ? "text-[#86868b]" : "text-muted-foreground")}>{tagline(product)}</p>
        {@render links(product, dark)}
        <div class="mt-8 flex flex-1 items-end justify-center px-10">
          {@render media(
            product,
            "h-[240px] w-full max-w-[520px] rounded-t-[28px] transition-transform duration-700 ease-apple group-hover:-translate-y-2 sm:h-[300px]",
          )}
        </div>
      </article>
    {/each}
  </section>
{/if}

{#if shelf.length}
  <section class="container-wide pt-20" aria-label="หมวดหมู่">
    <h2 class="display mb-8 text-center text-[28px] sm:text-[40px]" {@attach reveal()}>{config.store.categoryTitle}</h2>
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

<!-- Words light up as the statement scrolls through the viewport. Hidden when the announcement body is empty. -->
{#if config.announcementBody.trim()}
  <section class="container-apple py-24 sm:py-32" aria-labelledby="announcement-heading" {@attach scrollProgress}>
    {#if config.announcementTitle.trim()}
      <p id="announcement-heading" class="eyebrow mb-4">{config.announcementTitle}</p>
    {/if}
    <p class="display text-[32px] leading-[1.15] sm:text-[56px]" aria-label={config.announcementBody}>
      {#each words as word, i (i)}
        <span
          aria-hidden="true"
          class="transition-opacity duration-150"
          style:opacity={`clamp(0.18, calc((var(--progress, 0) - ${i / words.length}) * ${words.length / 3} + 0.18), 1)`}
        >{word}</span>
      {/each}
    </p>
    {#if config.announcementLink.trim()}
      <a href={resolve("/store")} class="link mt-8 text-[19px]">{config.announcementLink}<ChevronRightIcon class="size-4" /></a>
    {/if}
  </section>
{/if}

<section
  class={cn(
    "py-20 sm:py-28",
    darkTheme
      ? "bg-card text-foreground"
      : "bg-black bg-[radial-gradient(70%_90%_at_50%_0%,#2c2c2e_0%,#000_70%)] text-[#f5f5f7]",
  )}
  aria-labelledby="stats-heading"
>
  <div class="container-wide">
    <h2 id="stats-heading" class="display text-center text-[32px] sm:text-[48px]" {@attach reveal()}>
      {config.stats.heading}
    </h2>
    <div class="mt-14 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {#each stats as stat, i (stat.label)}
        <div
          class="liquid-glass liquid-glass-dark border-beam rounded-3xl px-4 py-8 text-center [--beam-color:#ffffff]"
          style="--beam-duration: {7 + i * 1.5}s"
          {@attach reveal(i * 80)}
          {@attach glassPointer}
        >
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
