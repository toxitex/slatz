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
  <SettingsGroup title="ข้อมูลแบรนด์" description="ชื่อเว็บอยู่บนแถบนำทางเล็กในฮีโร่ แท็บเบราว์เซอร์ หน้าเข้าสู่ระบบ และบรรทัดลิขสิทธิ์ ชื่อแบรนด์คือตัวอักษรข้างโลโก้">
    <TextRow label="ชื่อเว็บ" bind:value={site.config.siteName} />
    <TextRow label="คำอธิบาย SEO" hint="คำอธิบายตอนแชร์ลิงก์" bind:value={site.config.seoDescription} placeholder="Meta description" />
    <TextRow label="ชื่อแบรนด์/โลโก้" bind:value={site.config.logoText} />
    <TextRow label="ปุ่มหลักบนฮีโร่" bind:value={site.config.ctaText} placeholder="เช่น เริ่มต้นเลย!" />
  </SettingsGroup>
  <SettingsGroup title="โลโก้">
    <ImageRow label="โลโก้" bind:value={site.config.logoImageUrl} />
  </SettingsGroup>
{:else if section === "colors"}
  <SettingsGroup title="สีธีม" description="สีทั้งหมดใช้กับหน้าร้านทันที ค่าเริ่มต้นคือโทนขาว เทา ดำ แบบ Apple">
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
  <SettingsGroup title="Hero / แบนเนอร์" description="ส่วนบนสุดของหน้าแรก ข้อความสลับจะหมุนต่อจากข้อความหลัก เว้นว่างเพื่อใช้ข้อความหลักอย่างเดียว ถ้าใส่รูปแบนเนอร์ รูปนั้นจะแทนชั้นวางสินค้าใต้ปุ่ม">
    <TextRow label="ข้อความหลัก" bind:value={site.config.heroHeadline} />
    <TextRow
      label="ข้อความสลับ (Morph)"
      hint="คั่นด้วยจุลภาค เว้นว่างเพื่อปิด"
      bind:value={site.config.heroMorphWords}
      placeholder="ของแท้ 100%, ได้ของทันที"
    />
    <TextRow label="คำบรรยายใต้หัวข้อ" bind:value={site.config.heroSubtitle} />
    <TextRow label="ปุ่มค้นหา" hint="ปุ่มบนฮีโร่และในเมนูร้านค้า" bind:value={site.config.searchButtonText} />
    <TextRow label="ข้อความในช่องค้นหา" bind:value={site.config.searchPlaceholder} />
  </SettingsGroup>
  <SettingsGroup title="รูปแบนเนอร์">
    <ImageRow label="แบนเนอร์" bind:value={site.config.heroImageUrl} />
  </SettingsGroup>
{:else if section === "announcement"}
  <SettingsGroup title="ประกาศบนหน้าแรก" description="หัวข้ออยู่บนแถบเล็กในฮีโร่ และซ้ำเป็นป้ายเล็กเหนือประโยคใหญ่ รายละเอียดคือประโยคใหญ่ระหว่างหมวดหมู่กับตัวเลขสถิติ เว้นรายละเอียดว่างเพื่อไม่แสดงประโยคนั้น">
    <TextRow label="หัวข้อประกาศ" bind:value={site.config.announcementTitle} />
    <TextRow label="ประโยคบนหน้าแรก" bind:value={site.config.announcementBody} multiline />
    <TextRow label="ลิงก์ใต้ประโยค" hint="เว้นว่างเพื่อซ่อนลิงก์" bind:value={site.config.announcementLink} placeholder="ไปที่ร้านค้า" />
  </SettingsGroup>
{:else if section === "stats"}
  <SettingsGroup title="หัวข้อบนหน้าแรก" description="แถบดำใต้ประโยคประกาศ ตัวเลขด้านล่างเป็นการ์ดสี่ใบ">
    <TextRow label="หัวข้อ" bind:value={site.config.stats.heading} />
  </SettingsGroup>
  {#each statRows as row (row.key)}
    <SettingsGroup title={`ตัวเลข — ${row.label}`}>
      <TextRow label="ตัวเลข" bind:value={site.config.stats[row.key]} />
      <TextRow label="ป้ายกำกับ" bind:value={site.config.stats[`${row.key}Label`]} />
      <TextRow label="หน่วยนับ" bind:value={site.config.stats[`${row.key}Unit`]} placeholder={row.unitHint} />
    </SettingsGroup>
  {/each}
{:else if section === "store-config"}
  <SettingsGroup title="หน้าร้าน" description="หัวข้อใหญ่และหัวข้อกลุ่มสินค้าอยู่บนหน้าร้าน แถวล่าสุดอยู่ใต้กลุ่มสินค้า">
    <TextRow label="หัวข้อใหญ่" bind:value={site.config.store.headline} />
    <TextRow label="คำต่อท้ายหัวข้อ" hint="ตัวอักษรสีจางต่อจากหัวข้อ" bind:value={site.config.store.headlineAccent} />
    <TextRow label="หัวข้อกลุ่มสินค้า" bind:value={site.config.store.sectionTitle} />
    <TextRow label="หัวข้อสินค้าล่าสุด" bind:value={site.config.store.latestTitle} />
    <TextRow label="คำต่อท้ายสินค้าล่าสุด" bind:value={site.config.store.latestAccent} />
    <TextRow label="เมื่อไม่มีสินค้า" hint="หน้าร้านและหน้าหมวดหมู่" bind:value={site.config.store.emptyStateText} />
  </SettingsGroup>
  <SettingsGroup title="ปุ่มสินค้า" description="เรียนรู้เพิ่มเติมและซื้ออยู่บนเรื่องสินค้าในหน้าแรก ซื้อเลยอยู่ปุ่มสั่งซื้อในหน้าสินค้า ปุ่มบนการ์ดโชว์ตอนชี้เมาส์">
    <TextRow label="เรียนรู้เพิ่มเติม" bind:value={site.config.store.learnMoreText} />
    <TextRow label="ซื้อ" bind:value={site.config.store.buyText} />
    <TextRow label="ปุ่มสั่งซื้อ" bind:value={site.config.store.checkoutText} />
    <TextRow label="ปุ่มบนการ์ดสินค้า" bind:value={site.config.store.productButtonText} placeholder="เช่น ดูรายละเอียด" />
  </SettingsGroup>
  <SettingsGroup title="หมวดหมู่บนหน้าแรก" description="หัวข้อเหนือไอคอนหมวดหมู่ รายการหมวดเองมาจากหน้าหมวดหมู่สินค้า">
    <TextRow label="หัวข้อ" bind:value={site.config.store.categoryTitle} />
  </SettingsGroup>
{:else if section === "footer"}
  <SettingsGroup title="ข้อมูลติดต่อและฟุตเตอร์">
    <TextRow label="ข้อความแบรนด์ท้ายเว็บ" bind:value={site.config.footer.brandText} multiline />
    <TextRow label="อีเมลติดต่อ" hint="คอลัมน์ติดต่อ และปุ่มติดต่อเราบนแถบเมนู" type="email" bind:value={site.config.footer.contactEmail} />
    <TextRow label="ข้อความลิขสิทธิ์" bind:value={site.config.footer.rights} />
    <TextRow label="ประเทศ" hint="เว้นว่างเพื่อซ่อน" bind:value={site.config.footer.country} />
  </SettingsGroup>
  <SettingsGroup title="โซเชียล" description="เว้นว่างเพื่อซ่อนลิงก์">
    <TextRow label="Discord URL" type="url" bind:value={site.config.footer.discordUrl} />
    <TextRow label="LINE URL" type="url" bind:value={site.config.footer.lineUrl} placeholder="https://line.me/..." />
    <TextRow label="Facebook URL" type="url" bind:value={site.config.footer.facebookUrl} placeholder="https://facebook.com/..." />
    <TextRow label="Instagram URL" type="url" bind:value={site.config.footer.instagramUrl} placeholder="https://instagram.com/..." />
  </SettingsGroup>
{/if}
