import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Box, Home as HomeIcon, Package, Search, ShieldCheck, ShoppingBag, Store as StoreIcon, Users } from "lucide-react";
import { toast } from "sonner";
import { DotPattern, CountUp, Magnetic, GlowingCards } from "@/components/fx";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { useScrolled } from "@/hooks/useScrolled";
import { useAuth } from "@/hooks/useAuth";
import { UserMenu } from "@/components/UserMenu";
import { SearchModal } from "@/components/SearchModal";
import { MobileNav, TopNav } from "@/pages/Store";
import { LogoIcon } from "@/components/LogoIcon";
import { GravityStarsBackground } from "@/components/animate-ui/components/backgrounds/gravity-stars";
import { LiquidButton } from "@/components/animate-ui/components/buttons/liquid";
import { RippleButton, RippleButtonRipples } from "@/components/animate-ui/components/buttons/ripple";

/**
 * Design philosophy reminder: Cyber-Noir Thai Commerce.
 * Rebuilt using standard Tailwind CSS v4 styling wrappers, dynamic design tokens.
 */

const navItems = [
  { href: "/", label: "หน้าหลัก", icon: HomeIcon },
  { href: "/store", label: "ร้านค้า", icon: StoreIcon },
];

function Headline({ text }: { text: string }) {
  const parts = text.trim().split(/\s+/);
  const first = parts.shift() ?? "SYNCX";
  const rest = parts.join(" ") ?? "STUDIO";
  return (
    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight uppercase select-none mb-4 flex flex-col md:flex-row md:items-center justify-center gap-1 md:gap-3">
      <span className="text-white drop-shadow-[0_0_20px_color-mix(in_srgb,var(--syncx-accent)_35%,transparent)]">{first}</span>
      <span className="text-[var(--syncx-accent)] drop-shadow-[0_0_30px_color-mix(in_srgb,var(--syncx-accent)_50%,transparent)]">{rest}</span>
    </h1>
  );
}

function Logo() {
  const { config } = useSiteConfig();
  return (
    <Link href="/" className="syncx-logo" aria-label={`${config.logoText} home`}>
      <span className="syncx-logo-mark">
        {config.logoImageUrl ? <img src={config.logoImageUrl} alt="" /> : <LogoIcon size={16} />}
      </span>
      <span>{config.logoText}</span>
    </Link>
  );
}



function Footer() {
  const { config } = useSiteConfig();
  return (
    <footer className="w-full mt-auto border-t border-[var(--syncx-border)] bg-black/40 backdrop-blur-sm py-12 px-4 md:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-6 flex flex-col gap-3">
          <Logo />
          <p className="text-xs text-gray-400 leading-relaxed max-w-sm mt-2">{config.footer.brandText}</p>
          <a href={`mailto:${config.footer.contactEmail}`} className="text-xs text-[var(--syncx-accent)] hover:underline mt-1">ติดต่อเรา</a>
        </div>
        <div className="md:col-span-6 flex flex-col md:items-end gap-3 text-sm">
          <h3 className="font-bold text-white tracking-wide">เมนู</h3>
          <div className="flex flex-wrap gap-4 text-xs text-gray-400 md:justify-end">
            <Link href="/" className="hover:text-white transition-colors duration-200">หน้าหลัก</Link>
            <Link href="/store" className="hover:text-white transition-colors duration-200">ร้านค้า</Link>

            {config.footer.discordUrl && <a href={config.footer.discordUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors duration-200">Discord</a>}
            {config.footer.lineUrl && <a href={config.footer.lineUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors duration-200">LINE</a>}
            {config.footer.facebookUrl && <a href={config.footer.facebookUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors duration-200">Facebook</a>}
            {config.footer.instagramUrl && <a href={config.footer.instagramUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors duration-200">Instagram</a>}
          </div>
        </div>
        <div className="col-span-12 border-t border-[var(--syncx-border)] pt-6 flex flex-col sm:flex-row sm:justify-between text-[11px] text-gray-500 gap-2">
          <div>Copyright © 2026 {config.siteName} | All rights reserved</div>
          <div className="hidden sm:block">Designed with premium experiences</div>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  const { config } = useSiteConfig();
  const [searchOpen, setSearchOpen] = useState(false);
  const stats = [
    { label: config.stats.usersLabel, value: config.stats.users, unit: config.stats.usersUnit, icon: Users },
    { label: config.stats.productsLabel, value: config.stats.products, unit: config.stats.productsUnit, icon: ShoppingBag },
    { label: config.stats.stockLabel, value: config.stats.stock, unit: config.stats.stockUnit, icon: Box },
    { label: config.stats.soldLabel, value: config.stats.sold, unit: config.stats.soldUnit, icon: ShieldCheck },
  ];

  return (
    <>
      <TopNav />
      <main className="syncx-page">
        <section className="relative min-h-[60vh] flex flex-col items-center justify-center text-center px-4 pt-28 pb-16 overflow-hidden bg-black/10">
          <GravityStarsBackground
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{ color: "var(--syncx-accent, #e60039)" }}
            starsCount={90}
            starsSize={1.5}
            movementSpeed={0.3}
            mouseInfluence={140}
            gravityStrength={80}
          />
          <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto">
            <Headline text={config.heroHeadline} />
            <p className="text-gray-300 text-sm md:text-base mb-8 max-w-lg leading-relaxed">{config.heroSubtitle}</p>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
              <button type="button" className="flex items-center gap-3 w-full sm:w-64 px-4 py-3 rounded-xl bg-black/40 border border-[var(--syncx-border)] hover:border-gray-600 transition-colors text-left text-xs text-gray-400 shadow-lg cursor-pointer outline-none" onClick={() => setSearchOpen(true)}>
                <Search size={17} className="text-[var(--syncx-accent)]" />
                <span>{config.searchPlaceholder}</span>
              </button>
              <LiquidButton
                asChild
                hoverScale={1.05}
                tapScale={0.95}
                size={null}
                variant={null}
                style={{
                  '--liquid-button-background-color': 'rgba(230,0,57,0.08)',
                  '--liquid-button-color': 'var(--syncx-button, #e60039)',
                } as React.CSSProperties}
              >
                <Link href="/store" className="inline-flex items-center gap-2 justify-center px-6 py-3 rounded-xl bg-[var(--syncx-button)] text-white text-xs font-bold no-underline transition-all hover:brightness-110 shadow-lg shadow-[var(--syncx-glow)] w-full sm:w-auto">
                  {config.ctaText} <ArrowRight size={16} />
                </Link>
              </LiquidButton>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 md:px-6 py-12 w-full flex-grow">
          <GlowingCards glowRadius={20} glowOpacity={0.6}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <article className="syncx-glass p-5 rounded-2xl flex items-center gap-4 transition-all duration-300 hover:border-gray-500 hover:-translate-y-0.5 relative overflow-hidden group" key={stat.label}>
                    <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-[var(--syncx-accent)] opacity-[0.03] rounded-full blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--syncx-accent)]/10 text-[var(--syncx-accent)] shadow-[0_0_15px_color-mix(in_srgb,var(--syncx-accent)_20%,transparent)] group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      <Icon size={17} />
                    </span>
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{stat.label}</p>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <strong className="text-xl font-extrabold text-white tracking-tight"><CountUp value={stat.value} /></strong>
                        {stat.unit && <span className="text-[10px] text-gray-500 font-semibold">{stat.unit}</span>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </GlowingCards>

          <div className="flex items-center gap-3 mb-6">
            <span className="w-1.5 h-6 bg-[var(--syncx-accent)] rounded-full shadow-[0_0_10px_var(--syncx-accent)]" />
            <span className="text-sm font-bold tracking-wider text-white uppercase">ประกาศ / Announcement</span>
          </div>

          <article className="syncx-glass p-6 rounded-2xl flex gap-4 transition-all duration-300 hover:border-gray-500 relative overflow-hidden group">
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[var(--syncx-accent)] opacity-[0.02] rounded-full blur-3xl pointer-events-none" />
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--syncx-accent)]/10 text-[var(--syncx-accent)] flex-shrink-0">
              <Package size={17} />
            </span>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide mb-1">{config.announcementTitle}</h2>
              <p className="text-xs text-gray-300 leading-relaxed font-normal">{config.announcementBody}</p>
            </div>
          </article>
        </section>
        <Footer />
      </main>
      <MobileNav />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
