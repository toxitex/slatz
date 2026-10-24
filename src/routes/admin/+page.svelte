<script lang="ts">
  import { resolve } from "$app/paths";
  import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import LockIcon from "@lucide/svelte/icons/lock";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
  import SearchIcon from "@lucide/svelte/icons/search";
  import { toast } from "svelte-sonner";
  import {
    ADMIN_ACCESS_CODE,
    getAdminSection,
    grantAdmin,
    isAdminGranted,
    revokeAdmin,
    setAdminSection,
  } from "$lib/admin-access";
  import BackupSection from "$lib/components/admin/BackupSection.svelte";
  import CategoriesSection from "$lib/components/admin/CategoriesSection.svelte";
  import ConfigSection from "$lib/components/admin/ConfigSection.svelte";
  import CouponsSection from "$lib/components/admin/CouponsSection.svelte";
  import OrdersSection from "$lib/components/admin/OrdersSection.svelte";
  import OverviewSection from "$lib/components/admin/OverviewSection.svelte";
  import ProductsSection from "$lib/components/admin/ProductsSection.svelte";
  import { isConfigSection, sectionGroups, sectionItems, type SectionKey } from "$lib/components/admin/sections";
  import UsersSection from "$lib/components/admin/UsersSection.svelte";
  import FloatingField from "$lib/components/FloatingField.svelte";
  import Grainient from "$lib/components/fx/Grainient.svelte";
  import LogoIcon from "$lib/components/LogoIcon.svelte";
  import { Button } from "$lib/components/ui/button";
  import { getStores } from "$lib/stores";
  import { cn } from "$lib/utils";

  const { site, products, categories, coupons } = getStores();

  let authorized = $state(isAdminGranted());
  let accessCode = $state("");
  let filter = $state("");
  let mobileDetail = $state(false);
  let active = $state<SectionKey>(initialSection());

  let productsSection = $state<ProductsSection>();
  let usersSection = $state<UsersSection>();
  let ordersSection = $state<OrdersSection>();
  let overviewSection = $state<OverviewSection>();

  if (isAdminGranted()) loadAdminData();

  function initialSection(): SectionKey {
    const saved = getAdminSection();
    return sectionItems.find((item) => item.key === saved)?.key ?? "overview";
  }

  function loadAdminData() {
    void products.refresh();
    categories.ensureLoaded();
    coupons.ensureLoaded();
  }

  const activeItem = $derived(sectionItems.find((item) => item.key === active) ?? sectionItems[0]);
  const visibleGroups = $derived.by(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return sectionGroups;
    return sectionGroups
      .map((group) => ({ ...group, items: group.items.filter((item) => item.label.toLowerCase().includes(q)) }))
      .filter((group) => group.items.length);
  });

  const subtitle = $derived.by(() => {
    switch (active) {
      case "overview":
        return "จากคำสั่งซื้อจริง";
      case "products":
        return `${products.products.length} รายการ · ลากเพื่อจัดหมวด`;
      case "categories":
        return `${categories.categories.length} หมวด`;
      case "coupons":
        return `${coupons.coupons.length} โค้ด`;
      default:
        return "บันทึกอัตโนมัติ";
    }
  });

  function select(key: SectionKey) {
    active = key;
    mobileDetail = true;
    setAdminSection(key);
  }

  function onsubmit(event: SubmitEvent) {
    event.preventDefault();
    const code = accessCode.trim();
    if (code !== ADMIN_ACCESS_CODE) {
      toast("รหัสแอดมินไม่ถูกต้อง");
      return;
    }
    grantAdmin(code);
    authorized = true;
    accessCode = "";
    loadAdminData();
    toast("เข้าสู่โหมดแอดมินแล้ว");
  }

  function lock() {
    revokeAdmin();
    authorized = false;
    toast("ล็อกแดชบอร์ดแอดมินแล้ว");
  }

  async function refreshActive() {
    if (active === "overview") await overviewSection?.refresh();
    else if (active === "products") await products.refresh();
    else if (active === "categories") await categories.refresh();
    else if (active === "coupons") await coupons.refresh();
    else if (active === "users") await usersSection?.refresh();
    else if (active === "orders") await ordersSection?.refresh();
  }

  async function addToActive() {
    if (active === "products") await productsSection?.add();
    else if (active === "categories") await categories.add();
    else if (active === "coupons") await coupons.add();
  }

  const canRefresh = $derived(["overview", "products", "categories", "coupons", "users", "orders"].includes(active));
  const addLabel = $derived(
    active === "products" ? "เพิ่มสินค้า" : active === "categories" ? "เพิ่มหมวดหมู่" : active === "coupons" ? "เพิ่มคูปอง" : null,
  );
</script>

<svelte:head>
  <title>แอดมิน · {site.config.siteName}</title>
</svelte:head>

{#if !authorized}
  <main class="relative grid min-h-dvh place-items-center overflow-hidden bg-background px-5">
    <Grainient
      class="!absolute inset-0"
      colors={["#f5f5f7", "#d8d8dc", "#8e8e93", "#3a3a3c", "#0b0b0c"]}
      angle={160}
      speed={0.45}
      silk={0.7}
      grainAmount={0.05}
    />
    <section
      class="liquid-glass reveal relative w-full max-w-[420px] rounded-[32px] px-6 py-10 text-center [--glass-alpha:58%] [--glass-blur:30px] sm:px-10"
      aria-label="Admin access required"
    >
      <span class="mx-auto grid size-16 place-items-center rounded-[18px] bg-foreground text-background shadow-float">
        <LockIcon class="size-7" strokeWidth={1.75} />
      </span>
      <h1 class="display mt-6 text-[32px]">สำหรับผู้ดูแลร้านเท่านั้น</h1>
      <p class="mt-2 text-[15px] text-muted-foreground">
        ใส่รหัสแอดมินเพื่อแก้ไขสี โลโก้ คำบนเว็บไซต์ และข้อมูลสินค้า
      </p>
      <form class="mt-8 flex flex-col gap-3 text-left" {onsubmit}>
        <FloatingField label="รหัสแอดมิน" type="password" autocomplete="current-password" bind:value={accessCode} />
        <Button type="submit" size="lg" class="w-full">เข้าสู่แดชบอร์ด</Button>
      </form>
      <a href={resolve("/")} class="link mt-6 text-sm">กลับหน้าร้าน<ChevronRightIcon class="size-3.5" /></a>
    </section>
  </main>
{:else}
  <div class="flex h-dvh bg-background text-[13px]">
    <aside
      class={cn(
        "flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden bg-background md:w-[280px]",
        mobileDetail && "max-md:hidden",
      )}
    >
      <div class="flex items-center gap-2.5 px-5 pt-5 pb-3">
        <span class="grid size-8 place-items-center overflow-hidden rounded-[9px] bg-foreground text-background">
          {#if site.config.logoImageUrl}
            <img src={site.config.logoImageUrl} alt="" class="size-full object-cover" />
          {:else}
            <LogoIcon size={15} />
          {/if}
        </span>
        <div class="min-w-0">
          <p class="truncate text-[14px] font-semibold">{site.config.siteName}</p>
          <p class="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span class={cn("size-1.5 rounded-full", products.databaseMode ? "bg-foreground" : "bg-muted-foreground/40")}></span>
            {products.loading ? "กำลังโหลดข้อมูล..." : products.databaseMode ? "SQLite: ออนไลน์" : "SQLite: ออฟไลน์"}
          </p>
        </div>
      </div>

      <label class="mx-4 mb-1 flex h-9 items-center gap-2 rounded-xl bg-card px-3 text-muted-foreground shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)]">
        <SearchIcon class="size-3.5" />
        <input bind:value={filter} placeholder="ค้นหา" class="w-full bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground" />
      </label>

      <nav class="min-h-0 flex-1 overflow-y-auto px-4 pb-4" aria-label="หัวข้อการตั้งค่า">
        {#each visibleGroups as group (group.title)}
          <p class="px-3 pt-4 pb-1.5 text-[12px] font-medium text-muted-foreground">{group.title}</p>
          <ul class="divide-y divide-border overflow-hidden rounded-2xl bg-card shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)]">
            {#each group.items as item (item.key)}
              <li>
                <button
                  type="button"
                  class={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[14px] transition-colors",
                    item.key === active ? "bg-foreground/[0.06] font-medium" : "hover:bg-foreground/[0.03]",
                  )}
                  aria-current={item.key === active ? "page" : undefined}
                  onclick={() => select(item.key)}
                >
                  <item.icon class="size-4 shrink-0 text-foreground/70" strokeWidth={1.75} />
                  <span class="flex-1 truncate">{item.label}</span>
                  <ChevronRightIcon class="size-4 text-muted-foreground/50 md:hidden" />
                </button>
              </li>
            {/each}
          </ul>
        {/each}
      </nav>

      <div class="flex items-center gap-2 px-4 pt-2 pb-4">
        <Button href={resolve("/store")} variant="secondary" size="sm" class="flex-1 bg-card">ดูร้านค้า</Button>
        <Button variant="secondary" size="sm" class="flex-1 bg-card" onclick={lock}><LockIcon />ล็อก</Button>
      </div>
    </aside>

    <main class={cn("flex min-w-0 flex-1 flex-col", !mobileDetail && "max-md:hidden")}>
      <header class="glass sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 sm:px-6">
        <button
          type="button"
          class="-ml-1 flex items-center text-link md:hidden"
          onclick={() => (mobileDetail = false)}
        >
          <ChevronLeftIcon class="size-5" />การตั้งค่า
        </button>
        <div class="min-w-0 flex-1 max-md:text-center">
          <h1 class="truncate text-[15px] font-semibold">{activeItem.label}</h1>
          <p class="truncate text-[11px] text-muted-foreground max-md:hidden">{subtitle}</p>
        </div>
        {#if canRefresh}
          <Button variant="ghost" size="icon-sm" aria-label="โหลดใหม่" onclick={refreshActive}><RefreshCwIcon /></Button>
        {/if}
        {#if addLabel}
          <Button size="sm" onclick={addToActive}><PlusIcon />{addLabel}</Button>
        {/if}
      </header>

      <div class="flex-1 overflow-y-auto">
        <div
          class={cn(
            "mx-auto flex w-full flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8",
            active === "products" ? "max-w-none" : active === "overview" ? "max-w-5xl" : "max-w-3xl",
          )}
        >
          {#if active === "overview"}
            <OverviewSection bind:this={overviewSection} />
          {:else if isConfigSection(active)}
            <ConfigSection section={active} />
          {:else if active === "products"}
            <ProductsSection bind:this={productsSection} />
          {:else if active === "categories"}
            <CategoriesSection />
          {:else if active === "coupons"}
            <CouponsSection />
          {:else if active === "users"}
            <UsersSection bind:this={usersSection} />
          {:else if active === "orders"}
            <OrdersSection bind:this={ordersSection} />
          {:else if active === "backup"}
            <BackupSection />
          {/if}
          {#if !products.databaseMode && (active === "products" || active === "categories" || active === "coupons")}
            <p class="text-center text-[11px] text-muted-foreground">Local Fallback Mode — ข้อมูลถูกเก็บในเบราว์เซอร์นี้</p>
          {/if}
        </div>
      </div>
    </main>
  </div>
{/if}
