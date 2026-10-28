<script lang="ts">
  import { resolve } from "$app/paths";
  import { getStores } from "$lib/stores";
  import LogoIcon from "$lib/components/LogoIcon.svelte";

  const { site } = getStores();
  const status = $derived(site.config.status);
  const tone = $derived(status.mode === "maintenance" ? "var(--syncx-warn)" : "var(--syncx-ok)");
</script>

<svelte:head>
  <title>สถานะระบบ · {site.config.siteName}</title>
</svelte:head>

<section class="mx-auto w-full max-w-[680px] px-5 pt-10 pb-20 sm:pt-14">
  <a href={resolve("/")} class="inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight">
    <span class="grid size-7 place-items-center overflow-hidden rounded-[8px] bg-foreground text-background">
      {#if site.config.logoImageUrl}
        <img src={site.config.logoImageUrl} alt="" class="size-full object-cover" />
      {:else}
        <LogoIcon size={15} />
      {/if}
    </span>
    สถานะระบบ
  </a>

  {#if status.kicker.trim()}
    <p class="mt-10 text-[15px] font-semibold" style:color={tone}>{status.kicker}</p>
  {/if}
  <h1 class="display mt-2 text-[32px] tracking-tight sm:text-[40px]">{status.headline}</h1>
  {#if status.body.trim()}
    <p class="mt-4 max-w-[36rem] text-[17px] leading-relaxed text-foreground/80 sm:text-[19px]">{status.body}</p>
  {/if}

  {#if status.items.length}
    <ul class="mt-10 overflow-hidden rounded-[28px] bg-secondary">
      {#each status.items as item, i (item.id)}
        <li class={["flex items-center justify-between gap-4 px-5 py-4", i > 0 && "border-t border-border"]}>
          <span class="flex min-w-0 items-center gap-3 font-semibold">
            <span
              class="size-2.5 shrink-0 rounded-full"
              style:background={item.tone === "warn" ? "var(--syncx-warn)" : "var(--syncx-ok)"}
            ></span>
            <span class="truncate">{item.label}</span>
          </span>
          <span
            class="shrink-0 text-right text-[15px] font-medium"
            style:color={item.tone === "warn" ? "var(--syncx-warn)" : "var(--syncx-ok)"}
          >
            {item.detail}
          </span>
        </li>
      {/each}
    </ul>
  {/if}

  {#if status.updated.trim()}
    <p class="mt-6 text-sm text-muted-foreground">อัปเดตล่าสุด {status.updated}</p>
  {/if}
</section>
