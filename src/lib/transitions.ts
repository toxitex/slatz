import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";

/** Glass panels pop in from just under their trigger: slight drop, scale and blur. */
export function glassPop(
  _node: Element,
  { duration = 380, y = -8, scale = 0.96 }: { duration?: number; y?: number; scale?: number } = {},
): TransitionConfig {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return { duration: 0 };
  return {
    duration,
    easing: cubicOut,
    css: (t, u) =>
      `opacity:${t};transform:translateY(${u * y}px) scale(${scale + (1 - scale) * t});filter:blur(${u * 8}px);transform-origin:top center`,
  };
}
