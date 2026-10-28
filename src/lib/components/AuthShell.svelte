<script lang="ts">
  import type { Snippet } from "svelte";
  import { getStores } from "$lib/stores";
  import LogoIcon from "./LogoIcon.svelte";

  let { title, subtitle, children, footer }: { title: string; subtitle: string; children: Snippet; footer: Snippet } =
    $props();

  const { site } = getStores();
</script>

<section class="relative -mt-[72px] flex flex-1 flex-col items-center bg-background px-4 pt-[120px] pb-16 sm:pb-24">
  <div
    class="reveal relative w-full max-w-[480px] rounded-[32px] bg-card px-6 py-10 text-center shadow-float sm:px-10"
  >
    <span class="mx-auto grid size-14 place-items-center overflow-hidden rounded-2xl bg-foreground text-background shadow-float">
      {#if site.config.logoImageUrl}
        <img src={site.config.logoImageUrl} alt="" class="size-full object-cover" />
      {:else}
        <LogoIcon size={26} />
      {/if}
    </span>
    <h1 class="display mt-6 text-[30px] sm:text-[36px]">{title}</h1>
    <p class="mt-2 text-[15px] text-muted-foreground">{subtitle}</p>
    <div class="mt-8 text-left">
      {@render children()}
    </div>
    <p class="mt-8 border-t border-foreground/10 pt-6 text-sm text-muted-foreground">
      {@render footer()}
    </p>
  </div>
</section>
