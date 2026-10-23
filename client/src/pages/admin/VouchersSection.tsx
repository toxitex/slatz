import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState, type FormEvent } from "react";
import { Copy, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { RefreshHandle } from "./OverviewSection";
import { cardClass, Empty, fieldClass, formatBaht, Group, Row, Segmented } from "./ui";

type Voucher = {
  id: string;
  code: string;
  amount: number;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
  used_by_email: string | null;
};
type Filter = "available" | "used" | "all";

const copy = async (text: string, message = "คัดลอกแล้ว") => {
  await navigator.clipboard.writeText(text);
  toast.success(message);
};

export const VouchersSection = forwardRef<RefreshHandle>(function VouchersSection(_props, ref) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("available");
  const [amount, setAmount] = useState(100);
  const [count, setCount] = useState(1);
  const [prefix, setPrefix] = useState("TOPUP");
  const [customCode, setCustomCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setVouchers(await api.get<Voucher[]>("/api/vouchers"));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useImperativeHandle(ref, () => ({ refresh }), [refresh]);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const visible = useMemo(
    () => vouchers.filter((v) => (filter === "all" ? true : filter === "used" ? v.is_used : !v.is_used)),
    [filter, vouchers],
  );
  const available = vouchers.filter((v) => !v.is_used);
  const custom = customCode.trim();

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!(amount > 0)) {
      toast.error("กรุณาระบุจำนวนเงิน");
      return;
    }
    setCreating(true);
    try {
      const body = custom ? { amount, code: custom } : { amount, count: Math.min(100, Math.max(1, Math.round(count))), prefix: prefix.trim() || undefined };
      const res = await api.post<{ codes: string[] }>("/api/vouchers", body);
      setCreated(res.codes);
      setCustomCode("");
      setFilter("available");
      toast.success(`สร้างบัตรเติมเงิน ${res.codes.length} ใบแล้ว`);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  const remove = async (voucher: Voucher) => {
    try {
      await api.delete(`/api/vouchers/${voucher.id}`);
      setVouchers((list) => list.filter((v) => v.id !== voucher.id));
      toast("ลบบัตรแล้ว");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <>
      <form onSubmit={create}>
        <Group title="สร้างบัตรเติมเงิน" description="ลูกค้านำรหัสไปเติมเงินที่หน้า “เติมเงิน”">
          <Row label="มูลค่าต่อใบ (บาท)">
            <input type="number" min={1} value={amount} aria-label="มูลค่าต่อใบ" onChange={(e) => setAmount(Number(e.target.value))} className={cn(fieldClass, "w-40")} />
          </Row>
          <Row label="จำนวนใบ" hint="สูงสุด 100 ใบต่อครั้ง">
            <input type="number" min={1} max={100} value={count} disabled={!!custom} aria-label="จำนวนใบ" onChange={(e) => setCount(Number(e.target.value))} className={cn(fieldClass, "w-40")} />
          </Row>
          <Row label="คำนำหน้ารหัส">
            <input value={prefix} disabled={!!custom} aria-label="คำนำหน้ารหัส" onChange={(e) => setPrefix(e.target.value)} className={cn(fieldClass, "w-40 uppercase")} />
          </Row>
          <Row label="หรือกำหนดรหัสเอง" hint="สร้าง 1 ใบด้วยรหัสนี้">
            <input value={customCode} placeholder="เช่น WELCOME500" aria-label="รหัสกำหนดเอง" onChange={(e) => setCustomCode(e.target.value)} className={cn(fieldClass, "w-40 uppercase")} />
          </Row>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-xs text-muted-foreground">รวม {formatBaht(amount * (custom ? 1 : Math.max(1, count || 1)))}</span>
            <Button type="submit" size="sm" className="rounded-full px-4" disabled={creating}>
              {creating ? "กำลังสร้าง..." : "สร้างบัตร"}
            </Button>
          </div>
        </Group>
      </form>

      {created.length > 0 && (
        <Group
          title={`สร้างล่าสุด (${created.length} ใบ)`}
          actions={
            <Button variant="ghost" size="sm" onClick={() => void copy(created.join("\n"), "คัดลอกรหัสทั้งหมดแล้ว")}>
              <Copy />
              คัดลอกทั้งหมด
            </Button>
          }
        >
          <div className="admin-rise flex flex-wrap gap-2 p-4">
            {created.map((code, i) => (
              <button
                key={code}
                type="button"
                style={{ ["--i" as string]: i }}
                onClick={() => void copy(code)}
                className="rounded-full bg-secondary px-3 py-1 font-mono text-xs tracking-wider transition-colors hover:bg-foreground hover:text-background"
              >
                {code}
              </button>
            ))}
          </div>
        </Group>
      )}

      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-end justify-between gap-3 px-1">
          <div>
            <h3 className="text-[13px] font-semibold">บัตรทั้งหมด</h3>
            <p className="text-xs text-muted-foreground">
              พร้อมใช้ {available.length} ใบ · มูลค่า {formatBaht(available.reduce((s, v) => s + v.amount, 0))}
            </p>
          </div>
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: "available", label: "พร้อมใช้" },
              { value: "used", label: "ใช้แล้ว" },
              { value: "all", label: "ทั้งหมด" },
            ]}
          />
        </div>
        {error ? (
          <p className={cn(cardClass, "px-4 py-3 text-[13px] text-destructive")}>{error}</p>
        ) : loading && !vouchers.length ? (
          <div className="h-40 animate-pulse rounded-2xl bg-card" />
        ) : visible.length ? (
          <ul className={cn(cardClass, "divide-y divide-border overflow-hidden text-[13px]")}>
            {visible.map((voucher) => (
              <li key={voucher.id} className="flex items-center gap-3 px-4 py-2.5">
                <button type="button" onClick={() => void copy(voucher.code)} className="inline-flex items-center gap-1.5 font-mono tracking-wider hover:text-muted-foreground">
                  {voucher.code}
                  <Copy className="size-3 text-muted-foreground" />
                </button>
                <span className="ml-auto shrink-0 tabular-nums">{formatBaht(voucher.amount)}</span>
                <span className={cn("w-40 shrink-0 truncate text-right text-[11px]", voucher.is_used ? "text-muted-foreground" : "font-medium")} title={voucher.used_by_email ?? undefined}>
                  {voucher.is_used ? `ใช้แล้ว · ${voucher.used_by_email ?? "—"}` : "พร้อมใช้"}
                </span>
                <button
                  type="button"
                  aria-label={`ลบ ${voucher.code}`}
                  disabled={voucher.is_used}
                  onClick={() => void remove(voucher)}
                  className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive disabled:invisible"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <Empty icon={<Wallet className="size-6" strokeWidth={1.5} />}>ไม่มีบัตรในหมวดนี้</Empty>
        )}
      </section>
    </>
  );
});
