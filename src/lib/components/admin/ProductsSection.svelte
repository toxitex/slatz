<script lang="ts">
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import ShoppingBagIcon from "@lucide/svelte/icons/shopping-bag";
  import { toast } from "svelte-sonner";
  import { Button } from "$lib/components/ui/button";
  import { getStores } from "$lib/stores";
  import { totalStock } from "$lib/stores/products.svelte";
  import type { SyncXProduct } from "$lib/types";
  import ProductEditorDialog from "./ProductEditorDialog.svelte";
  import SettingsGroup from "./SettingsGroup.svelte";

  const { products, categories } = getStores();

  let editing = $state<SyncXProduct | null>(null);

  const groups = $derived.by(() => {
    const map = new Map<string, SyncXProduct[]>();
    for (const cat of categories.categories) if (cat.isActive) map.set(cat.name, []);
    for (const product of products.products) {
      const name = product.category || "สินค้าทั่วไป";
      map.set(name, [...(map.get(name) ?? []), product]);
    }
    return [...map];
  });

  const statusLabel = { active: "เปิดขาย", out_of_stock: "หมดชั่วคราว", hidden: "ซ่อน" } as const;

  export async function add(initialCategory?: string) {
    const created = await products.add(initialCategory);
    if (created) {
      editing = created;
      if (!products.databaseMode) toast("เพิ่มสินค้าใน localStorage แล้ว");
    }
  }
</script>

{#if products.loading}
  <div class="h-64 animate-pulse rounded-2xl bg-card"></div>
{:else if groups.length}
  {#each groups as [categoryName, items] (categoryName)}
    <SettingsGroup title={categoryName} description={`${items.length} ชิ้น`}>
      {#snippet actions()}
        <Button variant="ghost" size="sm" class="text-link" onclick={() => add(categoryName)}><PlusIcon />เพิ่มสินค้า</Button>
      {/snippet}
      {#each items as product (product.id)}
        <button
          type="button"
          class="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-secondary/60"
          onclick={() => (editing = product)}
        >
          <span class="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-secondary">
            {#if product.imageUrl}
              <img src={product.imageUrl} alt="" class="size-full object-cover" />
            {:else}
              <ShoppingBagIcon class="size-4 text-muted-foreground" />
            {/if}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[13px] font-medium">{product.name}</span>
            <span class="block text-[11px] text-muted-foreground">
              {product.price} · คลัง {totalStock(product.tiers ?? [])} · {product.tiers?.length ?? 0} ตัวเลือก
            </span>
          </span>
          <span class="text-[11px] text-muted-foreground">{statusLabel[product.status ?? "active"]}</span>
          <ChevronRightIcon class="size-4 text-muted-foreground/60" />
        </button>
      {:else}
        <p class="px-4 py-3 text-[13px] text-muted-foreground">ยังไม่มีสินค้าในหมวดหมู่นี้</p>
      {/each}
    </SettingsGroup>
  {/each}
{:else}
  <div class="rounded-2xl bg-card px-6 py-14 text-center text-[13px] text-muted-foreground">
    ยังไม่มีสินค้าในระบบ กรุณาเพิ่มรายการแรก
  </div>
{/if}

{#if editing}
  <ProductEditorDialog product={editing} onclose={() => (editing = null)} />
{/if}
