<script lang="ts">
  import "../app.css";
  import { Toaster } from "$lib/components/ui/sonner";
  import { createStores } from "$lib/stores";

  let { children } = $props();

  const { site, auth } = createStores();

  void site.load();
  void auth.refresh();

  $effect(() => {
    site.sync();
  });
</script>

<svelte:head>
  <meta name="description" content={site.config.seoDescription} />
  <meta property="og:title" content={site.config.siteName} />
  <meta property="og:description" content={site.config.seoDescription} />
</svelte:head>

{@render children()}

<Toaster />
