<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "$lib/utils";

  let {
    title,
    description,
    actions,
    children,
    class: className = "",
  }: { title?: string; description?: string; actions?: Snippet; children: Snippet; class?: string } = $props();
</script>

<section class={cn("flex flex-col gap-2", className)}>
  {#if title || actions}
    <div class="flex items-end justify-between gap-3 px-1">
      <div>
        {#if title}<h3 class="text-[13px] font-bold">{title}</h3>{/if}
        {#if description}<p class="text-xs text-muted-foreground">{description}</p>{/if}
      </div>
      {#if actions}<div class="flex items-center gap-2">{@render actions()}</div>{/if}
    </div>
  {/if}
  <div class="divide-y divide-border overflow-hidden rounded-2xl bg-card shadow-[0_0_0_0.5px_var(--syncx-border)]">
    {@render children()}
  </div>
</section>
