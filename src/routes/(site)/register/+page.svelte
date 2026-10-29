<script lang="ts">
  import { resolve } from "$app/paths";
  import type { Pathname } from "$app/types";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import { toast } from "svelte-sonner";
  import { errorMessage } from "$lib/api";
  import AuthShell from "$lib/components/AuthShell.svelte";
  import FloatingField from "$lib/components/FloatingField.svelte";
  import { Button } from "$lib/components/ui/button";
  import { afterAuth } from "$lib/return-to";
  import { getStores } from "$lib/stores";

  const { auth } = getStores();

  let displayName = $state("");
  let email = $state("");
  let password = $state("");
  let confirmPassword = $state("");
  let submitting = $state(false);
  let error = $state("");
  let nameError = $state("");
  let emailError = $state("");
  let passwordError = $state("");
  let confirmError = $state("");

  function focusField(id: string) {
    queueMicrotask(() => document.getElementById(id)?.focus());
  }

  async function onsubmit(event: SubmitEvent) {
    event.preventDefault();
    error = "";
    nameError = "";
    emailError = "";
    passwordError = "";
    confirmError = "";
    if (!displayName.trim()) {
      nameError = "กรุณากรอกชื่อที่แสดง";
      focusField("register-name");
      return;
    }
    if (!email.trim()) {
      emailError = "กรุณากรอกอีเมล";
      focusField("register-email");
      return;
    }
    if (password.length < 6) {
      passwordError = "รหัสผ่านควรมีอย่างน้อย 6 ตัวอักษร";
      focusField("register-password");
      return;
    }
    if (password !== confirmPassword) {
      confirmError = "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน";
      focusField("register-confirm");
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
    toast.success("สมัครสมาชิกสำเร็จ");
    await goto(resolve(afterAuth(page.url.searchParams.get("next")) as Pathname));
  }
</script>

<AuthShell title="สร้างบัญชี" subtitle="บัญชีเดียวสำหรับคำสั่งซื้อ ยอดเงิน และคีย์">
  <form class="flex flex-col gap-3" {onsubmit} novalidate>
    <FloatingField id="register-name" label="ชื่อที่แสดง" autocomplete="nickname" bind:value={displayName} error={nameError} />
    <FloatingField id="register-email" label="อีเมล" type="email" autocomplete="email" bind:value={email} error={emailError} />
    <p class="px-1 text-[13px] text-muted-foreground">รหัสผ่านอย่างน้อย 6 ตัวอักษร</p>
    <FloatingField id="register-password" label="รหัสผ่าน" type="password" autocomplete="new-password" revealable bind:value={password} error={passwordError} />
    <FloatingField id="register-confirm" label="ยืนยันรหัสผ่าน" type="password" autocomplete="new-password" revealable bind:value={confirmPassword} error={confirmError} />

    {#if error}<p class="rounded-xl bg-destructive/10 px-3 py-2 text-[13px] text-destructive" role="alert">{error}</p>{/if}

    <Button type="submit" size="lg" class="mt-1 h-12 w-full" disabled={submitting}>
      {submitting ? "กำลังสร้างบัญชี..." : "สมัครสมาชิก"}
    </Button>
  </form>

  {#snippet footer()}
    มีบัญชีอยู่แล้ว? <a href={resolve(`/login?next=${encodeURIComponent(page.url.searchParams.get("next") ?? "")}` as Pathname)} class="link">เข้าสู่ระบบ<ChevronRightIcon class="size-3.5" /></a>
  {/snippet}
</AuthShell>
