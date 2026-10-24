<script lang="ts">
  import DownloadIcon from "@lucide/svelte/icons/download";
  import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
  import UploadIcon from "@lucide/svelte/icons/upload";
  import { toast } from "svelte-sonner";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { Button } from "$lib/components/ui/button";
  import { getStores } from "$lib/stores";
  import SettingsGroup from "./SettingsGroup.svelte";

  const { site } = getStores();

  let text = $state("");
  let copied = $state(false);
  let confirmReset = $state(false);

  export async function exportConfig() {
    text = site.export();
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      toast("คัดลอก JSON การตั้งค่าแล้ว");
    } catch {
      toast("สร้าง JSON แล้ว สามารถคัดลอกจากช่องด้านล่างได้");
    }
  }

  function importConfig() {
    if (!text.trim()) {
      toast("กรุณาวาง JSON ก่อนนำเข้า");
      return;
    }
    toast(site.import(text) ? "นำเข้าการตั้งค่าเรียบร้อย" : "นำเข้าไม่สำเร็จ กรุณาตรวจสอบ JSON");
  }

  function reset() {
    site.reset();
    confirmReset = false;
    toast("รีเซ็ตเป็นค่าเริ่มต้นแล้ว");
  }
</script>

<SettingsGroup title="สำรองและกู้คืนการตั้งค่า" description="ข้อความ สี โลโก้ และตัวเลขบนหน้าร้าน ทั้งก้อนนี้เป็น JSON คำสั่งซื้อ ลูกค้า และสินค้าในฐานข้อมูลไม่อยู่ในไฟล์นี้">
  <div class="flex flex-col gap-3 p-4">
    <div class="flex flex-wrap gap-2">
      <Button variant="secondary" onclick={exportConfig}><DownloadIcon />{copied ? "คัดลอกแล้ว" : "ส่งออก JSON"}</Button>
      <Button variant="secondary" onclick={importConfig}><UploadIcon />นำเข้า JSON</Button>
      <Button variant="destructive" class="ml-auto" onclick={() => (confirmReset = true)}><RotateCcwIcon />รีเซ็ตค่าเริ่มต้น</Button>
    </div>
    <textarea
      bind:value={text}
      rows={12}
      placeholder="วางหรือคัดลอก JSON การตั้งค่าที่นี่"
      class="w-full rounded-xl bg-secondary p-3 font-mono text-xs leading-relaxed outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    ></textarea>
  </div>
</SettingsGroup>

<AlertDialog.Root bind:open={confirmReset}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>รีเซ็ตการตั้งค่าทั้งหมด?</AlertDialog.Title>
      <AlertDialog.Description>ข้อความ สี และรูปภาพทั้งหมดจะกลับเป็นค่าเริ่มต้น</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>ยกเลิก</AlertDialog.Cancel>
      <AlertDialog.Action class="bg-destructive text-white hover:bg-destructive/90" onclick={reset}>รีเซ็ต</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
