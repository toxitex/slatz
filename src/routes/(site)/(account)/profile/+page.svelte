<script lang="ts">
  import { toast } from "svelte-sonner";
  import { api, errorMessage } from "$lib/api";
  import FloatingField from "$lib/components/FloatingField.svelte";
  import { Button } from "$lib/components/ui/button";
  import { getStores } from "$lib/stores";
  import { formatBaht } from "$lib/utils";

  const { auth } = getStores();

  const THAI_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];

  function formatThaiDate(value?: string) {
    if (!value) return "ไม่ทราบ";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "ไม่ทราบ";
    return `${date.getDate()} ${THAI_MONTHS[date.getMonth()]} ${date.getFullYear() + 543}`;
  }

  let currentPassword = $state("");
  let newPassword = $state("");
  let confirmPassword = $state("");
  let submitting = $state(false);

  async function onsubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!currentPassword.trim()) {
      toast.error("กรุณากรอกรหัสผ่านปัจจุบัน");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }
    submitting = true;
    try {
      await api.post("/api/auth/change-password", { currentPassword, newPassword });
      toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
      currentPassword = "";
      newPassword = "";
      confirmPassword = "";
    } catch (err) {
      toast.error(errorMessage(err) || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      submitting = false;
    }
  }
</script>

{#if auth.user}
  <div class="grid gap-5 md:grid-cols-[1fr_1.3fr]">
    <section class="tile p-8">
      <h2 class="section-title">ข้อมูลบัญชี</h2>
      <dl class="mt-4 divide-y divide-border text-[15px]">
        <div class="flex justify-between gap-4 py-3"><dt class="text-muted-foreground">ชื่อที่แสดง</dt><dd>{auth.user.displayName}</dd></div>
        <div class="flex justify-between gap-4 py-3"><dt class="text-muted-foreground">อีเมล</dt><dd class="truncate">{auth.user.email}</dd></div>
        <div class="flex justify-between gap-4 py-3">
          <dt class="text-muted-foreground">ยอดเงิน</dt><dd class="tabular-nums">{formatBaht(auth.user.balance)}</dd>
        </div>
        <div class="flex justify-between gap-4 py-3">
          <dt class="text-muted-foreground">สมาชิกตั้งแต่</dt><dd>{formatThaiDate(auth.user.createdAt)}</dd>
        </div>
      </dl>
    </section>

    <section class="tile p-8">
      <h2 class="section-title">เปลี่ยนรหัสผ่าน</h2>
      <form class="mt-5 flex flex-col gap-3" {onsubmit}>
        <FloatingField label="รหัสผ่านปัจจุบัน" type="password" revealable autocomplete="current-password" bind:value={currentPassword} disabled={submitting} />
        <FloatingField label="รหัสผ่านใหม่ (6+ ตัวอักษร)" type="password" revealable autocomplete="new-password" bind:value={newPassword} disabled={submitting} />
        <FloatingField label="ยืนยันรหัสผ่านใหม่" type="password" autocomplete="new-password" bind:value={confirmPassword} disabled={submitting} />
        <Button type="submit" size="lg" class="mt-2 w-full" disabled={submitting}>
          {submitting ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
        </Button>
      </form>
    </section>
  </div>
{/if}
