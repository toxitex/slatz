<script lang="ts">
  import { resolve } from "$app/paths";
  import type { Pathname } from "$app/types";
  import { goto } from "$app/navigation";
  import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
  import SearchIcon from "@lucide/svelte/icons/search";
  import { fade } from "svelte/transition";
  import { glassPop } from "$lib/transitions";
  import { getStores } from "$lib/stores";
  import { cn } from "$lib/utils";

  type Tab = "products" | "categories";
  type Item = { key: string; label: string; sublabel?: string; href: Pathname };

  const { site, products, ui } = getStores();

  let query = $state("");
  let tab = $state<Tab>("products");
  let activeIndex = $state(0);

  const categoryNames = $derived([...new Set(products.products.map((p) => p.category).filter(Boolean))]);

  const items = $derived.by<Item[]>(() => {
    const q = query.trim().toLowerCase();
    if (tab === "products") {
      return products.products
        .filter((p) => !q || [p.name, p.description, p.category].some((field) => field?.toLowerCase().includes(q)))
        .map((p) => ({ key: p.id, label: p.name, sublabel: p.category || undefined, href: `/product/${p.id}` as Pathname }));
    }
    return categoryNames
      .filter((name) => !q || name.toLowerCase().includes(q))
      .map((name) => ({ key: name, label: name, href: `/category/${encodeURIComponent(name)}` as Pathname }));
  });

  function setTab(next: Tab) {
    tab = next;
    activeIndex = 0;
  }

  function pick(item: Item) {
    ui.closeSearch();
    void goto(resolve(item.href));
  }

  function onkeydown(event: KeyboardEvent) {
    if (!ui.searchOpen) return;
    if (event.key === "Escape") {
      event.preventDefault();
      ui.closeSearch();
    } else if (event.key === "Tab") {
      event.preventDefault();
      setTab(tab === "products" ? "categories" : "products");
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      activeIndex = Math.min(activeIndex + 1, Math.max(items.length - 1, 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
    } else if (event.key === "Enter") {
      const item = items[activeIndex];
      if (item) {
        event.preventDefault();
        pick(item);
      }
    }
  }

  function setup(node: HTMLInputElement) {
    products.ensureLoaded();
    query = "";
    activeIndex = 0;
    node.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }
</script>

<svelte:document {onkeydown} />

{#if ui.searchOpen}
  <div
    class="fixed inset-0 z-[55] bg-black/20 backdrop-blur-md"
    transition:fade={{ duration: 200 }}
    onclick={ui.closeSearch}
    role="presentation"
  ></div>
  <div
    class="liquid-glass fixed inset-x-3 top-3 z-[60] mx-auto max-w-[760px] rounded-[28px] pb-6"
    style="--glass-alpha: 84%"
    transition:glassPop
    role="dialog"
    aria-modal="true"
    aria-label="ค้นหา"
  >
    <div class="px-6 pt-6 sm:px-8">
      <label class="flex items-center gap-3">
        <SearchIcon class="size-6 shrink-0 text-muted-foreground" strokeWidth={1.75} />
        <input
          {@attach setup}
          bind:value={query}
          oninput={() => (activeIndex = 0)}
          placeholder={site.config.searchPlaceholder}
          class="display w-full bg-transparent text-2xl text-foreground outline-none placeholder:text-muted-foreground/70 sm:text-[32px]"
        />
      </label>

      <div class="mt-6 inline-flex rounded-full bg-secondary p-1 text-xs">
        {#each [{ key: "products", label: "สินค้า" }, { key: "categories", label: "หมวดหมู่" }] as option (option.key)}
          <button
            type="button"
            class={cn(
              "rounded-full px-4 py-1.5 transition-colors",
              tab === option.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
            onclick={() => setTab(option.key as Tab)}
          >
            {option.label}
          </button>
        {/each}
      </div>

      <p class="eyebrow mt-6 mb-2 text-xs">{query ? "ผลการค้นหา" : "ลิงก์ด่วน"}</p>
      <ul class="max-h-[50vh] overflow-y-auto">
        {#each items.slice(0, 30) as item, i (item.key)}
          <li>
            <button
              type="button"
              class={cn(
                "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm transition-colors",
                i === activeIndex ? "bg-secondary text-foreground" : "text-foreground/80",
              )}
              onmouseenter={() => (activeIndex = i)}
              onclick={() => pick(item)}
            >
              <ArrowRightIcon class="size-3.5 text-muted-foreground" />
              <span class="truncate font-medium">{item.label}</span>
              {#if item.sublabel}
                <span class="ml-auto truncate text-xs text-muted-foreground">{item.sublabel}</span>
              {/if}
            </button>
          </li>
        {:else}
          <li class="px-2 py-6 text-sm text-muted-foreground">ไม่พบผลลัพธ์สำหรับ “{query}”</li>
        {/each}
      </ul>

      <p class="mt-6 hidden text-[11px] text-muted-foreground sm:block">
        ↑↓ เลือก · Enter เปิด · Tab สลับแท็บ · Esc ปิด
      </p>
    </div>
  </div>
{/if}
