<script lang="ts">
  import { resolve } from "$app/paths";
  import Footer from "$lib/components/Footer.svelte";
  import TopNav from "$lib/components/TopNav.svelte";
  import { getStores } from "$lib/stores";

  let { children } = $props();
  const { site } = getStores();
  const maintenance = $derived(site.config.status.mode === "maintenance");
</script>

<div class="flex min-h-dvh flex-col">
  <TopNav />
  <main class="flex flex-1 flex-col pt-[72px]">
    {#if maintenance}
      <a
        href={resolve("/status")}
        class="press mx-auto mt-3 flex w-[min(100%-1.5rem,680px)] items-center justify-between gap-3 rounded-full bg-[var(--syncx-warn)] px-4 py-2 text-[13px] font-medium text-[var(--on-fill)]"
      >
        <span class="truncate">{site.config.status.headline}</span>
        <span class="shrink-0">ดูสถานะ</span>
      </a>
    {/if}
    {@render children()}
  </main>
  <Footer />
</div>
