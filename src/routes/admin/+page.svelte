<script lang="ts">
  import { resolve } from "$app/paths";
  import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import LockIcon from "@lucide/svelte/icons/lock";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
  import SearchIcon from "@lucide/svelte/icons/search";
  import { toast } from "svelte-sonner";
  import CheckIcon from "@lucide/svelte/icons/check";
  import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
  import ExternalLinkIcon from "@lucide/svelte/icons/external-link";
  import LoaderCircleIcon from "@lucide/svelte/icons/loader-circle";
  import {
    getAdminCode,
    getAdminSection,
    grantAdmin,
    isAdminGranted,
    revokeAdmin,
    setAdminSection,
    verifyAdminCode,
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
  import VouchersSection from "$lib/components/admin/VouchersSection.svelte";
  import FloatingField from "$lib/components/FloatingField.svelte";
  import LogoIcon from "$lib/components/LogoIcon.svelte";
  import { Button } from "$lib/components/ui/button";
  import { getStores } from "$lib/stores";
  import { cn } from "$lib/utils";

  const { site, products, categories, coupons } = getStores();

  let authorized = $state(isAdminGranted());
  let accessCode = $state("");
  let verifying = $state(false);
  let filter = $state("");
  let mobileDetail = $state(false);
  let active = $state<SectionKey>(initialSection());

  let productsSection = $state<ProductsSection>();
  let usersSection = $state<UsersSection>();
  let ordersSection = $state<OrdersSection>();
  let overviewSection = $state<OverviewSection>();
  let vouchersSection = $state<VouchersSection>();

  if (isAdminGranted()) {
    loadAdminData();
    // The stored code may have been rotated on the server since this tab unlocked.
    void verifyAdminCode(getAdminCode() ?? "").then((result) => {
      if (result !== "invalid") return;
      revokeAdmin();
      authorized = false;
      toast.error("รหัสแอดมินถูกเปลี่ยน กรุณาเข้าสู่ระบบอีกครั้ง");
    });
  }

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
      case "overview":
        return "ข้อมูลจริงจากฐานข้อมูล";
      default:
        return "แก้ไขแล้วแสดงบนหน้าร้านทันที";
    }
  });

  function select(key: SectionKey) {
    active = key;
    mobileDetail = true;
    setAdminSection(key);
  }

  async function onsubmit(event: SubmitEvent) {
    event.preventDefault();
    const code = accessCode.trim();
    if (!code) return;
    verifying = true;
    const result = await verifyAdminCode(code);
    verifying = false;
    if (result !== "ok") {
      toast.error(result === "invalid" ? "รหัสแอดมินไม่ถูกต้อง" : "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่");
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
    if (active === "overview") await Promise.all([overviewSection?.refresh(), products.refresh()]);
    else if (active === "products") await products.refresh();
    else if (active === "categories") await categories.refresh();
    else if (active === "coupons") await coupons.refresh();
    else if (active === "users") await usersSection?.refresh();
    else if (active === "orders") await ordersSection?.refresh();
    else if (active === "vouchers") await vouchersSection?.refresh();
  }

  async function addToActive() {
    if (active === "products") await productsSection?.add();
    else if (active === "categories") await categories.add();
    else if (active === "coupons") await coupons.add();
  }

  const canRefresh = $derived(
    ["overview", "products", "categories", "coupons", "vouchers", "users", "orders"].includes(active),
  );
  const addLabel = $derived(
    active === "products" ? "เพิ่มสินค้า" : active === "categories" ? "เพิ่มหมวดหมู่" : active === "coupons" ? "เพิ่มคูปอง" : null,
  );
</script>

{#snippet saveStatus()}
  <span class="flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground" aria-live="polite">
    {#if site.saveState === "pending" || site.saveState === "saving"}
      <LoaderCircleIcon class="size-3.5 animate-spin" />กำลังบันทึก...
    {:else if site.saveState === "saved"}
      <CheckIcon class="size-3.5 text-foreground" />บันทึกแล้ว · อัปเดตหน้าร้าน
    {:else if site.saveState === "error"}
      <CircleAlertIcon class="size-3.5 text-destructive" />
      <span class="text-destructive" title={site.saveError ?? undefined}>บันทึกไม่สำเร็จ</span>
      <button type="button" class="text-link hover:underline" onclick={() => site.retrySave()}>ลองอีกครั้ง</button>
    {:else}
      บันทึกอัตโนมัติ
    {/if}
  </span>
{/snippet}

<svelte:head>
  <title>แอดมิน · {site.config.siteName}</title>
</svelte:head>

{#if !authorized}
  <main class="grid min-h-dvh place-items-center bg-background px-5">
    <section
      class="reveal relative w-full max-w-[420px] rounded-[32px] bg-card px-6 py-10 text-center shadow-float sm:px-10"
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
        <Button type="submit" size="lg" class="w-full" disabled={verifying}>
          {verifying ? "กำลังตรวจสอบ..." : "เข้าสู่แดชบอร์ด"}
        </Button>
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

      <label class="mx-4 mb-1 flex h-9 items-center gap-2 rounded-xl bg-card px-3 text-muted-foreground shadow-[0_0_0_0.5px_var(--syncx-border)]">
        <SearchIcon class="size-3.5" />
        <input bind:value={filter} placeholder="ค้นหา" class="w-full bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground" />
      </label>

      <nav class="min-h-0 flex-1 overflow-y-auto px-4 pb-4" aria-label="หัวข้อการตั้งค่า">
        {#each visibleGroups as group (group.title)}
          <p class="px-3 pt-4 pb-1.5 text-[12px] font-medium text-muted-foreground">{group.title}</p>
          <ul class="divide-y divide-border overflow-hidden rounded-2xl bg-card shadow-[0_0_0_0.5px_var(--syncx-border)]">
            {#each group.items as item (item.key)}
              <li>
                <button
                  type="button"
                  class={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[14px] transition-colors",
                    item.key === active
                      ? "bg-[color-mix(in_srgb,var(--syncx-accent)_14%,transparent)] font-medium text-[var(--syncx-accent)]"
                      : "hover:bg-foreground/[0.03]",
                  )}
                  aria-current={item.key === active ? "page" : undefined}
                  onclick={() => select(item.key)}
                >
                  <item.icon
                    class={cn("size-4 shrink-0", item.key === active ? "text-current" : "text-foreground/70")}
                    strokeWidth={1.75}
                  />
                  <span class="flex-1 truncate">{item.label}</span>
                  <ChevronRightIcon class="size-4 text-muted-foreground/50 md:hidden" />
                </button>
              </li>
            {/each}
          </ul>
        {/each}
      </nav>

      <div class="flex items-center gap-2 px-4 pt-2 pb-4">
        <Button href={resolve("/")} target="_blank" rel="noopener" variant="secondary" size="sm" class="flex-1 bg-card">
          หน้าร้าน<ExternalLinkIcon />
        </Button>
        <Button variant="secondary" size="sm" class="flex-1 bg-card" onclick={lock}><LockIcon />ล็อก</Button>
      </div>
    </aside>

    <main class={cn("flex min-w-0 flex-1 flex-col border-l border-border", !mobileDetail && "max-md:hidden")}>
      <header class="glass sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 sm:px-6">
        <button
          type="button"
          class="-ml-1 flex items-center text-link md:hidden"
          onclick={() => (mobileDetail = false)}
        >
          <ChevronLeftIcon class="size-5" />การตั้งค่า
        </button>
        <div class="min-w-0 flex-1 max-md:text-center">
          <h1 class="truncate text-[15px] font-bold">{activeItem.label}</h1>
          <p class="truncate text-[11px] text-muted-foreground max-md:hidden">{subtitle}</p>
        </div>
        {#if isConfigSection(active)}
          {@render saveStatus()}
        {/if}
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
            active === "products" || active === "overview" || active === "orders" || active === "users"
              ? "max-w-none"
              : "max-w-3xl",
          )}
        >
          {#if active === "overview"}
            <OverviewSection bind:this={overviewSection} onnavigate={select} />
          {:else if isConfigSection(active)}
            <ConfigSection section={active} />
          {:else if active === "products"}
            <ProductsSection bind:this={productsSection} />
          {:else if active === "categories"}
            <CategoriesSection />
          {:else if active === "coupons"}
            <CouponsSection />
          {:else if active === "vouchers"}
            <VouchersSection bind:this={vouchersSection} />
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
