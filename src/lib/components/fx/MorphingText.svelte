<script lang="ts">
  import type { Attachment } from "svelte/attachments";
  import { cn } from "$lib/utils";

  /**
   * Magic UI — Morphing Text (https://magicui.design/docs/components/morphing-text).
   * Falls back to the first phrase, unanimated, for a single phrase or reduced motion.
   */

  let { texts, class: className = "" }: { texts: string[]; class?: string } = $props();

  const MORPH_TIME = 1.5;
  const COOLDOWN_TIME = 2.5;

  const uid = $props.id();
  const filterId = `threshold-${uid}`;
  const phrases = $derived(texts.map((t) => t.trim()).filter(Boolean));
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animated = $derived(!reduced && phrases.length > 1);

  function morph(list: string[]): Attachment<HTMLElement> {
    return (node) => {
      const [text1, text2] = node.children as unknown as [HTMLElement, HTMLElement];
      let index = 0;
      let morphProgress = 0;
      let cooldown = COOLDOWN_TIME;
      let last = performance.now();
      let frame = 0;
      let visible = true;
      text2.textContent = list[0];
      text1.style.opacity = "0%";
      // The threshold filter only reads well mid-morph; at rest it would alias the glyph edges.
      const setFiltered = (on: boolean) => (node.style.filter = on ? `url(#${filterId}) blur(0.6px)` : "");

      const setStyles = (fraction: number) => {
        text2.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
        text2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;
        const inverted = 1 - fraction;
        text1.style.filter = `blur(${Math.min(8 / inverted - 8, 100)}px)`;
        text1.style.opacity = `${Math.pow(inverted, 0.4) * 100}%`;
        text1.textContent = list[index % list.length];
        text2.textContent = list[(index + 1) % list.length];
      };

      const tick = (now: number) => {
        frame = visible ? requestAnimationFrame(tick) : 0;
        const dt = (now - last) / 1000;
        last = now;
        cooldown -= dt;
        if (cooldown <= 0) {
          morphProgress -= cooldown;
          cooldown = 0;
          let fraction = morphProgress / MORPH_TIME;
          if (fraction > 1) {
            cooldown = COOLDOWN_TIME;
            fraction = 1;
          }
          setFiltered(fraction < 1);
          setStyles(fraction);
          if (fraction === 1) index++;
        } else if (morphProgress !== 0) {
          morphProgress = 0;
          setFiltered(false);
          text2.style.filter = "none";
          text2.style.opacity = "100%";
          text1.style.filter = "none";
          text1.style.opacity = "0%";
        }
      };

      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !frame) {
          last = performance.now();
          frame = requestAnimationFrame(tick);
        }
      });
      observer.observe(node);

      return () => {
        observer.disconnect();
        cancelAnimationFrame(frame);
      };
    };
  }
</script>

<div
  role="img"
  aria-label={phrases.join(" / ")}
  class={cn("relative mx-auto w-full text-center", className)}
>
  {#if animated}
    {#key phrases.join("\0")}
      <span aria-hidden="true" class="block" {@attach morph(phrases)}>
        <span class="absolute inset-x-0 top-0 m-auto inline-block w-full"></span>
        <span class="absolute inset-x-0 top-0 m-auto inline-block w-full"></span>
      </span>
    {/key}
  {:else}
    <span aria-hidden="true" class="absolute inset-x-0 top-0 m-auto inline-block w-full">{phrases[0]}</span>
  {/if}
  <svg class="fixed h-0 w-0" aria-hidden="true">
    <defs>
      <filter id={filterId}>
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -140" />
      </filter>
    </defs>
  </svg>
</div>
