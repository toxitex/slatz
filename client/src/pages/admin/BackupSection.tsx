import { useState } from "react";
import { Download, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { Group } from "./ui";

export function BackupSection() {
  const { exportConfig, importConfig, resetConfig } = useSiteConfig();
  const [text, setText] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const onExport = async () => {
    const json = exportConfig();
    setText(json);
    try {
      await navigator.clipboard.writeText(json);
      toast("คัดลอก JSON การตั้งค่าแล้ว");
    } catch {
      toast("สร้าง JSON แล้ว คัดลอกจากช่องด้านล่างได้");
    }
  };

  const onImport = () => {
    if (!text.trim()) {
      toast("กรุณาวาง JSON ก่อนนำเข้า");
      return;
    }
    toast(importConfig(text) ? "นำเข้าการตั้งค่าเรียบร้อย" : "นำเข้าไม่สำเร็จ กรุณาตรวจสอบ JSON");
  };

  return (
    <>
      <Group title="สำรองและกู้คืนการตั้งค่าหน้าร้าน" description="ส่งออก/นำเข้าข้อความ สี และรูปภาพทั้งหมดเป็น JSON">
        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => void onExport()}>
              <Download />
              ส่งออก JSON
            </Button>
            <Button variant="secondary" size="sm" onClick={onImport}>
              <Upload />
              นำเข้า JSON
            </Button>
            <Button variant="ghost" size="sm" className="ml-auto text-destructive hover:text-destructive" onClick={() => setConfirmReset(true)}>
              <RotateCcw />
              รีเซ็ตค่าเริ่มต้น
            </Button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            placeholder="วางหรือคัดลอก JSON การตั้งค่าที่นี่"
            className="w-full rounded-xl bg-secondary p-3 font-mono text-xs leading-relaxed outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
          />
        </div>
      </Group>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>รีเซ็ตการตั้งค่าหน้าร้านทั้งหมด?</AlertDialogTitle>
            <AlertDialogDescription>ข้อความ สี และรูปภาพทั้งหมดจะกลับเป็นค่าเริ่มต้น สินค้าและคำสั่งซื้อไม่ได้รับผลกระทบ</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                resetConfig();
                toast("รีเซ็ตเป็นค่าเริ่มต้นแล้ว");
              }}
            >
              รีเซ็ต
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
