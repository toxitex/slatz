<script lang="ts">
  import { resolve } from "$app/paths";
  import { accountLinks, primaryLinks } from "$lib/nav";
  import { getStores } from "$lib/stores";

  const { site } = getStores();

  const socials = $derived(
    [
      { label: "Discord", href: site.config.footer.discordUrl },
      { label: "LINE", href: site.config.footer.lineUrl },
      { label: "Facebook", href: site.config.footer.facebookUrl },
      { label: "Instagram", href: site.config.footer.instagramUrl },
    ].filter((s) => s.href),
  );
</script>

<footer class="mt-auto bg-background text-xs tracking-[0.01em] text-muted-foreground">
  <div class="container-wide border-t border-border pt-5 pb-8">
    <p class="max-w-2xl leading-relaxed">{site.config.footer.brandText}</p>

    <div class="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-border pt-6 sm:grid-cols-4">
      <div>
        <h3 class="mb-2.5 font-semibold text-foreground">เลือกซื้อ</h3>
        <ul class="space-y-2">
          {#each primaryLinks as link (link.href)}
            <li><a href={resolve(link.href)} class="hover:text-foreground hover:underline">{link.label}</a></li>
          {/each}
        </ul>
      </div>
      <div>
        <h3 class="mb-2.5 font-semibold text-foreground">บัญชี</h3>
        <ul class="space-y-2">
          {#each accountLinks as link (link.href)}
            <li><a href={resolve(link.href)} class="hover:text-foreground hover:underline">{link.label}</a></li>
          {/each}
        </ul>
      </div>
      <div>
        <h3 class="mb-2.5 font-semibold text-foreground">ติดต่อ</h3>
        <ul class="space-y-2">
          <li>
            <a href={`mailto:${site.config.footer.contactEmail}`} class="hover:text-foreground hover:underline">
              {site.config.footer.contactEmail}
            </a>
          </li>
        </ul>
      </div>
      {#if socials.length}
        <div>
          <h3 class="mb-2.5 font-semibold text-foreground">ชุมชน</h3>
          <ul class="space-y-2">
            {#each socials as social (social.label)}
              <li>
                <a href={social.href} target="_blank" rel="external noreferrer" class="hover:text-foreground hover:underline">
                  {social.label}
                </a>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>

    <div class="mt-8 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
      <p>Copyright © {new Date().getFullYear()} {site.config.siteName}. {site.config.footer.rights}</p>
      {#if site.config.footer.country}<p>{site.config.footer.country}</p>{/if}
    </div>
  </div>
</footer>
