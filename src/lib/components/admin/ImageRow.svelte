<script lang="ts">
  import ImageIcon from "@lucide/svelte/icons/image";
  import { toast } from "svelte-sonner";
  import { uploadImage } from "$lib/api";
  import SettingsRow from "./SettingsRow.svelte";

  let {
    label,
    value = $bindable(""),
    onupdate,
  }: { label: string; value?: string; onupdate?: (value: string) => void } = $props();

  function set(next: string) {
    value = next;
    onupdate?.(next);
  }

  let uploading = $state(false);

  async function onchange(event: Event & { currentTarget: HTMLInputElement }) {
    event.stopPropagation();
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    uploading = true;
    try {
      set(await uploadImage(file));
      toast.success(`อัปโหลด${label}สำเร็จ`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(`อัปโหลด${label}ล้มเหลว`);
    } finally {
      uploading = false;
    }
  }
</script>

<SettingsRow {label} stacked>
  <div class="flex items-center gap-3">
    <span class="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-secondary">
      {#if value}
        <img src={value} alt="" class="size-full object-cover" />
      {:else}
        <ImageIcon class="size-5 text-muted-foreground" strokeWidth={1.5} />
      {/if}
    </span>
    <div class="flex min-w-0 flex-1 flex-col gap-1.5">
      <input
        bind:value
        onchange={() => onupdate?.(value)}
        placeholder="https://..."
        aria-label={`ลิงก์${label}`}
        class="w-full rounded-lg bg-secondary px-3 py-1.5 text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <div class="flex gap-3 text-xs">
        <label class="cursor-pointer text-link hover:underline">
          {uploading ? "กำลังอัปโหลด..." : "อัปโหลดรูป…"}
          <input type="file" accept="image/*" class="sr-only" {onchange} disabled={uploading} />
        </label>
        {#if value}
          <button type="button" class="text-muted-foreground hover:text-foreground" onclick={() => set("")}>ลบรูป</button>
        {/if}
      </div>
    </div>
  </div>
</SettingsRow>
