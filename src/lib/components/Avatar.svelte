<script lang="ts">
  import type { AuthUser } from "$lib/stores/auth.svelte";
  import { cn } from "$lib/utils";

  let { user, class: className = "" }: { user: AuthUser; class?: string } = $props();
</script>

<span
  class={cn(
    "grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#c7c7cc] to-[#48484a] font-semibold text-white",
    className,
  )}
>
  {#if user.avatarUrl}
    <img src={user.avatarUrl} alt="" class="size-full object-cover" />
  {:else}
    {user.initial}
  {/if}
</span>
