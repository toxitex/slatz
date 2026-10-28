<script lang="ts">
  import type { Snippet } from "svelte";
  import { getStores } from "$lib/stores";
  import LogoIcon from "./LogoIcon.svelte";

  let { title, subtitle, children, footer }: { title: string; subtitle: string; children: Snippet; footer: Snippet } =
    $props();

  const { site } = getStores();
</script>

<section class="flex flex-1 flex-col items-center px-5 pt-10 pb-16 sm:pt-16 sm:pb-20">
  <div class="w-full max-w-[400px]">
    <div class="flex flex-col items-center text-center">
      <span class="grid size-12 place-items-center overflow-hidden rounded-[14px] bg-foreground text-background">
        {#if site.config.logoImageUrl}
          <img src={site.config.logoImageUrl} alt="" class="size-full object-cover" />
        {:else}
          <LogoIcon size={22} />
        {/if}
      </span>
      <p class="mt-5 text-[13px] font-semibold text-muted-foreground">{site.config.siteName}</p>
      <h1 class="display mt-1 text-[26px] sm:text-[28px]">{title}</h1>
      <p class="mt-2 text-[15px] leading-relaxed text-muted-foreground">{subtitle}</p>
    </div>

    <div class="mt-8 rounded-[28px] bg-card px-5 py-5 shadow-float sm:px-6">
      {@render children()}
      <p class="mt-5 border-t border-border pt-4 text-center text-[15px] text-muted-foreground">
        {@render footer()}
      </p>
    </div>
  </div>
</section>
