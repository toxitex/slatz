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
