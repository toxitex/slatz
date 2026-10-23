<script lang="ts">
  import { resolve } from "$app/paths";
  import { goto } from "$app/navigation";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import { toast } from "svelte-sonner";
  import { errorMessage } from "$lib/api";
  import AuthShell from "$lib/components/AuthShell.svelte";
  import FloatingField from "$lib/components/FloatingField.svelte";
  import { Button } from "$lib/components/ui/button";
  import { getStores } from "$lib/stores";

  const { site, auth } = getStores();

  let displayName = $state("");
  let email = $state("");
  let password = $state("");
  let confirmPassword = $state("");
  let submitting = $state(false);
  let error = $state("");
  let success = $state("");

  async function onsubmit(event: SubmitEvent) {
    event.preventDefault();
    error = "";
    success = "";
    if (!displayName || !email || !password || !confirmPassword) {
      error = "กรุณากรอกข้อมูลสมัครสมาชิกให้ครบถ้วน";
      return;
    }
    if (password.length < 6) {
      error = "รหัสผ่านควรมีอย่างน้อย 6 ตัวอักษร";
      return;
    }
    if (password !== confirmPassword) {
      error = "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน";
      return;
    }
    submitting = true;
    try {
      await auth.signUp(email, password, displayName);
    } catch (err) {
      submitting = false;
      error = errorMessage(err) || "สมัครสมาชิกไม่สำเร็จ";
      return;
    }
    submitting = false;
    success = "สมัครสมาชิกสำเร็จ กำลังพาไปยังร้านค้า...";
    toast.success("สมัครสมาชิกสำเร็จ");
    setTimeout(() => goto(resolve("/store")), 900);
  }
</script>

<AuthShell title="สร้างบัญชีของคุณ" subtitle={`บัญชีเดียวสำหรับทุกอย่างใน ${site.config.siteName}`}>
  <form class="flex flex-col gap-3" {onsubmit} novalidate>
    <FloatingField label="ชื่อที่แสดง" autocomplete="nickname" bind:value={displayName} />
    <FloatingField label="อีเมล" type="email" autocomplete="email" bind:value={email} />
    <div class="mt-3 flex flex-col gap-3">
      <FloatingField label="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)" type="password" autocomplete="new-password" revealable bind:value={password} />
      <FloatingField label="ยืนยันรหัสผ่าน" type="password" autocomplete="new-password" revealable bind:value={confirmPassword} />
    </div>

    {#if error}<p class="text-sm text-destructive" role="alert">{error}</p>{/if}
    {#if success}<p class="text-sm text-foreground" role="status">{success}</p>{/if}

    <Button type="submit" size="lg" class="mt-3 w-full" disabled={submitting}>
      {submitting ? "กำลังสร้างบัญชี..." : "สมัครสมาชิก"}
    </Button>
  </form>

  {#snippet footer()}
    มีบัญชีอยู่แล้ว? <a href={resolve("/login")} class="link">เข้าสู่ระบบ<ChevronRightIcon class="size-3.5" /></a>
  {/snippet}
</AuthShell>
