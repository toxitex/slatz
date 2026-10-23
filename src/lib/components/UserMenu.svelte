<script lang="ts">
  import { resolve } from "$app/paths";
  import { goto } from "$app/navigation";
  import { toast } from "svelte-sonner";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { accountLinks } from "$lib/nav";
  import { getStores } from "$lib/stores";
  import { formatBaht } from "$lib/utils";
  import Avatar from "./Avatar.svelte";

  const { auth } = getStores();

  async function signOut() {
    await auth.signOut();
    toast.success("ออกจากระบบแล้ว");
    await goto(resolve("/"));
  }
</script>

{#if auth.user}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger
      class="flex items-center gap-2 rounded-full py-1 pr-1 pl-3 text-xs text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground"
      aria-label="เมนูบัญชี"
    >
      <span class="tabular-nums">{formatBaht(auth.user.balance)}</span>
      <Avatar user={auth.user} class="size-7 text-[11px]" />
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end" sideOffset={10} class="w-60 rounded-2xl p-1.5">
      <div class="flex items-center gap-3 px-2.5 py-2.5">
        <Avatar user={auth.user} class="size-9 text-sm" />
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold">{auth.user.displayName}</p>
          <p class="truncate text-xs text-muted-foreground">{auth.user.email}</p>
        </div>
      </div>
      <DropdownMenu.Separator />
      <DropdownMenu.Item onSelect={() => goto(resolve("/store"))} class="rounded-lg px-2.5 py-2">ร้านค้า</DropdownMenu.Item>
      {#each accountLinks as link (link.href)}
        <DropdownMenu.Item onSelect={() => goto(resolve(link.href))} class="rounded-lg px-2.5 py-2">{link.label}</DropdownMenu.Item>
      {/each}
      <DropdownMenu.Separator />
      <DropdownMenu.Item onSelect={signOut} class="rounded-lg px-2.5 py-2 text-destructive">ออกจากระบบ</DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/if}
