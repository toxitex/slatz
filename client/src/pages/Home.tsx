import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Box, Package, Search, ShieldCheck, ShoppingBag, Users } from "lucide-react";
import { CountUp, GlowingCards, RevealFx } from "@/components/fx";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { SearchModal } from "@/components/SearchModal";
import { Footer, MobileNav, TopNav } from "@/pages/Store";
import { MorphingText } from "@/components/magicui/morphing-text";
import { DiaTextReveal } from "@/components/magicui/dia-text-reveal";
import Grainient from "@/components/reactbits/Grainient";

/**
 * Design philosophy: Magic Portfolio (Once UI) layout — a centred column with a badge,
 * display headline, muted subline and staggered reveals — over the store's admin-tinted
 * Grainient backdrop.
 */

function parseHex(color: string): [number, number, number] | null {
  const hex = color.trim().replace(/^#/, "");
  const full = hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

/** Grainient parses colours through a 2D canvas, so CSS variables and color-mix() are not available. */
function mixHex(from: string, to: string, amount: number): string {
  const a = parseHex(from);
  const b = parseHex(to);
  if (!a || !b) return from;
  return `#${a.map((v, i) => Math.round(v + (b[i] - v) * amount).toString(16).padStart(2, "0")).join("")}`;
}

function HeroBackdrop({ accent, background }: { accent: string; background: string }) {
  const colors = useMemo(
    () => [background, mixHex(background, accent, 0.18), mixHex(background, accent, 0.55), accent, mixHex(accent, "#ffffff", 0.35)],
    [accent, background],
  );
  return (
    <div className="hero-backdrop" aria-hidden>
      <Grainient colors={colors} angle={62} speed={0.6} flow={0.9} silk={0.4} grainAmount={0.1} contrast={1.05} />
    </div>
  );
}

export default function Home() {
  const { config } = useSiteConfig();
  const [searchOpen, setSearchOpen] = useState(false);
  const headlines = useMemo(() => [config.heroHeadline, ...config.heroMorphWords], [config.heroHeadline, config.heroMorphWords]);
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
        <section className="relative isolate flex min-h-[86vh] flex-col items-center justify-center overflow-hidden px-4 pt-32 pb-20 text-center">
          <HeroBackdrop accent={config.theme.accentColor} background={config.theme.backgroundColor} />
          <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center">
            {config.heroBadgeText && (
              <RevealFx className="pb-8">
                <span className="hero-badge">
                  <span className="hero-badge-dot" />
                  {config.heroBadgeText}
                </span>
              </RevealFx>
            )}
            <RevealFx delay={0.1} translateY={4} className="w-full pb-5">
              <h1 className="sr-only">{config.heroHeadline}</h1>
              <MorphingText
                texts={headlines}
                className="h-14 max-w-none text-[2.5rem] font-extrabold tracking-[-0.035em] whitespace-nowrap text-[var(--syncx-text)] sm:h-20 sm:text-6xl md:h-24 md:text-7xl lg:text-[5.25rem]"
              />
            </RevealFx>
            <RevealFx delay={0.25} className="pb-10">
              <p className="max-w-xl text-base leading-relaxed text-balance md:text-xl">
                <DiaTextReveal
                  text={config.heroSubtitle}
                  textColor="var(--syncx-muted, #9ca3af)"
                  colors={["var(--syncx-accent-soft, #ff3d6e)", "var(--syncx-accent, #e60039)", "#ffffff", "var(--syncx-accent, #e60039)"]}
                  duration={1.8}
                  delay={0.5}
                  startOnView={false}
                />
              </p>
            </RevealFx>
            <RevealFx delay={0.4} className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
              <button type="button" className="hero-search-pill" onClick={() => setSearchOpen(true)}>
                <Search size={16} className="text-[var(--syncx-accent)]" />
                <span className="truncate">{config.searchPlaceholder}</span>
              </button>
              <Link href="/store" className="hero-cta-pill no-underline">
                {config.ctaText}
                <ArrowRight size={16} className="hero-cta-arrow" />
              </Link>
            </RevealFx>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl flex-grow px-4 pb-16 md:px-6">
          <RevealFx delay={0.55}>
            <GlowingCards glowRadius={20} glowOpacity={0.5}>
              <div className="mb-14 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <article className="mp-surface flex items-center gap-4 p-5" key={stat.label}>
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[var(--syncx-border)] bg-white/[0.03] text-[var(--syncx-accent)]">
                        <Icon size={17} />
                      </span>
                      <div>
                        <p className="text-xs font-medium text-[var(--syncx-muted)]">{stat.label}</p>
                        <div className="mt-0.5 flex items-baseline gap-1">
                          <strong className="text-2xl font-bold tracking-tight text-white">
                            <CountUp value={stat.value} />
                          </strong>
                          {stat.unit && <span className="text-xs text-[var(--syncx-muted)]">{stat.unit}</span>}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </GlowingCards>
          </RevealFx>

          <div className="mb-5 flex items-center gap-4">
            <span className="text-sm font-semibold text-white">ประกาศ</span>
            <span className="h-px flex-1 bg-[var(--syncx-border)]" />
          </div>

          <article className="mp-surface flex gap-4 p-6">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[var(--syncx-border)] bg-white/[0.03] text-[var(--syncx-accent)]">
              <Package size={17} />
            </span>
            <div>
              <h2 className="mb-1 text-base font-bold tracking-tight text-white">{config.announcementTitle}</h2>
              <p className="text-sm leading-relaxed text-[var(--syncx-muted)]">{config.announcementBody}</p>
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
