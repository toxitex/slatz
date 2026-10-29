<script lang="ts">
  import PlusIcon from "@lucide/svelte/icons/plus";
  import ShoppingBagIcon from "@lucide/svelte/icons/shopping-bag";
  import { dndzone } from "svelte-dnd-action";
  import { getStores } from "$lib/stores";
  import { totalStock } from "$lib/stores/products.svelte";
  import type { SyncXProduct } from "$lib/types";
  import ProductEditorDialog from "./ProductEditorDialog.svelte";

  const { products, categories } = getStores();

  const NONE = "__none__";
  let editing = $state<SyncXProduct | null>(null);
  let overrides = $state<Record<string, SyncXProduct[]> | null>(null);
  let clearTimer: ReturnType<typeof setTimeout> | undefined;

  const statusLabel = { active: "เปิดขาย", out_of_stock: "หมดชั่วคราว", hidden: "ซ่อน" } as const;

  const columns = $derived.by(() => {
    const grouped: Record<string, SyncXProduct[]> = {};
    for (const category of categories.categories) grouped[category.name] = [];
    const orphans: SyncXProduct[] = [];
    for (const product of products.products) {
      const bucket = grouped[product.category];
      if (bucket) bucket.push(product);
      else orphans.push(product);
    }
    const sortItems = (items: SyncXProduct[]) => [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const built = categories.categories.map((category) => ({
      key: category.id,
      name: category.name,
      active: category.isActive,
      items: overrides?.[category.id] ?? sortItems(grouped[category.name] ?? []),
    }));
    if (orphans.length || overrides?.[NONE]) {
      built.push({
        key: NONE,
        name: "",
        active: true,
        items: overrides?.[NONE] ?? sortItems(orphans),
      });
    }
    return built;
  });

  function snapshot() {
    const next: Record<string, SyncXProduct[]> = {};
    for (const column of columns) {
      if (overrides?.[column.key]) next[column.key] = overrides[column.key];
      else next[column.key] = column.items;
    }
    return next;
  }

  function consider(key: string, event: CustomEvent<{ items: SyncXProduct[] }>) {
    overrides = { ...(overrides ?? snapshot()), [key]: event.detail.items };
  }

  function finalize(key: string, event: CustomEvent<{ items: SyncXProduct[] }>) {
    const items = event.detail.items;
    overrides = { ...(overrides ?? snapshot()), [key]: items };
    const column = columns.find((entry) => entry.key === key);
    const category = key === NONE ? "" : (column?.name ?? "");
    for (const [index, item] of items.entries()) {
      const patch: { category?: string; sortOrder?: number } = {};
      if (item.category !== category) patch.category = category;
      if ((item.sortOrder ?? 0) !== index) patch.sortOrder = index;
      if (patch.category !== undefined || patch.sortOrder !== undefined) void products.update(item.id, patch);
    }
    clearTimeout(clearTimer);
    clearTimer = setTimeout(() => (overrides = null), 120);
  }

  export async function add(initialCategory?: string) {
    const created = await products.add(initialCategory ?? categories.categories[0]?.name);
    if (created) editing = created;
  }
</script>

<p class="px-1 text-[13px] leading-relaxed text-muted-foreground">
  ลากการ์ดไปหมวดอื่นเพื่อย้าย หรือลากขึ้นลงเพื่อเรียงบนหน้าร้าน คลิกการ์ดเพื่อแก้ราคา สต็อก และรูป
</p>

<div class="flex items-start gap-3 overflow-x-auto pb-2">
  {#each columns as column (column.key)}
    <section class="flex w-[280px] shrink-0 flex-col rounded-2xl bg-card shadow-float {column.active ? '' : 'opacity-60'}">
      <header class="flex items-center gap-2 px-3 pt-3 pb-2">
        <div class="min-w-0 flex-1">
          <h3 class="truncate text-[14px] font-bold">{column.name || "ไม่มีหมวด"}</h3>
          <p class="text-[11px] text-muted-foreground">{column.items.length} ชิ้น{column.active ? "" : " · ซ่อนจากหน้าร้าน"}</p>
        </div>
        {#if column.key !== NONE}
          <button
            type="button"
            class="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label={`เพิ่มสินค้าใน${column.name}`}
            onclick={() => add(column.name)}
          >
            <PlusIcon class="size-4" />
          </button>
        {/if}
      </header>
      <div
        class="flex min-h-24 flex-col gap-2 px-2 pb-2"
        use:dndzone={{ items: column.items, type: "catalog", flipDurationMs: 180, dropTargetStyle: { outline: "none" } }}
        onconsider={(event) => consider(column.key, event)}
        onfinalize={(event) => finalize(column.key, event)}
      >
        {#each column.items as product (product.id)}
          <button
            type="button"
            class="flex w-full items-center gap-2.5 rounded-xl bg-secondary px-2.5 py-2 text-left"
            onclick={() => (editing = product)}
          >
            <span class="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-background">
              {#if product.imageUrl}
                <img src={product.imageUrl} alt="" class="size-full object-cover" />
              {:else}
                <ShoppingBagIcon class="size-4 text-muted-foreground" />
              {/if}
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-[13px] font-medium">{product.name}</span>
              <span class="block text-[11px] text-muted-foreground">
                {product.price} · คลัง {totalStock(product.tiers ?? [])}
              </span>
            </span>
            <span class="text-[10px] text-muted-foreground">{statusLabel[product.status ?? "active"]}</span>
          </button>
        {/each}
      </div>
    </section>
  {/each}

  <button
    type="button"
    class="flex w-[280px] shrink-0 items-center justify-center gap-2 self-start rounded-2xl border border-dashed border-border py-10 text-[13px] text-muted-foreground hover:bg-card"
    onclick={() => categories.add()}
  >
    <PlusIcon class="size-4" />
    เพิ่มหมวดหมู่
  </button>
</div>

{#if editing}
  <ProductEditorDialog product={editing} onclose={() => (editing = null)} />
{/if}
