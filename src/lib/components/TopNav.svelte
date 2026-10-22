<script lang="ts">
  import { resolve } from "$app/paths";
  import type { Pathname } from "$app/types";
  import { afterNavigate } from "$app/navigation";
  import { page } from "$app/state";
  import SearchIcon from "@lucide/svelte/icons/search";
  import { toast } from "svelte-sonner";
  import { fade, fly, slide } from "svelte/transition";
  import { isAdminGranted } from "$lib/admin-access";
  import { accountLinks, isActive, primaryLinks } from "$lib/nav";
  import { getStores } from "$lib/stores";
  import { cn, formatBaht } from "$lib/utils";
  import Logo from "./Logo.svelte";
  import SearchSheet from "./SearchSheet.svelte";
  import UserMenu from "./UserMenu.svelte";

  const { site, auth, ui, products, categories } = getStores();

  let menuOpen = $state(false);
  let flyout = $state(false);
  let flyoutTimer: ReturnType<typeof setTimeout> | undefined;

  const flyoutCategories = $derived(categories.categories.filter(c => c.isActive).slice(0, 6));
  const popular = $derived(
    [...products.products]
      .filter(p => p.status !== "hidden")
      .sort((a, b) => (b.totalSold ?? 0) - (a.totalSold ?? 0))
      .slice(0, 4)
  );
  const quickLinks = $derived<{ href: Pathname; label: string }[]>(
    auth.user
      ? [
          { href: "/topup", label: "เติมเงิน" },
          { href: "/orders", label: "คำสั่งซื้อ" },
          { href: "/history", label: "ประวัติเติมเงิน" },
          { href: "/profile", label: "โปรไฟล์" },
        ]
      : [
          { href: "/login", label: "เข้าสู่ระบบ" },
          { href: "/register", label: "สมัครสมาชิก" },
        ]
  );

  function openFlyout(delay = 120) {
    clearTimeout(flyoutTimer);
    flyoutTimer = setTimeout(() => {
      products.ensureLoaded();
      categories.ensureLoaded();
      flyout = true;
    }, delay);
  }

  function closeFlyout() {
    clearTimeout(flyoutTimer);
    flyout = false;
  }
  let scrolled = $state(false);

  let adminGranted = $state(false);
  const mobileLinks = $derived<{ href: Pathname; label: string }[]>([
    ...primaryLinks,
    ...(auth.user
      ? accountLinks
      : [
          { href: "/login" as const, label: "เข้าสู่ระบบ" },
          { href: "/register" as const, label: "สมัครสมาชิก" },
        ]),
    ...(adminGranted ? [{ href: "/admin" as const, label: "แอดมินแดชบอร์ด" }] : []),
  ]);

  afterNavigate(() => {
    menuOpen = false;
    closeFlyout();
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

<svelte:window
  onscroll={() => (scrolled = window.scrollY > 8)}
  onkeydown={event => event.key === "Escape" && closeFlyout()}
/>

<header
  class={cn(
    "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-300",
    menuOpen || flyout ? "bg-background" : "glass",
    scrolled && !menuOpen && !flyout && "shadow-[0_1px_0_var(--syncx-border)]"
  )}
>
  <div role="presentation" onmouseleave={closeFlyout}>
    <nav class="container-wide flex h-12 items-center justify-between gap-6" aria-label="Primary navigation">
      <Logo />

      <div class="hidden flex-1 items-center justify-center gap-8 text-xs text-foreground/80 md:flex">
        {#each primaryLinks as link (link.href)}
          {@const hasFlyout = link.href === "/store"}
          <a
            href={resolve(link.href)}
            class={cn(
              "py-4 transition-colors hover:text-foreground",
              isActive(page.url.pathname, link.href) && "text-foreground"
            )}
            aria-haspopup={hasFlyout ? "true" : undefined}
            aria-expanded={hasFlyout ? flyout : undefined}
            onmouseenter={() => (hasFlyout ? openFlyout() : closeFlyout())}
            onfocus={() => hasFlyout && openFlyout(0)}
          >
            {link.label}
          </a>
        {/each}
        {#if auth.user}
          <a href={resolve("/topup")} class="transition-colors hover:text-foreground" onmouseenter={closeFlyout}
            >เติมเงิน</a
          >
          <a href={resolve("/history")} class="transition-colors hover:text-foreground" onmouseenter={closeFlyout}
            >ประวัติ</a
          >
        {/if}
        <button
          type="button"
          class="transition-colors hover:text-foreground"
          onmouseenter={closeFlyout}
          onclick={contact}>ติดต่อเรา</button
        >
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
            <a
              href={resolve("/login")}
              class="rounded-full px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:text-foreground"
            >
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
              menuOpen ? "rotate-45" : "-translate-y-[4px]"
            )}
          ></span>
          <span
            class={cn(
              "absolute h-[1.5px] w-[17px] rounded bg-foreground transition-transform duration-300 ease-apple",
              menuOpen ? "-rotate-45" : "translate-y-[4px]"
            )}
          ></span>
        </button>
      </div>
    </nav>

    {#if flyout}
      <div class="hidden md:block" transition:slide={{ duration: 320 }}>
        <div class="container-wide grid grid-cols-[1.4fr_1fr_1fr] gap-10 pt-8 pb-14">
          <div in:fly={{ y: -6, duration: 300, delay: 80 }}>
            <p class="mb-3 text-xs text-muted-foreground">เลือกซื้อ</p>
            <ul class="space-y-1.5">
              <li><a href={resolve("/store")} class="display text-2xl hover:text-link">ดูทั้งหมด</a></li>
              {#each flyoutCategories as category (category.id)}
                <li>
                  <a
                    href={resolve(`/category/${encodeURIComponent(category.name)}`)}
                    class="display text-2xl hover:text-link"
                  >
                    {category.name}
                  </a>
                </li>
              {/each}
            </ul>
          </div>
          <div in:fly={{ y: -6, duration: 300, delay: 120 }}>
            <p class="mb-3 text-xs text-muted-foreground">ลิงก์ด่วน</p>
            <ul class="space-y-2 text-xs font-semibold">
              <li>
                <button
                  type="button"
                  class="hover:text-link"
                  onclick={() => {
                    closeFlyout();
                    ui.openSearch();
                  }}
                >
                  ค้นหาสินค้า
                </button>
              </li>
              {#each quickLinks as link (link.href)}
                <li><a href={resolve(link.href)} class="hover:text-link">{link.label}</a></li>
              {/each}
            </ul>
          </div>
          <div in:fly={{ y: -6, duration: 300, delay: 160 }}>
            <p class="mb-3 text-xs text-muted-foreground">ขายดี</p>
            <ul class="space-y-2 text-xs font-semibold">
              {#each popular as product (product.id)}
                <li><a href={resolve(`/product/${product.id}`)} class="hover:text-link">{product.name}</a></li>
              {/each}
            </ul>
          </div>
        </div>
      </div>
    {/if}
  </div>

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
              <a
                href={resolve(link.href)}
                class="display block py-1.5 text-[28px] text-foreground/90 hover:text-foreground">{link.label}</a
              >
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

{#if flyout}
  <div
    class="fixed inset-0 z-40 bg-black/10 backdrop-blur-xl max-md:hidden"
    transition:fade={{ duration: 250 }}
    role="presentation"
  ></div>
{/if}

<SearchSheet />
