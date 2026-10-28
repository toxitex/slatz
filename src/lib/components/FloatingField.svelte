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
    class={[
      "peer h-12 w-full rounded-xl border border-border bg-secondary px-3.5 pt-4 text-[15px] outline-none transition-[border-color,box-shadow] focus:border-[var(--syncx-action)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--syncx-action)_25%,transparent)]",
      revealable && "pr-12",
    ]}
  />
  <label
    for={inputId}
    class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[15px] text-muted-foreground transition-all duration-200 ease-apple peer-focus:top-2.5 peer-focus:text-[11px] peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:text-[11px]"
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
