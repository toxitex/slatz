<script lang="ts">
  import { getStores } from "$lib/stores";
  import { cn } from "$lib/utils";

  const { site } = getStores();
  const mode = $derived(site.config.status.mode);

  const options = [
    { id: "ok" as const, label: "ปกติ" },
    { id: "maintenance" as const, label: "ปิดปรับปรุง" },
  ];
</script>

<div class="grid grid-cols-2 rounded-full bg-background p-1" role="group" aria-label="สถานะร้าน">
  {#each options as option (option.id)}
    <button
      type="button"
      class={cn(
        "h-8 rounded-full text-[13px] font-medium transition-transform duration-100 ease-out active:scale-[0.97]",
        mode === option.id
          ? option.id === "maintenance"
            ? "bg-[var(--syncx-warn)] text-white"
            : "bg-card text-foreground shadow-float"
          : "text-muted-foreground",
      )}
      aria-pressed={mode === option.id}
      onclick={() => site.setStatusMode(option.id)}
    >
      {option.label}
    </button>
  {/each}
</div>
