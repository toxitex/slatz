<script lang="ts">
  import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { Switch } from "$lib/components/ui/switch";
  import { getStores } from "$lib/stores";
  import ImageRow from "./ImageRow.svelte";
  import SettingsGroup from "./SettingsGroup.svelte";
  import SettingsRow from "./SettingsRow.svelte";

  const { categories } = getStores();

  const inputClass =
    "w-full max-w-sm rounded-md bg-transparent px-1 py-1 text-right text-muted-foreground outline-none focus:bg-secondary focus:text-left focus:text-foreground";
</script>

{#each categories.categories as category (category.id)}
  <SettingsGroup title={category.name || "หมวดหมู่ไม่มีชื่อ"}>
    {#snippet actions()}
      <button
        type="button"
        class="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-card hover:text-destructive"
        aria-label={`ลบ ${category.name}`}
        onclick={() => categories.remove(category.id)}
      >
        <Trash2Icon class="size-3.5" />
      </button>
    {/snippet}
    <SettingsRow label="ชื่อหมวดหมู่">
      <input
        value={category.name}
        aria-label="ชื่อหมวดหมู่"
        class={inputClass}
        onchange={(e) => categories.update(category.id, { name: e.currentTarget.value })}
      />
    </SettingsRow>
    <ImageRow
      label="รูปแบนเนอร์"
      value={category.imageUrl}
      onupdate={(imageUrl) => categories.update(category.id, { imageUrl })}
    />
    <SettingsRow label="ลำดับการแสดง">
      <input
        type="number"
        value={category.sortOrder}
        aria-label="ลำดับการแสดง"
        class="w-24 rounded-md bg-transparent px-1 py-1 text-right text-muted-foreground outline-none focus:bg-secondary"
        onchange={(e) => categories.update(category.id, { sortOrder: Number(e.currentTarget.value) || 0 })}
      />
    </SettingsRow>
    <SettingsRow label="แสดงบนหน้าร้าน">
      <Switch
        checked={category.isActive}
        onCheckedChange={(isActive) => categories.update(category.id, { isActive })}
        aria-label="แสดงบนหน้าร้าน"
      />
    </SettingsRow>
  </SettingsGroup>
{:else}
  <div class="flex flex-col items-center gap-2 rounded-2xl bg-card px-6 py-14 text-center text-[13px] text-muted-foreground">
    <LayoutGridIcon class="size-6" strokeWidth={1.5} />
    ยังไม่มีหมวดหมู่สินค้า กรุณาเพิ่มรายการแรก
  </div>
{/each}
