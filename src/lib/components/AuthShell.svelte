<script lang="ts">
  import type { Snippet } from "svelte";
  import { getStores } from "$lib/stores";
  import LogoIcon from "./LogoIcon.svelte";

  let { title, subtitle, children, footer }: { title: string; subtitle: string; children: Snippet; footer: Snippet } =
    $props();

  const { site } = getStores();
</script>

<section class="container-apple flex flex-1 flex-col items-center py-16 sm:py-24">
  <div class="reveal w-full max-w-[460px] text-center">
    <span class="mx-auto grid size-14 place-items-center overflow-hidden rounded-2xl bg-foreground text-background">
      {#if site.config.logoImageUrl}
        <img src={site.config.logoImageUrl} alt="" class="size-full object-cover" />
      {:else}
        <LogoIcon size={26} />
      {/if}
    </span>
    <h1 class="display mt-6 text-[32px] sm:text-[40px]">{title}</h1>
    <p class="mt-2 text-[17px] text-muted-foreground">{subtitle}</p>
    <div class="mt-10 text-left">
      {@render children()}
    </div>
    <p class="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">
      {@render footer()}
    </p>
  </div>
</section>
