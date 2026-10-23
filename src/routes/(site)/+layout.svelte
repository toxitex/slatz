<script lang="ts">
  import Footer from "$lib/components/Footer.svelte";
  import TopNav from "$lib/components/TopNav.svelte";

  let { children } = $props();
</script>

<div class="flex min-h-dvh flex-col">
  <TopNav />
  <main class="flex flex-1 flex-col pt-[72px]">
    {@render children()}
  </main>
  <Footer />
</div>
