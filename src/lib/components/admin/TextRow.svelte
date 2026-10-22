<script lang="ts">
  import SettingsRow from "./SettingsRow.svelte";

  let {
    label,
    hint,
    value = $bindable(""),
    placeholder = "",
    type = "text",
    multiline = false,
  }: {
    label: string;
    hint?: string;
    value?: string;
    placeholder?: string;
    type?: "text" | "email" | "url" | "number";
    multiline?: boolean;
  } = $props();
</script>

<SettingsRow {label} {hint} stacked={multiline}>
  {#if multiline}
    <textarea
      bind:value
      {placeholder}
      rows={4}
      aria-label={label}
      class="w-full resize-y rounded-xl bg-secondary px-3 py-2 text-[13px] leading-relaxed outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    ></textarea>
  {:else}
    <input
      bind:value
      {type}
      {placeholder}
      aria-label={label}
      class="w-full max-w-sm rounded-md bg-transparent px-1 py-1 text-right text-muted-foreground outline-none placeholder:text-muted-foreground/50 focus:bg-secondary focus:text-left focus:text-foreground"
    />
  {/if}
</SettingsRow>
