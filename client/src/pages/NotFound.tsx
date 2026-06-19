import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";
import { GravityStarsBackground } from "@/components/animate-ui/components/backgrounds/gravity-stars";
import { LiquidButton } from "@/components/animate-ui/components/buttons/liquid";

/**
 * Design philosophy reminder: Cyber-Noir Thai Commerce.
 * 404 page styled to match the dark theme.
 */
export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <main className="syncx-page items-center justify-center p-4 relative !min-h-screen">
      <GravityStarsBackground
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{ color: "var(--syncx-accent, #e60039)" }}
        starsCount={70}
        starsSize={1.2}
        movementSpeed={0.25}
        mouseInfluence={120}
        gravityStrength={60}
      />
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[var(--syncx-accent)] opacity-[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-[var(--syncx-accent)] opacity-[0.03] rounded-full blur-3xl pointer-events-none" />

      <section className="w-full max-w-lg relative z-10">
        <div className="syncx-glass p-8 rounded-2xl flex flex-col items-center gap-5">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--syncx-accent)] opacity-10 rounded-full animate-pulse blur-xl" />
              <AlertCircle className="relative h-16 w-16 text-[var(--syncx-accent)]" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white mb-2">404</h1>

          <h2 className="text-xl font-semibold text-gray-200 mb-2">
            ไม่พบหน้านี้ / Page Not Found
          </h2>

          <p className="text-gray-400 text-center mb-6 leading-relaxed text-sm">
            ขออภัย หน้าที่คุณกำลังมองหาไม่มีอยู่จริง
            <br />
            อาจถูกย้ายหรือลบไปแล้ว
          </p>

          <LiquidButton
            asChild
            hoverScale={1.03}
            tapScale={0.97}
            size={null}
            variant={null}
            style={{
              display: "flex",
              '--liquid-button-background-color': 'rgba(230,0,57,0.08)',
              '--liquid-button-color': 'var(--syncx-button, #e60039)',
            } as React.CSSProperties}
          >
            <button
              onClick={handleGoHome}
              className="w-full py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[var(--syncx-button)] rounded-xl hover:brightness-110 shadow-lg shadow-[var(--syncx-glow)] flex items-center justify-center gap-2 transition-all cursor-pointer border-none"
            >
              <Home className="w-4 h-4" />
              กลับหน้าหลัก / Go Home
            </button>
          </LiquidButton>
        </div>
      </section>
    </main>
  );
}
