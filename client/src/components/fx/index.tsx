import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Search, X, Command, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Design philosophy reminder: Cyber-Noir Thai Commerce.
 * Self-contained motion/FX primitives adapted from Lightswind UI, retuned to the
 * SyncX neon-red accent (#e60039). Zero new dependencies — only framer-motion + cn.
 * Each primitive is additive: it layers polish onto existing markup without
 * changing the storefront's black-glass identity.
 */

const ACCENT = "var(--syncx-accent, #e60039)";
const ACCENT_SOFT = "var(--syncx-accent-soft, #ff3d6e)";

/* ------------------------------------------------------------------ */
/* ShinyText — sweeping highlight across text (great for prices/labels) */
/* ------------------------------------------------------------------ */
export function ShinyText({
  children,
  className,
  speed = 4,
  disabled = false,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
  disabled?: boolean;
}) {
  if (disabled) return <span className={className}>{children}</span>;
  return (
    <motion.span
      className={cn("fx-shiny-text", className)}
      initial={{ backgroundPosition: "150% 0" }}
      animate={{ backgroundPosition: "-50% 0" }}
      transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
    >
      {children}
    </motion.span>
  );
}

/* ------------------------------------------------------------------ */
/* BorderBeam — a light beam travelling around a rounded border        */
/* Parent must be position:relative + overflow:hidden + rounded.       */
/* ------------------------------------------------------------------ */
export function BorderBeam({
  size = 60,
  duration = 7,
  delay = 0,
  colorFrom = ACCENT,
  colorTo = ACCENT_SOFT,
  className,
}: {
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  className?: string;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit]"
      style={{
        border: "1px solid transparent",
        WebkitMaskImage:
          "linear-gradient(transparent, transparent), linear-gradient(#000, #000)",
        WebkitMaskClip: "padding-box, border-box",
        WebkitMaskComposite: "destination-out" as CSSProperties["WebkitMaskComposite"],
        maskComposite: "intersect" as CSSProperties["maskComposite"],
      }}
      aria-hidden
    >
      <motion.div
        className={cn("absolute aspect-square", className)}
        style={
          {
            width: size,
            offsetPath: `rect(0 auto auto 0 round ${size}px)`,
            background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
          } as CSSProperties
        }
        initial={{ offsetDistance: "0%" }}
        animate={{ offsetDistance: "100%" }}
        transition={{ repeat: Infinity, ease: "linear", duration, delay: -delay }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MagneticButton — element drifts toward the cursor within a radius   */
/* Renders a span; pass className to inherit any existing button look. */
/* ------------------------------------------------------------------ */
export function Magnetic({
  children,
  strength = 0.35,
  radius = 90,
  className,
  style,
}: {
  children: ReactNode;
  strength?: number;
  radius?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const spring = { stiffness: 220, damping: 18, mass: 0.6 };
  const x = useSpring(0, spring);
  const y = useSpring(0, spring);

  const onMove = (e: React.MouseEvent<HTMLSpanElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    if (Math.hypot(dx, dy) < radius + Math.max(rect.width, rect.height) / 2) {
      x.set(dx * strength);
      y.set(dy * strength);
    } else {
      x.set(0);
      y.set(0);
    }
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <span
      ref={containerRef}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ display: "inline-flex", ...style }}
      className={className}
    >
      <motion.span style={{ x, y, display: "inline-flex", width: "100%", height: "100%" }}>
        {children}
      </motion.span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* MagicCard — radial spotlight that tracks the cursor over a surface  */
/* Wrap any card; it injects a glow layer that follows the pointer.    */
/* ------------------------------------------------------------------ */
export function SpotlightGlow({
  size = 320,
  color = "rgba(230,0,57,0.18)",
}: {
  size?: number;
  color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(-size);
  const my = useMotionValue(-size);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;
    const move = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      mx.set(e.clientX - rect.left);
      my.set(e.clientY - rect.top);
    };
    const enter = () => setActive(true);
    const leave = () => setActive(false);
    parent.addEventListener("mousemove", move);
    parent.addEventListener("mouseenter", enter);
    parent.addEventListener("mouseleave", leave);
    return () => {
      parent.removeEventListener("mousemove", move);
      parent.removeEventListener("mouseenter", enter);
      parent.removeEventListener("mouseleave", leave);
    };
  }, [mx, my]);

  const background = useTransform(
    [mx, my],
    ([x, y]) =>
      `radial-gradient(${size}px circle at ${x}px ${y}px, ${color}, transparent 70%)`,
  );

  return (
    <motion.div
      ref={ref}
      className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
      style={{ background, opacity: active ? 1 : 0 }}
      aria-hidden
    />
  );
}

/* ------------------------------------------------------------------ */
/* Meteors — cheap falling streaks for dark hero backdrops             */
/* ------------------------------------------------------------------ */
export function Meteors({ count = 14 }: { count?: number }) {
  const meteors = Array.from({ length: count });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {meteors.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = 4 + Math.random() * 6;
        return (
          <span
            key={i}
            className="fx-meteor"
            style={{
              left: `${left}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CountUp — animates a number up to value when scrolled into view     */
/* Preserves any non-numeric prefix/suffix in the original string.     */
/* ------------------------------------------------------------------ */
export function CountUp({
  value,
  duration = 1.4,
  className,
}: {
  value: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(value);

  // Extract the leading integer portion; keep any surrounding text.
  const match = value.match(/[\d,]+/);
  const target = match ? parseInt(match[0].replace(/,/g, ""), 10) : NaN;

  useEffect(() => {
    if (!inView || isNaN(target)) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(target * eased);
      setDisplay(value.replace(/[\d,]+/, current.toLocaleString("th-TH")));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration, value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* DotPattern — static SVG dot grid background                         */
/* ------------------------------------------------------------------ */
export function DotPattern({
  width = 16,
  height = 16,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
}: {
  width?: number;
  height?: number;
  cx?: number;
  cy?: number;
  cr?: number;
  className?: string;
}) {
  const id = `dot-${Math.random().toString(36).slice(2, 9)}`;
  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full opacity-40",
        className
      )}
      style={{ fill: "currentColor" }}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
        >
          <circle cx={cx} cy={cy} r={cr} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* GlowingCards — mouse-tracking radial glow for card collections     */
/* ------------------------------------------------------------------ */
export function GlowingCards({
  children,
  className,
  glowRadius = 25,
  glowOpacity = 1,
}: {
  children: ReactNode;
  className?: string;
  glowRadius?: number;
  glowOpacity?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const overlay = overlayRef.current;
    if (!container || !overlay) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePosition({ x, y });
      setShowOverlay(true);
      overlay.style.setProperty('--x', x + 'px');
      overlay.style.setProperty('--y', y + 'px');
      overlay.style.setProperty('--opacity', glowOpacity.toString());
    };

    const handleMouseLeave = () => {
      setShowOverlay(false);
      overlay.style.setProperty('--opacity', '0');
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [glowOpacity]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {children}
      <div
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none select-none opacity-0 transition-opacity duration-400"
        style={{
          WebkitMask: `radial-gradient(${glowRadius}rem ${glowRadius}rem at var(--x, 0) var(--y, 0), #000 1%, transparent 50%)`,
          mask: `radial-gradient(${glowRadius}rem ${glowRadius}rem at var(--x, 0) var(--y, 0), #000 1%, transparent 50%)`,
          opacity: showOverlay ? 'var(--opacity)' : '0',
        }}
      >
        <div className="absolute inset-0" style={{
          background: `radial-gradient(circle at 50% 50%, ${ACCENT}30 0%, transparent 70%)`,
          opacity: 0.6
        }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ExpandableSearchBar — standard search bar (always visible)         */
/* ------------------------------------------------------------------ */
export function ExpandableSearchBar({
  placeholder = "Search...",
  onChange,
  onSubmit,
  className,
  expandedWidth = "100%",
}: {
  placeholder?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  className?: string;
  expandedWidth?: string | number;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit(value);
  };

  const handleClear = () => {
    setValue("");
    if (onChange) onChange("");
    inputRef.current?.focus();
  };

  return (
    <div
      className={cn("relative flex items-center w-full", className)}
    >
      <form
        onSubmit={handleSubmit}
        className="relative flex h-10 w-full items-center overflow-hidden rounded-full border border-white/10 bg-white/5 transition-colors focus-within:border-white/20"
      >
        <div className="absolute left-0 flex h-full w-10 items-center justify-center text-white/40 z-10 pointer-events-none">
          <Search size={16} />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (onChange) onChange(e.target.value);
          }}
          placeholder={placeholder}
          className="h-full w-full border-none bg-transparent pl-10 pr-10 text-sm text-white outline-none placeholder:text-white/40"
        />

        {value !== "" && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-0 flex h-full w-10 items-center justify-center text-white/60 hover:text-white"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ExpandableSpeedDial — fab with expandable action buttons           */
/* ------------------------------------------------------------------ */
export interface SpeedDialAction {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

export function ExpandableSpeedDial({
  actions,
  direction = "up",
  className,
  size = "md",
}: {
  actions: SpeedDialAction[];
  direction?: "up" | "down" | "left" | "right";
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [isOpen, setIsOpen] = useState(false);

  const sizes = {
    sm: "h-10 w-10",
    md: "h-12 w-12",
    lg: "h-14 w-14",
  };

  const actionSizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const getDirectionClasses = () => {
    switch (direction) {
      case "up":
        return "bottom-full mb-3 flex-col-reverse left-1/2 -translate-x-1/2 items-center";
      case "down":
        return "top-full mt-3 flex-col left-1/2 -translate-x-1/2 items-center";
      case "left":
        return "right-full mr-3 flex-row-reverse top-1/2 -translate-y-1/2 items-center";
      case "right":
        return "left-full ml-3 flex-row top-1/2 -translate-y-1/2 items-center";
      default:
        return "bottom-full mb-3 flex-col-reverse left-1/2 -translate-x-1/2 items-center";
    }
  };

  const getTooltipClasses = () => {
    switch (direction) {
      case "up":
      case "down":
        return "absolute right-full mr-3.5 top-1/2 -translate-y-1/2";
      case "left":
      case "right":
        return "absolute bottom-full mb-3.5 left-1/2 -translate-x-1/2";
      default:
        return "absolute right-full mr-3.5 top-1/2 -translate-y-1/2";
    }
  };

  const getMotionVariants = (index: number) => {
    const delay = index * 0.05;
    const distance = 15;
    let x = 0;
    let y = 0;

    switch (direction) {
      case "up": y = distance; break;
      case "down": y = -distance; break;
      case "left": x = distance; break;
      case "right": x = -distance; break;
    }

    return {
      hidden: { opacity: 0, scale: 0.5, x, y },
      visible: {
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        transition: {
          type: "spring" as const,
          stiffness: 300,
          damping: 20,
          delay
        }
      },
      exit: {
        opacity: 0,
        scale: 0.5,
        x,
        y,
        transition: {
          duration: 0.2,
          delay: (actions.length - 1 - index) * 0.05
        }
      }
    };
  };

  return (
    <div className={cn("relative z-50", className)}>
      <AnimatePresence>
        {isOpen && (
          <div className={cn("absolute flex gap-3", getDirectionClasses())}>
            {actions.map((action, index) => (
              <motion.button
                key={action.label}
                variants={getMotionVariants(index)}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className={cn(
                  "relative flex items-center justify-center rounded-full bg-[#121314] border border-white/10 hover:bg-neutral-800 transition-colors text-white shadow-lg",
                  actionSizes[size]
                )}
                title={action.label}
                aria-label={action.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {action.icon}
                <span className={cn("px-3 py-1 bg-white text-neutral-900 text-[12px] font-semibold rounded-md shadow-lg whitespace-nowrap", getTooltipClasses())}>
                  {action.label}
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center rounded-full shadow-lg hover:shadow-xl transition-colors duration-200",
          sizes[size]
        )}
        style={isOpen ? { background: "#ffffff" } : { background: ACCENT }}
        aria-label="Toggle Speed Dial"
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 135 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={cn("flex items-center justify-center text-white", isOpen && "text-neutral-900")}
        >
          <Plus size={size === "sm" ? 20 : size === "lg" ? 32 : 24} />
        </motion.div>
      </motion.button>
    </div>
  );
}
