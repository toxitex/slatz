import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { defaultSiteConfig, useSiteConfig, type SiteConfig } from "@/contexts/SiteConfigContext";
import { api } from "@/lib/api";
import type { ConfigSectionKey } from "./sections";
import { ColorRow, Group, ImageRow, TextRow } from "./ui";

type Nested = "theme" | "stats" | "footer" | "store";
type PublicStats = { users: number; products: number; stock: number; sold: number };

const statRows = [
  { key: "users", label: "ผู้ใช้", unit: "คน" },
  { key: "products", label: "สินค้า", unit: "รายการ" },
  { key: "stock", label: "คลัง", unit: "ชิ้น" },
  { key: "sold", label: "ขายแล้ว", unit: "ชิ้น" },
] as const;

function LiveStats() {
  const { config, updateSection } = useSiteConfig();
  const [live, setLive] = useState<PublicStats | null>(null);
  const [error, setError] = useState(false);

  const load = () =>
    api
      .get<PublicStats>("/api/stats")
      .then((data) => {
        setLive(data);
        setError(false);
      })
      .catch(() => setError(true));

  useEffect(() => {
    void load();
  }, []);

  const apply = () => {
    if (!live) return;
    updateSection("stats", {
      ...config.stats,
      users: String(live.users),
      products: String(live.products),
      stock: String(live.stock),
      sold: String(live.sold),
    });
    toast.success("ใช้ตัวเลขจริงบนหน้าแรกแล้ว");
  };

  return (
    <Group
      title="ตัวเลขจริงจากระบบ"
      description="นับลูกค้า สินค้าที่เปิดขาย คลัง และยอดขายจากฐานข้อมูล"
      actions={
        <Button variant="ghost" size="sm" onClick={() => void load()}>
          <RefreshCw />
          รีเฟรช
        </Button>
      }
    >
      {error ? (
        <p className="px-4 py-3 text-xs text-destructive">โหลดตัวเลขจริงไม่สำเร็จ</p>
      ) : (
        <div className="grid grid-cols-4 gap-2 px-4 py-4 text-center">
          {statRows.map((row) => (
            <div key={row.key}>
              <p className="text-[19px] font-semibold tabular-nums">{live ? live[row.key].toLocaleString("th-TH") : "—"}</p>
              <p className="text-[11px] text-muted-foreground">{row.label}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
        <span className="text-xs text-muted-foreground">คัดลอกตัวเลขเหล่านี้ไปแสดงบนหน้าแรก</span>
        <Button size="sm" disabled={!live} onClick={apply}>
          ใช้ตัวเลขจริง
        </Button>
      </div>
    </Group>
  );
}

export function ConfigSection({ section }: { section: ConfigSectionKey }) {
  const { config, updateConfig, updateSection } = useSiteConfig();
  const setNested = <K extends Nested>(key: K, patch: Partial<SiteConfig[K]>) => updateSection(key, { ...config[key], ...patch });

  switch (section) {
    case "branding":
      return (
        <>
          <Group title="ข้อมูลแบรนด์" description="ชื่อร้าน โลโก้ และคำอธิบายที่แสดงบนเครื่องมือค้นหา">
            <TextRow label="ชื่อเว็บ" value={config.siteName} onChange={(siteName) => updateConfig({ siteName })} />
            <TextRow label="คำอธิบาย SEO" value={config.seoDescription} onChange={(seoDescription) => updateConfig({ seoDescription })} />
            <TextRow label="ชื่อแบรนด์/โลโก้" value={config.logoText} onChange={(logoText) => updateConfig({ logoText })} />
            <TextRow label="ปุ่ม CTA" value={config.ctaText} placeholder="เช่น เริ่มต้นเลย!" onChange={(ctaText) => updateConfig({ ctaText })} />
          </Group>
          <Group title="โลโก้">
            <ImageRow label="โลโก้" value={config.logoImageUrl} onChange={(logoImageUrl) => updateConfig({ logoImageUrl })} />
          </Group>
        </>
      );
    case "colors":
      return (
        <Group
          title="สีธีมหน้าร้าน"
          description="ใช้กับหน้าร้านทันที (แดชบอร์ดมีธีมของตัวเอง)"
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                updateSection("theme", defaultSiteConfig.theme);
                toast("รีเซ็ตสีเป็นค่าเริ่มต้นแล้ว");
              }}
            >
              รีเซ็ตสี
            </Button>
          }
        >
          <ColorRow label="Accent" hint="ไฮไลต์และลิงก์" value={config.theme.accentColor} onChange={(accentColor) => setNested("theme", { accentColor })} />
          <ColorRow label="ปุ่ม" value={config.theme.buttonColor} onChange={(buttonColor) => setNested("theme", { buttonColor })} />
          <ColorRow label="พื้นหลัง" value={config.theme.backgroundColor} onChange={(backgroundColor) => setNested("theme", { backgroundColor })} />
          <ColorRow label="การ์ดสินค้า" hint="รองรับ rgba()" value={config.theme.cardColor} onChange={(cardColor) => setNested("theme", { cardColor })} />
          <ColorRow label="ข้อความหลัก" value={config.theme.textColor} onChange={(textColor) => setNested("theme", { textColor })} />
          <ColorRow label="ข้อความรอง" value={config.theme.mutedTextColor} onChange={(mutedTextColor) => setNested("theme", { mutedTextColor })} />
          <ColorRow label="เส้นขอบ" hint="รองรับ rgba()" value={config.theme.borderColor} onChange={(borderColor) => setNested("theme", { borderColor })} />
        </Group>
      );
    case "hero":
      return (
        <>
          <Group title="แบนเนอร์หน้าแรก" description="ส่วนบนสุดของหน้าแรก">
            <TextRow label="ข้อความหลัก" value={config.heroHeadline} onChange={(heroHeadline) => updateConfig({ heroHeadline })} />
            <TextRow label="คำอธิบาย" value={config.heroSubtitle} onChange={(heroSubtitle) => updateConfig({ heroSubtitle })} />
            <TextRow
              label="ช่องค้นหา (Placeholder)"
              value={config.searchPlaceholder}
              onChange={(searchPlaceholder) => updateConfig({ searchPlaceholder })}
            />
          </Group>
          <Group title="รูปแบนเนอร์">
            <ImageRow label="แบนเนอร์" value={config.heroImageUrl} onChange={(heroImageUrl) => updateConfig({ heroImageUrl })} />
          </Group>
        </>
      );
    case "announcement":
      return (
        <Group title="กระดานประกาศ" description="แสดงบนหน้าแรกของร้าน">
          <TextRow label="หัวข้อประกาศ" value={config.announcementTitle} onChange={(announcementTitle) => updateConfig({ announcementTitle })} />
          <TextRow
            label="รายละเอียดประกาศ"
            multiline
            value={config.announcementBody}
            onChange={(announcementBody) => updateConfig({ announcementBody })}
          />
        </Group>
      );
    case "stats":
      return (
        <>
          <LiveStats />
          {statRows.map((row) => (
            <Group key={row.key} title={`ตัวเลข — ${row.label}`}>
              <TextRow label="ตัวเลข" value={config.stats[row.key]} onChange={(value) => setNested("stats", { [row.key]: value })} />
              <TextRow
                label="ป้ายกำกับ"
                value={config.stats[`${row.key}Label`]}
                onChange={(value) => setNested("stats", { [`${row.key}Label`]: value })}
              />
              <TextRow
                label="หน่วยนับ"
                placeholder={row.unit}
                value={config.stats[`${row.key}Unit`]}
                onChange={(value) => setNested("stats", { [`${row.key}Unit`]: value })}
              />
            </Group>
          ))}
        </>
      );
    case "store-config":
      return (
        <Group title="ข้อความหน้าร้านค้า">
          <TextRow label="หัวข้อหมวดสินค้า" value={config.store.sectionTitle} onChange={(sectionTitle) => setNested("store", { sectionTitle })} />
          <TextRow
            label="ข้อความเมื่อไม่มีสินค้า"
            value={config.store.emptyStateText}
            onChange={(emptyStateText) => setNested("store", { emptyStateText })}
          />
          <TextRow
            label="ข้อความปุ่มสินค้า"
            placeholder="เช่น ดูรายละเอียด"
            value={config.store.productButtonText}
            onChange={(productButtonText) => setNested("store", { productButtonText })}
          />
        </Group>
      );
    case "footer":
      return (
        <>
          <Group title="ข้อมูลติดต่อ">
            <TextRow label="ข้อความแบรนด์ท้ายเว็บ" multiline value={config.footer.brandText} onChange={(brandText) => setNested("footer", { brandText })} />
            <TextRow label="อีเมลติดต่อ" type="email" value={config.footer.contactEmail} onChange={(contactEmail) => setNested("footer", { contactEmail })} />
          </Group>
          <Group title="โซเชียล" description="เว้นว่างเพื่อซ่อนลิงก์">
            <TextRow label="Discord URL" value={config.footer.discordUrl} onChange={(discordUrl) => setNested("footer", { discordUrl })} />
            <TextRow label="LINE URL" placeholder="https://line.me/..." value={config.footer.lineUrl} onChange={(lineUrl) => setNested("footer", { lineUrl })} />
            <TextRow
              label="Facebook URL"
              placeholder="https://facebook.com/..."
              value={config.footer.facebookUrl}
              onChange={(facebookUrl) => setNested("footer", { facebookUrl })}
            />
            <TextRow
              label="Instagram URL"
              placeholder="https://instagram.com/..."
              value={config.footer.instagramUrl}
              onChange={(instagramUrl) => setNested("footer", { instagramUrl })}
            />
          </Group>
        </>
      );
  }
}
