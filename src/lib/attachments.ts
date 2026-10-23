import type { Attachment } from "svelte/attachments";

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Fades and lifts an element in the first time it scrolls into view. */
export function reveal(delay = 0): Attachment<HTMLElement> {
  return (node) => {
    if (prefersReducedMotion()) return;
    node.style.opacity = "0";
    node.style.transform = "translateY(24px)";
    node.style.transition = `opacity 0.9s var(--ease-apple) ${delay}ms, transform 0.9s var(--ease-apple) ${delay}ms`;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        node.style.opacity = "1";
        node.style.transform = "none";
        observer.disconnect();
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  };
}

/** Tracks the pointer over an element as `--mx` / `--my` for glass and spotlight highlights. */
export const glassPointer: Attachment<HTMLElement> = (node) => {
  if (window.matchMedia("(hover: none)").matches) return;
  let frame = 0;
  let x = 0;
  let y = 0;
  const apply = () => {
    frame = 0;
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--mx", `${x - rect.left}px`);
    node.style.setProperty("--my", `${y - rect.top}px`);
  };
  const onmove = (event: PointerEvent) => {
    x = event.clientX;
    y = event.clientY;
    if (!frame) frame = requestAnimationFrame(apply);
  };
  node.addEventListener("pointermove", onmove, { passive: true });
  return () => {
    cancelAnimationFrame(frame);
    node.removeEventListener("pointermove", onmove);
  };
};

/** Writes the element's scroll progress through the viewport (0 → 1) to `--progress`. */
export const scrollProgress: Attachment<HTMLElement> = (node) => {
  if (prefersReducedMotion()) {
    node.style.setProperty("--progress", "1");
    return;
  }
  let frame = 0;
  const update = () => {
    frame = 0;
    const rect = node.getBoundingClientRect();
    const start = window.innerHeight * 0.85;
    const end = window.innerHeight * 0.35;
    const progress = (start - rect.top) / (start - end + rect.height);
    node.style.setProperty("--progress", String(Math.min(1, Math.max(0, progress))));
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  update();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
  };
};

/** Splits text into words; Thai has no spaces, so this relies on Intl.Segmenter when available. */
export function segmentWords(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("th", { granularity: "word" });
    return [...segmenter.segment(text)].map((s) => s.segment);
  }
  return text.split(/(\s+)/);
}

/** Counts the numeric part of `value` up from zero once visible, keeping any prefix/suffix text. */
export function countUp(value: string): Attachment<HTMLElement> {
  return (node) => {
    const match = value.match(/^(\D*)([\d,.]+)(.*)$/);
    node.textContent = value;
    if (!match || prefersReducedMotion()) return;
    const [, prefix, digits, suffix] = match;
    const target = Number(digits.replace(/,/g, ""));
    if (!Number.isFinite(target) || target === 0) return;

    let frame = 0;
    const render = (n: number) => (node.textContent = `${prefix}${Math.round(n).toLocaleString("en-US")}${suffix}`);
    render(0);
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 1400);
        render(target * (1 - Math.pow(1 - t, 4)));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  };
}
