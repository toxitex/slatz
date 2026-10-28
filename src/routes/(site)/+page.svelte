<script lang="ts">
  import { resolve } from "$app/paths";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import ShoppingBagIcon from "@lucide/svelte/icons/shopping-bag";
  import { countUp, reveal, scrollProgress, segmentWords } from "$lib/attachments";
  import Grainient from "$lib/components/fx/Grainient.svelte";
  import MorphingText from "$lib/components/fx/MorphingText.svelte";
  import { Button } from "$lib/components/ui/button";
  import { getStores } from "$lib/stores";
  import { tierRange } from "$lib/stores/products.svelte";
  import { api } from "$lib/api";
  import type { PublicStats, SyncXProduct } from "$lib/types";
  import { cn, formatBaht } from "$lib/utils";

  const { site, products, categories, ui } = getStores();
  products.ensureLoaded();
  categories.ensureLoaded();

  const config = $derived(site.config);
  const darkTheme = $derived(config.theme.mode === "dark");
  let liveStats = $state<PublicStats | null>(null);
  api
    .get<PublicStats>("/api/stats")
    .then((data) => (liveStats = data))
    .catch(() => (liveStats = null));

  const stats = $derived.by(() => {
    const live = config.stats.live && liveStats;
    const value = (key: keyof PublicStats) => (live ? liveStats![key].toLocaleString("en-US") : config.stats[key]);
    return [
      { label: config.stats.usersLabel, value: value("users"), unit: config.stats.usersUnit },
      { label: config.stats.productsLabel, value: value("products"), unit: config.stats.productsUnit },
      { label: config.stats.stockLabel, value: value("stock"), unit: config.stats.stockUnit },
      { label: config.stats.soldLabel, value: value("sold"), unit: config.stats.soldUnit },
    ];
  });
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
  const heroCentered = $derived(config.home.heroAlign !== "left");
  const heroType = $derived(
    { sm: "text-[clamp(26px,4.5vw,36px)]", md: "text-[clamp(28px,5vw,44px)]", lg: "text-[clamp(32px,5.5vw,52px)]" }[
      config.home.heroSize
    ],
  );
  const heroSub = $derived(
    { sm: "text-[17px]", md: "text-[17px] sm:text-[19px]", lg: "text-[19px] sm:text-[21px]" }[
      config.home.heroSize
    ],
  );
  const statementType = $derived(
    {
      sm: "text-[20px] leading-snug sm:text-[26px]",
      md: "text-[22px] leading-[1.25] sm:text-[30px]",
      lg: "text-[24px] leading-[1.25] sm:text-[34px]",
    }[config.home.statementSize],
  );
  const statementSpace = $derived(
    { tight: "py-10 sm:py-14", normal: "py-16 sm:py-20", roomy: "py-24 sm:py-32" }[config.home.statementSpace],
  );

  function tagline(product: SyncXProduct) {
    return product.description.split("\n").find((line) => line.trim()) || product.category;
  }

  function priceLine(product: SyncXProduct) {
    const range = tierRange(product.tiers ?? []);
    return range ? `เริ่มต้น ${formatBaht(range.min)}` : product.price;
  }
</script>

{#snippet links(product: SyncXProduct)}
  <div class="mt-5 flex flex-wrap items-center justify-center gap-3">
    <Button href={resolve(`/product/${product.id}`)} class="h-10 px-5 text-[15px]">
      {config.store.learnMoreText}
    </Button>
    <Button
      href={resolve(`/product/${product.id}`)}
      variant="outline"
      class="h-10 border-foreground/20 bg-transparent px-5 text-[15px] hover:bg-foreground hover:text-background"
    >
      {config.store.buyText}
    </Button>
  </div>
{/snippet}

{#snippet media(product: SyncXProduct, className: string)}
  {#if product.imageUrl}
    <img src={product.imageUrl} alt={product.name} loading="lazy" class={cn("object-cover", className)} />
  {:else}
    <div class={cn("grid place-items-center bg-secondary", className)}>
      <ShoppingBagIcon class="size-14 opacity-30" strokeWidth={1} />
    </div>
  {/if}
{/snippet}

<section class={cn("relative -mt-[72px] overflow-hidden pt-[72px] pb-12 sm:pb-16", heroCentered ? "text-center" : "text-left")}>
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
    class="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_18%,var(--syncx-bg)_78%)]"
  ></div>

  <div class="relative container-apple pt-8 sm:pt-12">
    <a
      href={resolve("/store")}
      class="reveal inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 text-[13px] shadow-float"
    >
      <span class="size-1.5 rounded-full bg-foreground"></span>
      <span>{config.announcementTitle}</span>
      <span class="font-medium">เลือกซื้อเลย</span>
      <ChevronRightIcon class="size-3.5" />
    </a>
    <p class="reveal mt-6 text-[15px] font-semibold text-muted-foreground sm:text-[17px]" style="animation-delay: 60ms">
      {config.siteName}
    </p>
    <h1 class="reveal display mx-auto mt-2 max-w-5xl" style="animation-delay: 120ms">
      {#if headlinePhrases.length > 1}
        <MorphingText texts={headlinePhrases} class={cn("min-h-[1.15em] leading-[1.1] whitespace-normal", heroType)} />
      {:else}
        <span class={cn("text-sheen leading-[1.1]", heroType)}>{config.heroHeadline}</span>
      {/if}
    </h1>
    <p class={cn("mt-5 max-w-2xl leading-snug text-muted-foreground", heroSub, heroCentered && "mx-auto")}>
      {#each subtitleWords as word, i (i)}<span class="blur-word whitespace-pre" style="--i: {i}">{word}</span>{/each}
    </p>
    <div class={cn("reveal mt-7 flex flex-wrap items-center gap-3", heroCentered ? "justify-center" : "justify-start")} style="animation-delay: 380ms">
      <Button href={resolve("/store")} size="lg" class="px-7">{config.ctaText}</Button>
      <button
        type="button"
        class="inline-flex h-12 items-center gap-1.5 rounded-full bg-card px-6 text-[17px] font-medium shadow-float transition-transform active:scale-95"
        onclick={ui.openSearch}
      >
        {config.searchButtonText}<ChevronRightIcon class="size-4" />
      </button>
    </div>
  </div>

  {#if config.heroImageUrl}
    <div class="relative container-wide mt-10" {@attach reveal()}>
      <img src={config.heroImageUrl} alt="" class="mx-auto max-h-[420px] w-full rounded-[28px] object-cover" />
    </div>
  {:else if showcase.length}
    <div class="relative container-wide mt-10" {@attach reveal()}>
      <div class="relative flex h-[220px] items-end justify-center overflow-hidden sm:h-[320px]">
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

<!-- Product stories sit on the page fill, with a secondary fill on every other story. -->
{#each featured as product, i (product.id)}
  <section
    class={cn("group mt-3 overflow-hidden pt-8 text-center sm:pt-10", i % 2 === 1 ? "bg-secondary" : "bg-background")}
    aria-label={product.name}
  >
    <div class="container-apple" {@attach reveal()}>
      <h2 class="display text-[28px] sm:text-[34px]">{product.name}</h2>
      <p class="mt-1 text-[17px] text-muted-foreground">{tagline(product)}</p>
      <p class="mt-1 text-sm text-muted-foreground">{priceLine(product)}</p>
      {@render links(product)}
    </div>
    <div class="container-wide mt-10" {@attach reveal(120)}>
      <div class="mx-auto max-w-[980px] overflow-hidden rounded-t-[32px]">
        {@render media(
          product,
          "h-[220px] w-full transition-transform duration-[1400ms] ease-apple group-hover:scale-[1.03] sm:h-[320px]",
        )}
      </div>
    </div>
  </section>
{/each}

{#if tiles.length}
  <section class="grid gap-3 px-3 pt-3 md:grid-cols-2" aria-label="สินค้าแนะนำ">
    {#each tiles as product, i (product.id)}
      <article
        class={cn("group flex flex-col overflow-hidden pt-8 text-center", i % 2 === 1 ? "bg-secondary" : "bg-card")}
        {@attach reveal((i % 2) * 80)}
      >
        <h3 class="display px-6 text-[22px] sm:text-[26px]">{product.name}</h3>
        <p class="mt-1 px-6 text-[17px] text-muted-foreground">{tagline(product)}</p>
        {@render links(product)}
        <div class="mt-8 flex flex-1 items-end justify-center px-10">
          {@render media(
            product,
            "h-[180px] w-full max-w-[420px] rounded-t-[24px] transition-transform duration-700 ease-apple group-hover:-translate-y-2 sm:h-[220px]",
          )}
        </div>
      </article>
    {/each}
  </section>
{/if}

{#if shelf.length}
  <section class="container-wide pt-20" aria-label="หมวดหมู่">
    <h2 class="display mb-6 text-center text-[22px] sm:text-[26px]" {@attach reveal()}>{config.store.categoryTitle}</h2>
    <div class="no-scrollbar flex gap-6 overflow-x-auto pb-2 sm:justify-center">
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
  <section
    class={cn("container-apple", statementSpace, config.home.statementAlign === "center" && "text-center")}
    aria-labelledby="announcement-heading"
    {@attach scrollProgress}
  >
    {#if config.announcementTitle.trim()}
      <p id="announcement-heading" class="eyebrow mb-4">{config.announcementTitle}</p>
    {/if}
    <p class={cn("display", statementType)} aria-label={config.announcementBody}>
      {#each words as word, i (i)}
        <span
          aria-hidden="true"
          class="transition-opacity duration-150"
          style:opacity={`clamp(0.18, calc((var(--progress, 0) - ${i / words.length}) * ${words.length / 3} + 0.18), 1)`}
        >{word}</span>
      {/each}
    </p>
    {#if config.announcementLink.trim()}
      <a href={resolve("/store")} class="link mt-6 text-[17px]">{config.announcementLink}<ChevronRightIcon class="size-4" /></a>
    {/if}
  </section>
{/if}

<section class="bg-secondary py-14 sm:py-16" aria-labelledby="stats-heading">
  <div class="container-wide">
    <h2 id="stats-heading" class="display text-center text-[24px] sm:text-[28px]" {@attach reveal()}>
      {config.stats.heading}
    </h2>
    <div class="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {#each stats as stat, i (stat.label)}
        <div class="rounded-3xl bg-card px-4 py-6 text-center" {@attach reveal(i * 80)}>
          <p class="flex items-baseline justify-center gap-1.5">
            <strong class="display text-[28px] text-foreground tabular-nums sm:text-[36px]" {@attach countUp(stat.value)}></strong>
            {#if stat.unit}<span class="text-[17px] text-muted-foreground">{stat.unit}</span>{/if}
          </p>
          <p class="mt-1 text-[17px] text-muted-foreground">{stat.label}</p>
        </div>
      {/each}
    </div>
  </div>
</section>
