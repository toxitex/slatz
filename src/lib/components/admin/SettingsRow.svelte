<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "$lib/utils";

  let {
    label,
    hint,
    children,
    stacked = false,
    class: className = "",
  }: { label: string; hint?: string; children: Snippet; stacked?: boolean; class?: string } = $props();

  const uid = $props.id();
</script>

<div
  class={cn(
    "flex gap-4 px-4 py-2.5 text-[13px]",
    stacked ? "flex-col gap-2 py-3" : "min-h-11 items-center justify-between",
    className,
  )}
  role="group"
  aria-labelledby={`row-${uid}`}
>
  <div class="shrink-0">
    <span id={`row-${uid}`} class="block">{label}</span>
    {#if hint}<span class="block text-[11px] text-muted-foreground">{hint}</span>{/if}
  </div>
  <div class={cn("min-w-0", stacked ? "w-full" : "flex flex-1 items-center justify-end gap-2")}>
    {@render children()}
  </div>
</div>
