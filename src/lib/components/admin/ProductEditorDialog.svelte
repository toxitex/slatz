<script lang="ts">
  import PlusIcon from "@lucide/svelte/icons/plus";
  import ShoppingBagIcon from "@lucide/svelte/icons/shopping-bag";
  import { untrack } from "svelte";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as Select from "$lib/components/ui/select";
  import { getStores } from "$lib/stores";
  import type { ProductStatus, ProductTier, SyncXProduct } from "$lib/types";
  import ImageRow from "./ImageRow.svelte";
  import SettingsGroup from "./SettingsGroup.svelte";
  import SettingsRow from "./SettingsRow.svelte";
  import TextRow from "./TextRow.svelte";

  let { product, onclose }: { product: SyncXProduct; onclose: () => void } = $props();

  const { products, categories } = getStores();

  function cloneProduct(source: SyncXProduct): SyncXProduct {
    const copy = structuredClone($state.snapshot(source)) as SyncXProduct;
    return { ...copy, tiers: copy.tiers ?? [] };
  }

  const NO_CATEGORY = "__none__";
  const statusOptions: { value: ProductStatus; label: string }[] = [
    { value: "active", label: "เปิดขาย" },
    { value: "out_of_stock", label: "หมดชั่วคราว" },
    { value: "hidden", label: "ซ่อนจากหน้าร้าน" },
  ];

  let draft = $state<SyncXProduct | null>(untrack(() => cloneProduct(product)));
  let open = $state(true);
  let confirmDelete = $state(false);

  const activeCategories = $derived(categories.categories.filter((c) => c.isActive));
  const categoryOptions = $derived([
    { value: NO_CATEGORY, label: "— ไม่ระบุหมวดหมู่ —" },
    ...activeCategories.map((c) => ({ value: c.name, label: c.name })),
    ...(draft?.category && !activeCategories.some((c) => c.name === draft?.category)
      ? [{ value: draft.category, label: `${draft.category} (ไม่ได้ลงทะเบียน)` }]
      : []),
  ]);

  function close() {
    open = false;
    setTimeout(onclose, 200);
  }

  function commit() {
    if (!draft) return;
    const snapshot = $state.snapshot(draft);
    void products.update(snapshot.id, {
      name: snapshot.name,
      price: snapshot.price,
      category: snapshot.category,
      imageUrl: snapshot.imageUrl,
      description: snapshot.description,
      status: snapshot.status,
      totalSold: Number(snapshot.totalSold) || 0,
      tiers: (snapshot.tiers ?? []).map((t) => ({ ...t, price: Number(t.price) || 0, stock: Number(t.stock) || 0 })),
    });
  }

  function addTier() {
    if (!draft) return;
    const tier: ProductTier = { id: `tier-${Date.now()}-${Math.random().toString(16).slice(2)}`, label: "", price: 0, stock: 0 };
    draft.tiers = [...(draft.tiers ?? []), tier];
    commit();
  }

  function removeTier(id: string) {
    if (!draft) return;
    draft.tiers = (draft.tiers ?? []).filter((t) => t.id !== id);
    commit();
  }

  async function remove() {
    if (!draft) return;
    const id = draft.id;
    confirmDelete = false;
    close();
    await products.remove(id);
  }
</script>

<Dialog.Root bind:open onOpenChange={(value) => !value && close()}>
  <Dialog.Content class="max-h-[90dvh] overflow-y-auto bg-background p-0 sm:max-w-2xl">
    {#if draft}
      <Dialog.Header class="sticky top-0 z-10 border-b border-border bg-background/85 px-6 py-4 backdrop-blur-xl">
        <Dialog.Title class="flex items-center gap-2 text-[15px] font-semibold">
          <ShoppingBagIcon class="size-4 text-muted-foreground" />
          แก้ไขสินค้า: {draft.name}
        </Dialog.Title>
        <Dialog.Description class="text-xs">แก้ไขข้อมูล รายละเอียด ตัวเลือกราคา และสต็อกสินค้า — บันทึกอัตโนมัติ</Dialog.Description>
      </Dialog.Header>

      <form class="flex flex-col gap-6 px-6 pb-6" onchange={commit} onsubmit={(e) => e.preventDefault()}>
        <SettingsGroup title="ข้อมูลสินค้า">
          <TextRow label="ชื่อสินค้า" bind:value={draft.name} />
          <TextRow label="ราคาเริ่มต้น" bind:value={draft.price} placeholder="เช่น ฿299" />
          <SettingsRow label="หมวดหมู่">
            {#if categories.categories.length}
              <Select.Root
                type="single"
                value={draft.category || NO_CATEGORY}
                onValueChange={(value) => {
                  if (!draft) return;
                  draft.category = value === NO_CATEGORY ? "" : value;
                  commit();
                }}
              >
                <Select.Trigger size="sm" class="h-8 min-w-44 rounded-lg border-0 bg-secondary">
                  {categoryOptions.find((o) => o.value === (draft?.category || NO_CATEGORY))?.label}
                </Select.Trigger>
                <Select.Content>
                  {#each categoryOptions as option (option.value)}
                    <Select.Item value={option.value} label={option.label} />
                  {/each}
                </Select.Content>
              </Select.Root>
            {:else}
              <input
                bind:value={draft.category}
                placeholder="ชื่อหมวดหมู่"
                aria-label="หมวดหมู่"
                class="w-full max-w-sm rounded-md bg-transparent px-1 py-1 text-right text-muted-foreground outline-none focus:bg-secondary"
              />
            {/if}
          </SettingsRow>
          <SettingsRow label="สถานะสินค้า">
            <Select.Root
              type="single"
              value={draft.status ?? "active"}
              onValueChange={(value) => {
                if (!draft) return;
                draft.status = value as ProductStatus;
                commit();
              }}
            >
              <Select.Trigger size="sm" class="h-8 min-w-44 rounded-lg border-0 bg-secondary">
                {statusOptions.find((o) => o.value === (draft?.status ?? "active"))?.label}
              </Select.Trigger>
              <Select.Content>
                {#each statusOptions as option (option.value)}
                  <Select.Item value={option.value} label={option.label} />
                {/each}
              </Select.Content>
            </Select.Root>
          </SettingsRow>
          <SettingsRow label="ยอดขายสะสม">
            <input
              type="number"
              min="0"
              bind:value={draft.totalSold}
              aria-label="ยอดขายสะสม"
              class="w-28 rounded-md bg-transparent px-1 py-1 text-right text-muted-foreground outline-none focus:bg-secondary"
            />
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title="รูปภาพและรายละเอียด">
          <ImageRow label="รูปสินค้า" bind:value={draft.imageUrl} onupdate={commit} />
          <TextRow label="รายละเอียด" bind:value={draft.description} multiline />
        </SettingsGroup>

        <SettingsGroup title={`ตัวเลือกราคา (${draft.tiers?.length ?? 0} รายการ)`}>
          {#snippet actions()}
            <Button variant="ghost" size="sm" class="text-link" onclick={addTier}><PlusIcon />เพิ่มตัวเลือก</Button>
          {/snippet}
          {#if draft.tiers?.length}
            <div class="hidden grid-cols-[1fr_7rem_6rem_2rem] gap-2 px-4 py-2 text-[11px] text-muted-foreground sm:grid">
              <span>ชื่อตัวเลือก</span><span class="text-right">ราคา (บาท)</span><span class="text-right">สต็อก</span><span></span>
            </div>
            {#each draft.tiers as tier (tier.id)}
              <div class="grid grid-cols-[1fr_5rem_4rem_2rem] items-center gap-2 px-4 py-2 sm:grid-cols-[1fr_7rem_6rem_2rem]">
                <input bind:value={tier.label} placeholder="เช่น 7 วัน" aria-label="ชื่อตัวเลือก" class="min-w-0 rounded-md bg-secondary px-2.5 py-1.5 text-[13px] outline-none" />
                <input type="number" min="0" bind:value={tier.price} aria-label="ราคา" class="min-w-0 rounded-md bg-secondary px-2.5 py-1.5 text-right text-[13px] outline-none" />
                <input type="number" min="0" bind:value={tier.stock} aria-label="สต็อก" class="min-w-0 rounded-md bg-secondary px-2.5 py-1.5 text-right text-[13px] outline-none" />
                <button type="button" class="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive" aria-label="ลบตัวเลือก" onclick={() => removeTier(tier.id)}>
                  <Trash2Icon class="size-3.5" />
                </button>
              </div>
            {/each}
          {:else}
            <p class="px-4 py-4 text-[13px] text-muted-foreground">ยังไม่มีตัวเลือกราคา</p>
          {/if}
        </SettingsGroup>

        <div class="flex justify-between gap-3">
          <Button variant="destructive" onclick={() => (confirmDelete = true)}><Trash2Icon />ลบสินค้า</Button>
          <Button onclick={close}>เสร็จสิ้น</Button>
        </div>
      </form>
    {/if}
  </Dialog.Content>
</Dialog.Root>

<AlertDialog.Root bind:open={confirmDelete}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>ยืนยันการลบสินค้า</AlertDialog.Title>
      <AlertDialog.Description>
        คุณต้องการลบสินค้า “{draft?.name}” ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>ยกเลิก</AlertDialog.Cancel>
      <AlertDialog.Action class="bg-destructive text-white hover:bg-destructive/90" onclick={remove}>ยืนยันการลบ</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
