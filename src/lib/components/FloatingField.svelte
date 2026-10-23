<script lang="ts">
  import EyeIcon from "@lucide/svelte/icons/eye";
  import EyeOffIcon from "@lucide/svelte/icons/eye-off";
  import type { HTMLInputAttributes } from "svelte/elements";
  import { cn } from "$lib/utils";

  type Props = Omit<HTMLInputAttributes, "value"> & {
    label: string;
    value?: string;
    revealable?: boolean;
  };

  let { label, value = $bindable(""), type = "text", revealable = false, id, class: className, ...rest }: Props = $props();

  const uid = $props.id();
  const inputId = $derived(id ?? `field-${uid}`);
  let revealed = $state(false);
</script>

<div class={cn("relative", className)}>
  <input
    {...rest}
    id={inputId}
    bind:value
    type={revealable && revealed ? "text" : type}
    placeholder=" "
    class="peer h-14 w-full rounded-xl border border-foreground/20 bg-card px-4 pt-5 text-[17px] outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--syncx-button)_25%,transparent)]"
    class:pr-12={revealable}
  />
  <label
    for={inputId}
    class="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[17px] text-muted-foreground transition-all duration-200 ease-apple peer-focus:top-4 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-4 peer-[:not(:placeholder-shown)]:text-xs"
  >
    {label}
  </label>
  {#if revealable}
    <button
      type="button"
      class="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:text-foreground"
      aria-label={revealed ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
      onclick={() => (revealed = !revealed)}
    >
      {#if revealed}<EyeOffIcon class="size-4" />{:else}<EyeIcon class="size-4" />{/if}
    </button>
  {/if}
</div>
