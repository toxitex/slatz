<script lang="ts">
  import { resolve } from "$app/paths";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { toast } from "svelte-sonner";
  import Avatar from "$lib/components/Avatar.svelte";
  import { accountLinks } from "$lib/nav";
  import { getStores } from "$lib/stores";
  import { cn, formatBaht } from "$lib/utils";

  let { children } = $props();

  const { auth } = getStores();

  $effect(() => {
    if (!auth.loading && !auth.user) void goto(resolve("/login"), { replaceState: true });
  });

  async function signOut() {
    await auth.signOut();
    toast.success("ออกจากระบบแล้ว");
    await goto(resolve("/"));
  }
</script>

{#if auth.user}
  <section class="container-apple pt-12 pb-24 sm:pt-16">
    <header class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div class="flex items-center gap-4">
        <Avatar user={auth.user} class="size-16 text-2xl" />
        <div>
          <h1 class="display text-[24px] sm:text-[28px]">สวัสดี, {auth.user.displayName}</h1>
          <p class="text-[15px] text-muted-foreground">{auth.user.email}</p>
        </div>
      </div>
      <div class="sm:text-right">
        <p class="text-xs text-muted-foreground">ยอดเงินคงเหลือ</p>
        <p class="display text-[20px] tabular-nums">{formatBaht(auth.user.balance)}</p>
      </div>
    </header>

    <nav class="no-scrollbar mt-10 flex items-center gap-6 overflow-x-auto border-b border-border text-sm" aria-label="บัญชี">
      {#each accountLinks as link (link.href)}
        {@const active = page.url.pathname.startsWith(link.href)}
        <a
          href={resolve(link.href)}
          class={cn(
            "-mb-px shrink-0 border-b-2 py-3 transition-colors",
            active ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
          aria-current={active ? "page" : undefined}
        >
          {link.label}
        </a>
      {/each}
      <button type="button" class="ml-auto shrink-0 py-3 text-link hover:underline" onclick={signOut}>ออกจากระบบ</button>
    </nav>

    <div class="pt-10">
      {@render children()}
    </div>
  </section>
{:else}
  <div class="grid flex-1 place-items-center py-32 text-sm text-muted-foreground">กำลังโหลด...</div>
{/if}
