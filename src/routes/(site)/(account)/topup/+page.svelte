<script lang="ts">
  import { toast } from "svelte-sonner";
  import { api, errorMessage } from "$lib/api";
  import FloatingField from "$lib/components/FloatingField.svelte";
  import { Button } from "$lib/components/ui/button";
  import { getStores } from "$lib/stores";
  import { formatBaht } from "$lib/utils";

  const { auth } = getStores();

  let code = $state("");
  let submitting = $state(false);

  const steps = [
    "รับรหัสคูปองจากกิจกรรมหรือทีมงานผู้ดูแลระบบ",
    "กรอกรหัสคูปองลงในช่องด้านบนและกดยืนยัน",
    "ระบบจะทำการตรวจสอบและเพิ่มเครดิตเข้าบัญชีของคุณทันที",
    "หากมีปัญหา สามารถติดต่อทีมงานช่วยเหลือได้ตลอด 24 ชม.",
  ];

  async function onsubmit(event: SubmitEvent) {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      toast.error("กรุณากรอกรหัสคูปอง");
      return;
    }
    submitting = true;
    try {
      const res = await api.post<{ amount: number; balance: number }>("/api/topup", { code: trimmed });
      toast.success(`เติมเงินสำเร็จ จำนวน ${formatBaht(res.amount)}`);
      code = "";
      await auth.refresh();
    } catch (err) {
      toast.error(errorMessage(err) || "เติมเงินไม่สำเร็จ");
    } finally {
      submitting = false;
    }
  }
</script>

<div class="grid gap-5 md:grid-cols-[1.2fr_1fr]">
  <section class="tile p-8 sm:p-10">
    <h2 class="text-[22px] font-semibold">เติมเงินด้วยคูปอง</h2>
    <p class="mt-1 text-[15px] text-muted-foreground">
      ยอดคงเหลือปัจจุบัน <strong class="text-foreground tabular-nums">{formatBaht(auth.user?.balance ?? 0)}</strong>
    </p>
    <form class="mt-8 flex flex-col gap-4" {onsubmit}>
      <FloatingField label="รหัสคูปอง" bind:value={code} disabled={submitting} autocomplete="off" class="[&_input]:uppercase" />
      <Button type="submit" size="lg" class="w-full" disabled={submitting}>
        {submitting ? "กำลังตรวจสอบ..." : "ยืนยันเติมเงิน"}
      </Button>
    </form>
  </section>

  <section class="tile p-8 sm:p-10">
    <h3 class="text-[19px] font-semibold tracking-tight">วิธีเติมเงิน</h3>
    <ol class="mt-5 space-y-4">
      {#each steps as step, i (i)}
        <li class="flex gap-4 text-[15px] leading-relaxed">
          <span class="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">{i + 1}</span>
          <span class="pt-0.5 text-foreground/80">{step}</span>
        </li>
      {/each}
    </ol>
  </section>
</div>
