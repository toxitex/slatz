<script lang="ts">
  import { createGrainient, DEFAULT_COLORS, type Settings } from "./grainient";

  type Props = Partial<Omit<Settings, "type">> & { type?: "linear" | "radial"; class?: string };

  let {
    colors = DEFAULT_COLORS,
    type = "linear",
    angle = 55,
    bands = 1,
    speed = 1,
    flow = 0.8,
    scale = 1,
    softness = 1,
    silk = 0.35,
    grainAmount = 0.08,
    grainSize = 1.2,
    grainAnimated = true,
    contrast = 1,
    saturation = 1,
    variation = 0,
    interactive = true,
    stir = 1,
    clickSwirl = true,
    intro = true,
    lightMode = false,
    dpr = 1,
    class: className = "",
  }: Props = $props();

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  type LowPowerNavigator = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const nav = (typeof navigator === "undefined" ? {} : navigator) as LowPowerNavigator;
  // Weak devices and data-saver users get a still frame instead of a running shader.
  const lowPower = Boolean(nav.connection?.saveData) || (nav.deviceMemory ?? 8) <= 2;

  const settings = $derived<Settings>({
    colors: colors.length > 1 ? colors.slice(0, 8) : [colors[0], colors[0]],
    type: type === "radial" ? 1 : 0,
    angle,
    bands: clamp(bands, 1, 8),
    speed: lowPower ? 0 : Math.max(0, speed),
    flow: clamp(flow, 0, 3),
    scale: clamp(scale, 0.25, 3),
    softness: clamp(softness, 0, 1),
    silk: clamp(silk, 0, 1),
    grainAmount: clamp(grainAmount, 0, 0.5),
    grainSize: clamp(grainSize, 0.5, 4),
    grainAnimated: grainAnimated && !lowPower,
    contrast: clamp(contrast, 0.2, 2),
    saturation: clamp(saturation, 0, 2),
    variation: Math.max(0, variation),
    interactive,
    stir: clamp(stir, 0, 2),
    clickSwirl,
    intro,
    lightMode,
    dpr,
  });

  let handle: ReturnType<typeof createGrainient> = null;

  function mount(canvas: HTMLCanvasElement) {
    handle = createGrainient(canvas.parentElement!, canvas, () => settings);
    return () => {
      handle?.destroy();
      handle = null;
    };
  }

  $effect(() => {
    void settings;
    handle?.wake();
  });
</script>

<div class="relative h-full w-full overflow-hidden {className}" aria-hidden="true">
  <canvas class="absolute inset-0 block h-full w-full" {@attach mount}></canvas>
</div>
