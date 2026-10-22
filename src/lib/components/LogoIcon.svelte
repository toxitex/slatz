<script lang="ts">
  let { size = 16, class: className = "" }: { size?: number; class?: string } = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="3.2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class={className}
  aria-hidden="true"
>
  <path d="M19 4 H8 L5 8 V11 L8 13 H16 L19 15 V18 L16 20 H5" />
</svg>
