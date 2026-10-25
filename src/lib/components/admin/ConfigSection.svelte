<script lang="ts">
  import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
  import { toast } from "svelte-sonner";
  import { api } from "$lib/api";
  import { Button } from "$lib/components/ui/button";
  import { Switch } from "$lib/components/ui/switch";
  import type { PublicStats } from "$lib/types";
  import { getStores } from "$lib/stores";
  import ColorRow from "./ColorRow.svelte";
  import ImageRow from "./ImageRow.svelte";
  import SettingsGroup from "./SettingsGroup.svelte";
  import SettingsRow from "./SettingsRow.svelte";
  import type { ConfigSectionKey } from "./sections";
  import TextRow from "./TextRow.svelte";

  let { section }: { section: ConfigSectionKey } = $props();

  const { site } = getStores();
  const choiceClass = "h-8 rounded-lg bg-secondary px-2 text-[13px] text-foreground outline-none";

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
  <SettingsGroup title="โหมดแสดงผล" description="สลับทั้งเว็บระหว่างธีมสว่างกับธีมมืด พื้นหลัง การ์ด กระจก ฮีโร่ และปุ่มเปลี่ยนตามโหมด">
    <SettingsRow label="ธีมมืด">
      <Switch
        checked={site.config.theme.mode === "dark"}
        onCheckedChange={(checked) => {
          site.setMode(checked ? "dark" : "light");
          toast(checked ? "ใช้ธีมมืดแล้ว" : "ใช้ธีมสว่างแล้ว");
        }}
        aria-label="ธีมมืด"
      />
    </SettingsRow>
  </SettingsGroup>
  <SettingsGroup title="สีของธีมสว่าง" description="ใช้เมื่อปิดธีมมืด ธีมมืดมีพื้นหลังดำและการ์ดของตัวเอง">
    {#snippet actions()}
      <Button
        variant="ghost"
        size="sm"
        class="text-link"
        onclick={() => {
          site.resetTheme();
          toast("รีเซ็ตสีธีมสว่างแล้ว");
        }}
      >
        <RotateCcwIcon />รีเซ็ตสี
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
    <SettingsRow label="ขนาดหัวข้อ" hint="ย่อตามความกว้างหน้าจอ และตัดบรรทัดได้">
      <select bind:value={site.config.home.heroSize} aria-label="ขนาดหัวข้อ" class={choiceClass}>
        <option value="sm">เล็ก</option>
        <option value="md">กลาง</option>
        <option value="lg">ใหญ่</option>
      </select>
    </SettingsRow>
    <SettingsRow label="จัดวาง">
      <select bind:value={site.config.home.heroAlign} aria-label="จัดวางฮีโร่" class={choiceClass}>
        <option value="center">กึ่งกลาง</option>
        <option value="left">ชิดซ้าย</option>
      </select>
    </SettingsRow>
  </SettingsGroup>
  <SettingsGroup title="รูปแบนเนอร์">
    <ImageRow label="แบนเนอร์" bind:value={site.config.heroImageUrl} />
  </SettingsGroup>
{:else if section === "announcement"}
  <SettingsGroup title="ประกาศบนหน้าแรก" description="หัวข้ออยู่บนแถบเล็กในฮีโร่ และซ้ำเป็นป้ายเล็กเหนือประโยคใหญ่ รายละเอียดคือประโยคใหญ่ระหว่างหมวดหมู่กับตัวเลขสถิติ เว้นรายละเอียดว่างเพื่อไม่แสดงประโยคนั้น">
    <TextRow label="หัวข้อประกาศ" bind:value={site.config.announcementTitle} />
    <TextRow label="ประโยคบนหน้าแรก" bind:value={site.config.announcementBody} multiline />
    <TextRow label="ลิงก์ใต้ประโยค" hint="เว้นว่างเพื่อซ่อนลิงก์" bind:value={site.config.announcementLink} placeholder="ไปที่ร้านค้า" />
    <SettingsRow label="ขนาดประโยค">
      <select bind:value={site.config.home.statementSize} aria-label="ขนาดประโยค" class={choiceClass}>
        <option value="sm">เล็ก</option>
        <option value="md">กลาง</option>
        <option value="lg">ใหญ่</option>
      </select>
    </SettingsRow>
    <SettingsRow label="จัดวางประโยค">
      <select bind:value={site.config.home.statementAlign} aria-label="จัดวางประโยค" class={choiceClass}>
        <option value="left">ชิดซ้าย</option>
        <option value="center">กึ่งกลาง</option>
      </select>
    </SettingsRow>
    <SettingsRow label="ช่องว่างรอบประโยค">
      <select bind:value={site.config.home.statementSpace} aria-label="ช่องว่างรอบประโยค" class={choiceClass}>
        <option value="tight">กระชับ</option>
        <option value="normal">ปกติ</option>
        <option value="roomy">กว้าง</option>
      </select>
    </SettingsRow>
  </SettingsGroup>
{:else if section === "stats"}
  <SettingsGroup title="หัวข้อบนหน้าแรก" description="แถบใต้ประโยคประกาศ ตัวเลขด้านล่างเป็นการ์ดสี่ใบ">
    <TextRow label="หัวข้อ" bind:value={site.config.stats.heading} />
  </SettingsGroup>
  <SettingsGroup title="แหล่งข้อมูลตัวเลข" description="ตัวเลขบนหน้าแรกของร้าน">
    <SettingsRow label="ใช้ตัวเลขจริงจากระบบ" hint="นับลูกค้า สินค้า คลัง และยอดขายจากฐานข้อมูล">
      <Switch bind:checked={site.config.stats.live} aria-label="ใช้ตัวเลขจริงจากระบบ" />
    </SettingsRow>
    {#await api.get<PublicStats>("/api/stats") then liveStats}
      <div class="grid grid-cols-4 gap-2 px-4 py-3 text-center">
        {#each statRows as row (row.key)}
          <div>
            <p class="text-[17px] font-bold tabular-nums">{liveStats[row.key].toLocaleString("th-TH")}</p>
            <p class="text-[11px] text-muted-foreground">{row.label}</p>
          </div>
        {/each}
      </div>
    {:catch}
      <p class="px-4 py-3 text-xs text-destructive">โหลดตัวเลขจริงไม่สำเร็จ</p>
    {/await}
  </SettingsGroup>
  {#each statRows as row (row.key)}
    <SettingsGroup title={`ตัวเลข — ${row.label}`}>
      {#if !site.config.stats.live}
        <TextRow label="ตัวเลข (กำหนดเอง)" bind:value={site.config.stats[row.key]} />
      {/if}
      <TextRow label="ป้ายกำกับ" bind:value={site.config.stats[`${row.key}Label`]} />
      <TextRow label="หน่วยนับ" bind:value={site.config.stats[`${row.key}Unit`]} placeholder={row.unitHint} />
    </SettingsGroup>
  {/each}
{:else if section === "store-config"}
  <SettingsGroup title="หน้าร้าน" description="หัวข้อใหญ่และหัวข้อกลุ่มสินค้าอยู่บนหน้าร้าน แถวล่าสุดอยู่ใต้กลุ่มสินค้า">
    <TextRow label="หัวข้อใหญ่" bind:value={site.config.store.headline} />
    <SettingsRow label="ขนาดหัวข้อหน้าร้าน" hint="หน้าร้านและหน้าหมวดหมู่">
      <select bind:value={site.config.home.titleSize} aria-label="ขนาดหัวข้อหน้าร้าน" class={choiceClass}>
        <option value="sm">เล็ก</option>
        <option value="md">กลาง</option>
        <option value="lg">ใหญ่</option>
      </select>
    </SettingsRow>
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
