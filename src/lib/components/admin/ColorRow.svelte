<script lang="ts">
  import SettingsRow from "./SettingsRow.svelte";

  let { label, hint, value = $bindable("#000000") }: { label: string; hint?: string; value?: string } = $props();

  const isHex = $derived(/^#[0-9a-f]{6}$/i.test(value));
</script>

<SettingsRow {label} {hint}>
  <input
    bind:value
    aria-label={`${label} (ค่าสี)`}
    class="w-44 rounded-md bg-transparent px-1 py-1 text-right font-mono text-xs text-muted-foreground outline-none focus:bg-secondary focus:text-foreground"
  />
  <label class="relative size-6 shrink-0 overflow-hidden rounded-full shadow-[inset_0_0_0_1px_var(--foreground)]" style:background={value}>
    {#if isHex}
      <input type="color" bind:value class="absolute inset-0 cursor-pointer opacity-0" aria-label={label} />
    {/if}
  </label>
</SettingsRow>
