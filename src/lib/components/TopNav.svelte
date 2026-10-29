<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { Pathname } from "$app/types";
  import ArrowUpRightIcon from "@lucide/svelte/icons/arrow-up-right";
  import MoonIcon from "@lucide/svelte/icons/moon";
  import SearchIcon from "@lucide/svelte/icons/search";
  import SunIcon from "@lucide/svelte/icons/sun";
  import { toast } from "svelte-sonner";
  import { fade } from "svelte/transition";
  import { isAdminGranted } from "$lib/admin-access";
  import { accountLinks, isActive, primaryLinks } from "$lib/nav";
  import { getStores } from "$lib/stores";
  import { animateTheme } from "$lib/stores/site-config.svelte";
  import { glassPop } from "$lib/transitions";
  import { cn, formatBaht } from "$lib/utils";
  import Logo from "./Logo.svelte";
  import SearchSheet from "./SearchSheet.svelte";
  import UserMenu from "./UserMenu.svelte";

  const { site, auth, ui, products, categories } = getStores();
  const darkTheme = $derived(site.appearance === "dark");

  let menuOpen = $state(false);
  let flyout = $state(false);
  let scrollY = $state(0);
  let adminGranted = $state(false);
  const solid = $derived(scrollY > 12);
  let lens = $state({ x: 0, width: 0, visible: false });
  const desktopLinks = $derived<{ href: Pathname; label: string; flyout?: boolean }[]>([
    { href: "/", label: "หน้าหลัก" },
    { href: "/store", label: "ร้านค้า", flyout: true },
    { href: "/status" as const, label: "สถานะ" },
    ...(auth.user
      ? [
          { href: "/topup" as const, label: "เติมเงิน" },
          { href: "/history" as const, label: "ประวัติ" },
        ]
      : []),
  ]);

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

  const flyoutCategories = $derived(categories.categories.filter((c) => c.isActive).slice(0, 6));
  const popular = $derived(
    [...products.products]
      .filter((p) => p.status !== "hidden")
      .sort((a, b) => (b.totalSold ?? 0) - (a.totalSold ?? 0))
      .slice(0, 4),
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
        ],
  );

  afterNavigate(() => {
    menuOpen = false;
    closeFlyout();
    adminGranted = isAdminGranted();
  });

  function openFlyout() {
    products.ensureLoaded();
    categories.ensureLoaded();
    flyout = true;
  }

  function closeFlyout() {
    flyout = false;
  }

  function moveLens(event: Event & { currentTarget: HTMLElement }) {
    const el = event.currentTarget;
    lens = { x: el.offsetLeft, width: el.offsetWidth, visible: true };
  }

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
  bind:scrollY
  onkeydown={(event) => {
    if (event.key === "Escape") {
      closeFlyout();
      menuOpen = false;
    }
  }}
/>

{#if flyout || menuOpen}
  <div
    class="fixed inset-0 z-40 bg-black/30"
    transition:fade={{ duration: 250 }}
    role="presentation"
    onclick={() => {
      closeFlyout();
      menuOpen = false;
    }}
  ></div>
{/if}

<header class="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3">
  <div
    role="presentation"
    class="pointer-events-auto mx-auto max-w-[1100px]"
    onmouseleave={() => {
      lens = { ...lens, visible: false };
      closeFlyout();
    }}
  >
    <nav
      class={cn(
        "nav-bar flex h-12 items-center justify-between gap-4 rounded-full pr-1.5 pl-4",
        solid && "is-solid",
      )}
      aria-label="Primary navigation"
    >
      <Logo />

      <div
        class="relative hidden flex-1 items-center justify-center gap-1 text-[13px] md:flex"
        role="presentation"
        onmouseleave={() => (lens = { ...lens, visible: false })}
      >
        <span
          class={cn(
            "pointer-events-none absolute top-1/2 h-8 -translate-y-1/2 rounded-full bg-foreground/[0.08] transition-[left,width,opacity] duration-300 ease-spring",
            lens.visible ? "opacity-100" : "opacity-0",
          )}
          style:left="{lens.x}px"
          style:width="{lens.width}px"
        ></span>
        {#each desktopLinks as link (link.href)}
          <a
            href={resolve(link.href)}
            class={cn(
              "press relative rounded-full px-3.5 py-1.5 text-foreground/70 transition-colors hover:text-foreground",
              isActive(page.url.pathname, link.href) && "font-medium text-foreground",
            )}
            aria-haspopup={link.flyout ? "true" : undefined}
            aria-expanded={link.flyout ? flyout : undefined}
            onmouseenter={(event) => {
              moveLens(event);
              if (link.flyout) openFlyout();
              else closeFlyout();
            }}
            onfocus={(event) => {
              moveLens(event);
              if (link.flyout) openFlyout();
            }}
          >
            {link.label}
          </a>
        {/each}
        <button
          type="button"
          class="press relative rounded-full px-3.5 py-1.5 text-foreground/70 transition-colors hover:text-foreground"
          onmouseenter={(event) => {
            moveLens(event);
            closeFlyout();
          }}
          onclick={contact}
        >
          ติดต่อเรา
        </button>
      </div>

      <div class="flex items-center gap-1">
        <button
          type="button"
          class="grid size-9 place-items-center rounded-full text-foreground/75 transition-[background-color,color,transform] duration-100 ease-out hover:bg-foreground/[0.07] hover:text-foreground active:scale-[0.97]"
          aria-pressed={darkTheme}
          aria-label={darkTheme ? "สลับเป็นธีมสว่าง" : "สลับเป็นธีมมืด"}
          onclick={() => animateTheme(() => site.toggleMode())}
        >
          {#key darkTheme}
            <span class="theme-swap grid">
              {#if darkTheme}
                <SunIcon class="size-[17px]" strokeWidth={1.75} />
              {:else}
                <MoonIcon class="size-[17px]" strokeWidth={1.75} />
              {/if}
            </span>
          {/key}
        </button>
        <button
          type="button"
          class="grid size-9 place-items-center rounded-full text-foreground/75 transition-[background-color,color,transform] duration-100 ease-out hover:bg-foreground/[0.07] hover:text-foreground active:scale-[0.97]"
          aria-label="ค้นหา"
          onpointerdown={(event) => {
            if (event.button !== 0) return;
            ui.openSearch();
          }}
        >
          <SearchIcon class="size-[17px]" strokeWidth={1.75} />
        </button>

        <div class="hidden items-center gap-1 md:flex">
          {#if auth.user}
            <UserMenu />
          {:else if !auth.loading}
            <a
              href={resolve("/login")}
              class="press rounded-full px-3 py-1.5 text-[13px] text-foreground/75 transition-colors hover:bg-foreground/[0.07] hover:text-foreground"
            >
              เข้าสู่ระบบ
            </a>
            <a
              href={resolve("/register")}
              class="rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-transform duration-100 ease-out active:scale-[0.97]"
            >
              สมัครสมาชิก
            </a>
          {/if}
        </div>

        <button
          type="button"
          class="press relative grid size-9 place-items-center rounded-full transition-colors hover:bg-foreground/[0.07] md:hidden"
          aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"}
          aria-expanded={menuOpen}
          onclick={() => (menuOpen = !menuOpen)}
        >
          <span
            class={cn(
              "absolute h-[1.5px] w-[16px] rounded bg-foreground transition-transform duration-500 ease-spring",
              menuOpen ? "rotate-45" : "-translate-y-[3.5px]",
            )}
          ></span>
          <span
            class={cn(
              "absolute h-[1.5px] w-[16px] rounded bg-foreground transition-transform duration-500 ease-spring",
              menuOpen ? "-rotate-45" : "translate-y-[3.5px]",
            )}
          ></span>
        </button>
      </div>
    </nav>

    {#if flyout}
      <div
        class="mt-2 hidden overflow-hidden rounded-[28px] bg-card shadow-float md:block"
        transition:glassPop
      >
        <div class="grid grid-cols-[1.4fr_1fr_1fr] gap-10 px-10 pt-8 pb-10">
          <div>
            <p class="mb-3 text-xs text-muted-foreground">เลือกซื้อ</p>
            <ul class="stagger-in space-y-1">
              <li style="--i: 0">
                <a href={resolve("/store")} class="press group inline-flex items-center gap-1 text-[17px] font-semibold">
                  ดูทั้งหมด
                  <ArrowUpRightIcon class="size-5 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                </a>
              </li>
              {#each flyoutCategories as category, i (category.id)}
                <li style="--i: {i + 1}">
                  <a
                    href={resolve(`/category/${encodeURIComponent(category.name)}`)}
                    class="press group inline-flex items-center gap-1 text-[17px] font-semibold text-foreground/85 hover:text-foreground"
                  >
                    {category.name}
                    <ArrowUpRightIcon class="size-5 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                  </a>
                </li>
              {/each}
            </ul>
          </div>
          <div>
            <p class="mb-3 text-xs text-muted-foreground">ลิงก์ด่วน</p>
            <ul class="stagger-in space-y-2 text-xs font-semibold">
              <li style="--i: 1">
                <button
                  type="button"
                  class="transition-colors hover:text-muted-foreground"
                  onclick={() => {
                    closeFlyout();
                    ui.openSearch();
                  }}
                >
                  {site.config.searchButtonText}
                </button>
              </li>
              {#each quickLinks as link, i (link.href)}
                <li style="--i: {i + 2}">
                  <a href={resolve(link.href)} class="transition-colors hover:text-muted-foreground">{link.label}</a>
                </li>
              {/each}
            </ul>
          </div>
          <div>
            <p class="mb-3 text-xs text-muted-foreground">ขายดี</p>
            <ul class="stagger-in space-y-2.5">
              {#each popular as product, i (product.id)}
                <li style="--i: {i + 2}">
                  <a href={resolve(`/product/${product.id}`)} class="group flex items-center gap-3">
                    <span class="size-9 shrink-0 overflow-hidden rounded-[10px] bg-secondary">
                      {#if product.imageUrl}
                        <img src={product.imageUrl} alt="" class="size-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      {/if}
                    </span>
                    <span class="truncate text-xs font-semibold">{product.name}</span>
                  </a>
                </li>
              {/each}
            </ul>
          </div>
        </div>
      </div>
    {/if}

    {#if menuOpen}
      <div
        class="mt-2 max-h-[calc(100dvh-5.5rem)] overflow-y-auto rounded-[28px] bg-card shadow-float md:hidden"
        transition:glassPop
        {@attach lockScroll}
      >
        <div class="px-6 pt-5 pb-6">
          {#if auth.user}
            <p class="eyebrow mb-3">{auth.user.displayName} · {formatBaht(auth.user.balance)}</p>
          {/if}
          <ul class="stagger-in flex flex-col">
            {#each mobileLinks as link, i (link.href)}
              <li style="--i: {i}">
                <a
                  href={resolve(link.href)}
                  class="block py-1.5 text-[19px] font-semibold text-foreground/85 active:scale-[0.98] active:text-foreground"
                >
                  {link.label}
                </a>
              </li>
            {/each}
          </ul>
          <div class="mt-5 flex items-center gap-4 border-t border-border pt-4 text-sm text-muted-foreground">
            <button type="button" onclick={contact}>ติดต่อเรา</button>
            {#if auth.user}
              <button type="button" class="ml-auto text-destructive" onclick={signOut}>ออกจากระบบ</button>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
</header>

<SearchSheet />
