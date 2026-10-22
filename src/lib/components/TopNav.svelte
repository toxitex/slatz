<script lang="ts">
  import { resolve } from "$app/paths";
  import type { Pathname } from "$app/types";
  import { afterNavigate } from "$app/navigation";
  import { page } from "$app/state";
  import SearchIcon from "@lucide/svelte/icons/search";
  import { toast } from "svelte-sonner";
  import { fade, fly } from "svelte/transition";
  import { isAdminGranted } from "$lib/admin-access";
  import { accountLinks, isActive, primaryLinks } from "$lib/nav";
  import { getStores } from "$lib/stores";
  import { cn, formatBaht } from "$lib/utils";
  import Logo from "./Logo.svelte";
  import SearchSheet from "./SearchSheet.svelte";
  import UserMenu from "./UserMenu.svelte";

  const { site, auth, ui } = getStores();

  let menuOpen = $state(false);
  let scrolled = $state(false);

  let adminGranted = $state(false);
  const mobileLinks = $derived<{ href: Pathname; label: string }[]>([
    ...primaryLinks,
    ...(auth.user ? accountLinks : [
      { href: "/login" as const, label: "เข้าสู่ระบบ" },
      { href: "/register" as const, label: "สมัครสมาชิก" },
    ]),
    ...(adminGranted ? [{ href: "/admin" as const, label: "แอดมินแดชบอร์ด" }] : []),
  ]);

  afterNavigate(() => {
    menuOpen = false;
    adminGranted = isAdminGranted();
  });

  function contact() {
    toast(`ติดต่อเราได้ที่ ${site.config.footer.contactEmail}`);
  }

  function lockScroll() {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }

  async function signOut() {
    menuOpen = false;
    await auth.signOut();
    toast.success("ออกจากระบบแล้ว");
  }
</script>

<svelte:window onscroll={() => (scrolled = window.scrollY > 8)} />

<header
  class={cn(
    "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-300",
    menuOpen ? "bg-background" : "glass",
    scrolled && !menuOpen && "shadow-[0_1px_0_var(--syncx-border)]",
  )}
>
  <nav class="container-wide flex h-12 items-center justify-between gap-6" aria-label="Primary navigation">
    <Logo />

    <div class="hidden flex-1 items-center justify-center gap-8 text-xs text-foreground/80 md:flex">
      {#each primaryLinks as link (link.href)}
        <a
          href={resolve(link.href)}
          class={cn("transition-colors hover:text-foreground", isActive(page.url.pathname, link.href) && "text-foreground")}
        >
          {link.label}
        </a>
      {/each}
      {#if auth.user}
        <a href={resolve("/topup")} class="transition-colors hover:text-foreground">เติมเงิน</a>
        <a href={resolve("/history")} class="transition-colors hover:text-foreground">ประวัติ</a>
      {/if}
      <button type="button" class="transition-colors hover:text-foreground" onclick={contact}>ติดต่อเรา</button>
    </div>

    <div class="flex items-center gap-1">
      <button
        type="button"
        class="grid size-9 place-items-center rounded-full text-foreground/80 transition-colors hover:text-foreground"
        aria-label="ค้นหา"
        onclick={ui.openSearch}
      >
        <SearchIcon class="size-[17px]" strokeWidth={1.75} />
      </button>

      <div class="hidden items-center gap-1 md:flex">
        {#if auth.user}
          <UserMenu />
        {:else if !auth.loading}
          <a href={resolve("/login")} class="rounded-full px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:text-foreground">
            เข้าสู่ระบบ
          </a>
          <a
            href={resolve("/register")}
            class="rounded-full bg-primary px-3.5 py-1.5 text-xs text-primary-foreground transition hover:brightness-110"
          >
            สมัครสมาชิก
          </a>
        {/if}
      </div>

      <button
        type="button"
        class="relative grid size-9 place-items-center md:hidden"
        aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"}
        aria-expanded={menuOpen}
        onclick={() => (menuOpen = !menuOpen)}
      >
        <span
          class={cn(
            "absolute h-[1.5px] w-[17px] rounded bg-foreground transition-transform duration-300 ease-apple",
            menuOpen ? "rotate-45" : "-translate-y-[4px]",
          )}
        ></span>
        <span
          class={cn(
            "absolute h-[1.5px] w-[17px] rounded bg-foreground transition-transform duration-300 ease-apple",
            menuOpen ? "-rotate-45" : "translate-y-[4px]",
          )}
        ></span>
      </button>
    </div>
  </nav>

  {#if menuOpen}
    <div
      class="fixed inset-x-0 top-12 bottom-0 overflow-y-auto bg-background md:hidden"
      transition:fade={{ duration: 180 }}
      {@attach lockScroll}
    >
      <div class="container-wide pt-6 pb-16">
        {#if auth.user}
          <p class="eyebrow mb-4" in:fly={{ y: -8, duration: 300 }}>
            {auth.user.displayName} · {formatBaht(auth.user.balance)}
          </p>
        {/if}
        <ul class="flex flex-col gap-1">
          {#each mobileLinks as link, i (link.href)}
            <li in:fly={{ y: -10, duration: 320, delay: 30 + i * 25 }}>
              <a href={resolve(link.href)} class="display block py-1.5 text-[28px] text-foreground/90 hover:text-foreground">{link.label}</a>
            </li>
          {/each}
        </ul>
        <div class="mt-8 flex flex-col items-start gap-3 text-sm text-muted-foreground">
          <button type="button" onclick={contact}>ติดต่อเรา</button>
          {#if auth.user}
            <button type="button" class="text-destructive" onclick={signOut}>ออกจากระบบ</button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</header>

<SearchSheet />
