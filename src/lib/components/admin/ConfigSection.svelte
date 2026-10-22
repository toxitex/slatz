<script lang="ts">
  import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
  import { toast } from "svelte-sonner";
  import { Button } from "$lib/components/ui/button";
  import { getStores } from "$lib/stores";
  import ColorRow from "./ColorRow.svelte";
  import ImageRow from "./ImageRow.svelte";
  import SettingsGroup from "./SettingsGroup.svelte";
  import type { ConfigSectionKey } from "./sections";
  import TextRow from "./TextRow.svelte";

  let { section }: { section: ConfigSectionKey } = $props();

  const { site } = getStores();

  const statRows = [
    { key: "users", label: "ผู้ใช้", unitHint: "คน" },
    { key: "products", label: "สินค้า", unitHint: "รายการ" },
    { key: "stock", label: "คลัง", unitHint: "ชิ้น" },
    { key: "sold", label: "ขายแล้ว", unitHint: "ชิ้น" },
  ] as const;
</script>

{#if section === "branding"}
  <SettingsGroup title="ข้อมูลแบรนด์" description="ชื่อร้าน โลโก้ และคำอธิบายที่แสดงบนเครื่องมือค้นหา">
    <TextRow label="ชื่อเว็บ" bind:value={site.config.siteName} />
    <TextRow label="คำอธิบาย SEO" bind:value={site.config.seoDescription} placeholder="Meta description" />
    <TextRow label="ชื่อแบรนด์/โลโก้" bind:value={site.config.logoText} />
    <TextRow label="ปุ่ม CTA" bind:value={site.config.ctaText} placeholder="เช่น เริ่มต้นเลย!" />
  </SettingsGroup>
  <SettingsGroup title="โลโก้">
    <ImageRow label="โลโก้" bind:value={site.config.logoImageUrl} />
  </SettingsGroup>
{:else if section === "colors"}
  <SettingsGroup title="สีธีม" description="สีทั้งหมดใช้กับหน้าร้านทันที ค่าเริ่มต้นคือโทนสว่างแบบ Apple">
    {#snippet actions()}
      <Button
        variant="ghost"
        size="sm"
        class="text-link"
        onclick={() => {
          site.resetTheme();
          toast("รีเซ็ตเป็นธีม Apple แล้ว");
        }}
      >
        <RotateCcwIcon />รีเซ็ตธีม
      </Button>
    {/snippet}
    <ColorRow label="Accent" hint="ลิงก์และไฮไลต์" bind:value={site.config.theme.accentColor} />
    <ColorRow label="ปุ่ม" bind:value={site.config.theme.buttonColor} />
    <ColorRow label="พื้นหลัง" bind:value={site.config.theme.backgroundColor} />
    <ColorRow label="การ์ด" bind:value={site.config.theme.cardColor} />
    <ColorRow label="ข้อความหลัก" bind:value={site.config.theme.textColor} />
    <ColorRow label="ข้อความรอง" bind:value={site.config.theme.mutedTextColor} />
    <ColorRow label="เส้นขอบ" hint="รองรับ rgba()" bind:value={site.config.theme.borderColor} />
  </SettingsGroup>
{:else if section === "hero"}
  <SettingsGroup title="Hero / แบนเนอร์" description="ส่วนบนสุดของหน้าแรก">
    <TextRow label="ข้อความหลัก" bind:value={site.config.heroHeadline} />
    <TextRow label="คำอธิบาย" bind:value={site.config.heroSubtitle} />
    <TextRow label="ช่องค้นหา (Placeholder)" bind:value={site.config.searchPlaceholder} />
  </SettingsGroup>
  <SettingsGroup title="รูปแบนเนอร์">
    <ImageRow label="แบนเนอร์" bind:value={site.config.heroImageUrl} />
  </SettingsGroup>
{:else if section === "announcement"}
  <SettingsGroup title="กระดานประกาศ" description="แสดงเป็นแถบด้านบนและการ์ดประกาศบนหน้าแรก">
    <TextRow label="หัวข้อประกาศ" bind:value={site.config.announcementTitle} />
    <TextRow label="รายละเอียดประกาศ" bind:value={site.config.announcementBody} multiline />
  </SettingsGroup>
{:else if section === "stats"}
  {#each statRows as row (row.key)}
    <SettingsGroup title={`ตัวเลข — ${row.label}`}>
      <TextRow label="ตัวเลข" bind:value={site.config.stats[row.key]} />
      <TextRow label="ป้ายกำกับ" bind:value={site.config.stats[`${row.key}Label`]} />
      <TextRow label="หน่วยนับ" bind:value={site.config.stats[`${row.key}Unit`]} placeholder={row.unitHint} />
    </SettingsGroup>
  {/each}
{:else if section === "store-config"}
  <SettingsGroup title="ข้อความหน้าร้านค้า">
    <TextRow label="หัวข้อหมวดสินค้า" bind:value={site.config.store.sectionTitle} />
    <TextRow label="ข้อความเมื่อไม่มีสินค้า" bind:value={site.config.store.emptyStateText} />
    <TextRow label="ข้อความปุ่มสินค้า" bind:value={site.config.store.productButtonText} placeholder="เช่น ดูรายละเอียด" />
  </SettingsGroup>
{:else if section === "footer"}
  <SettingsGroup title="ข้อมูลติดต่อและฟุตเตอร์">
    <TextRow label="ข้อความแบรนด์ท้ายเว็บ" bind:value={site.config.footer.brandText} multiline />
    <TextRow label="อีเมลติดต่อ" type="email" bind:value={site.config.footer.contactEmail} />
  </SettingsGroup>
  <SettingsGroup title="โซเชียล" description="เว้นว่างเพื่อซ่อนลิงก์">
    <TextRow label="Discord URL" type="url" bind:value={site.config.footer.discordUrl} />
    <TextRow label="LINE URL" type="url" bind:value={site.config.footer.lineUrl} placeholder="https://line.me/..." />
    <TextRow label="Facebook URL" type="url" bind:value={site.config.footer.facebookUrl} placeholder="https://facebook.com/..." />
    <TextRow label="Instagram URL" type="url" bind:value={site.config.footer.instagramUrl} placeholder="https://instagram.com/..." />
  </SettingsGroup>
{/if}
