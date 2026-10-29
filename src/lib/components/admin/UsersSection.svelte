<script lang="ts">
  import UsersIcon from "@lucide/svelte/icons/users";
  import { toast } from "svelte-sonner";
  import { api, errorMessage } from "$lib/api";
  import type { AdminUser } from "$lib/types";
  import { formatBaht } from "$lib/utils";

  let users = $state<AdminUser[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  export async function refresh() {
    loading = true;
    error = null;
    try {
      users = await api.get<AdminUser[]>("/api/users");
    } catch (err) {
      error = errorMessage(err);
    } finally {
      loading = false;
    }
  }

  void refresh();

  async function update(user: AdminUser, patch: { balance?: number; display_name?: string }) {
    try {
      await api.patch(`/api/users/${user.id}`, patch);
      toast.success("อัปเดตผู้ใช้แล้ว");
      void refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  function saveName(user: AdminUser, value: string) {
    const name = value.trim();
    if (name && name !== user.display_name) void update(user, { display_name: name });
  }

  function saveBalance(user: AdminUser, value: string) {
    const balance = Number(value);
    if (!Number.isNaN(balance) && balance >= 0 && balance !== user.balance) void update(user, { balance });
  }

  const cellInput =
    "w-full rounded-md bg-transparent px-1.5 py-1 outline-none hover:bg-secondary focus:bg-secondary";
</script>

<p class="px-1 text-[13px] leading-relaxed text-muted-foreground">
  ชื่อและยอดเงินที่แก้ที่นี่คือชื่อกับยอดคงเหลือในบัญชีของลูกค้า
</p>
{#if error}
  <p class="rounded-2xl bg-card px-4 py-3 text-[13px] text-destructive">{error}</p>
{/if}

{#if loading && !users.length}
  <div class="h-64 animate-pulse rounded-2xl bg-card"></div>
{:else if users.length}
  <div class="overflow-x-auto rounded-2xl bg-card shadow-float">
    <table class="w-full min-w-[720px] text-[13px]">
      <thead class="border-b border-border text-left text-[11px] text-muted-foreground">
        <tr>
          <th class="px-4 py-2 font-normal">ชื่อ</th>
          <th class="px-4 py-2 font-normal">อีเมล</th>
          <th class="px-4 py-2 text-right font-normal">ยอดเงิน (฿)</th>
          <th class="px-4 py-2 text-right font-normal">ออเดอร์</th>
          <th class="px-4 py-2 text-right font-normal">ใช้จ่าย</th>
          <th class="px-4 py-2 text-right font-normal">สมัครเมื่อ</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border">
        {#each users as user (user.id)}
          <tr>
            <td class="px-3 py-1.5">
              <input
                value={user.display_name}
                aria-label="ชื่อที่แสดง"
                title="คลิกเพื่อแก้ไข"
                class={cellInput}
                onchange={(e) => saveName(user, e.currentTarget.value)}
              />
            </td>
            <td class="px-4 py-1.5 text-muted-foreground">{user.email}</td>
            <td class="px-3 py-1.5">
              <input
                type="number"
                min="0"
                value={user.balance}
                aria-label="ยอดเงิน"
                title="คลิกเพื่อแก้ไข"
                class={`${cellInput} text-right tabular-nums`}
                onchange={(e) => saveBalance(user, e.currentTarget.value)}
              />
            </td>
            <td class="px-4 py-1.5 text-right tabular-nums">{user.order_count ?? 0}</td>
            <td class="px-4 py-1.5 text-right tabular-nums">{formatBaht(user.total_spent ?? 0)}</td>
            <td class="px-4 py-1.5 text-right text-muted-foreground">{new Date(user.created_at).toLocaleDateString("th-TH")}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <div class="flex flex-col items-center gap-2 rounded-2xl bg-card px-6 py-14 text-center text-[13px] text-muted-foreground shadow-float">
    <UsersIcon class="size-6" strokeWidth={1.5} />
    ยังไม่มีผู้ใช้ในระบบ
  </div>
{/if}
