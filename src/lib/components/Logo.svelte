<script lang="ts">
  import { resolve } from "$app/paths";
  import { getStores } from "$lib/stores";
  import { cn } from "$lib/utils";
  import LogoIcon from "./LogoIcon.svelte";

  let { class: className = "" }: { class?: string } = $props();

  const { site } = getStores();
</script>

<a
  href={resolve("/")}
  class={cn("inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight text-foreground", className)}
  aria-label={`${site.config.logoText} home`}
>
  <span class="grid size-6 place-items-center overflow-hidden rounded-[7px] bg-foreground text-background">
    {#if site.config.logoImageUrl}
      <img src={site.config.logoImageUrl} alt="" class="size-full object-cover" />
    {:else}
      <LogoIcon size={14} />
    {/if}
  </span>
  <span>{site.config.logoText}</span>
</a>
