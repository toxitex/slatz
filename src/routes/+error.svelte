<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import Footer from "$lib/components/Footer.svelte";
  import TopNav from "$lib/components/TopNav.svelte";
  import { Button } from "$lib/components/ui/button";
</script>

<div class="flex min-h-dvh flex-col">
  <TopNav />
  <main class="container-apple flex flex-1 flex-col items-center justify-center py-32 pt-44 text-center">
    <p class="display text-[72px] text-foreground/10 sm:text-[96px]">{page.status}</p>
    <h1 class="display -mt-4 text-[28px] sm:text-[40px]">
      {page.status === 404 ? "ไม่พบหน้าที่คุณต้องการ" : "เกิดข้อผิดพลาด"}
    </h1>
    <p class="mt-3 max-w-md text-[17px] text-muted-foreground">
      {page.status === 404 ? "หน้านี้อาจถูกย้ายหรือไม่มีอยู่แล้ว ลองกลับไปหน้าหลักหรือเลือกซื้อสินค้าในร้านค้า" : page.error?.message}
    </p>
    <div class="mt-8 flex flex-wrap items-center justify-center gap-5">
      <Button href={resolve("/")} size="lg">กลับหน้าหลัก</Button>
      <a href={resolve("/store")} class="link text-[17px]">ไปที่ร้านค้า<ChevronRightIcon class="size-4" /></a>
    </div>
  </main>
  <Footer />
</div>
