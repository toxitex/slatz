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

  const { auth } = getStores();

  let email = $state("");
  let password = $state("");
  let submitting = $state(false);
  let error = $state("");
  let success = $state("");

  async function onsubmit(event: SubmitEvent) {
    event.preventDefault();
    error = "";
    success = "";
    if (!email || !password) {
      error = "กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน";
      return;
    }
    submitting = true;
    try {
      await auth.signIn(email, password);
    } catch (err) {
      submitting = false;
      error = errorMessage(err) || "เข้าสู่ระบบไม่สำเร็จ";
      return;
    }
    submitting = false;
    success = "เข้าสู่ระบบสำเร็จ กำลังพาไปยังหน้าร้านค้า...";
    toast.success("เข้าสู่ระบบสำเร็จ");
    setTimeout(() => goto(resolve("/store")), 650);
  }
</script>

<AuthShell title="ลงชื่อเข้าใช้" subtitle="จัดการคำสั่งซื้อ ยอดเงิน และคีย์ของคุณได้ในที่เดียว">
  <form class="flex flex-col gap-3" {onsubmit} novalidate>
    <FloatingField label="อีเมล" type="email" autocomplete="email" bind:value={email} />
    <FloatingField label="รหัสผ่าน" type="password" autocomplete="current-password" revealable bind:value={password} />

    {#if error}<p class="rounded-xl bg-destructive/10 px-3 py-2 text-[13px] text-destructive" role="alert">{error}</p>{/if}
    {#if success}<p class="rounded-xl bg-secondary px-3 py-2 text-[13px]" role="status">{success}</p>{/if}

    <Button type="submit" size="lg" class="mt-1 h-12 w-full" disabled={submitting}>
      {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
    </Button>
  </form>

  {#snippet footer()}
    ยังไม่มีบัญชี? <a href={resolve("/register")} class="link">สร้างบัญชีใหม่<ChevronRightIcon class="size-3.5" /></a>
  {/snippet}
</AuthShell>
