import { useId, useState, type ReactNode } from "react";
import { AlertCircle, Check, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { cn } from "@/lib/utils";

export const fieldClass =
  "w-full rounded-md bg-transparent px-1.5 py-1 text-right text-muted-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:bg-secondary focus:text-left focus:text-foreground";

export const cardClass = "rounded-2xl bg-card shadow-[0_0_0_0.5px_var(--border),0_1px_2px_rgba(0,0,0,0.04)]";

export function Group({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-2", className)}>
      {(title || actions) && (
        <div className="flex items-end justify-between gap-3 px-1">
          <div>
            {title && <h3 className="text-[13px] font-semibold">{title}</h3>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(cardClass, "divide-y divide-border overflow-hidden")}>{children}</div>
    </section>
  );
}

export function Row({
  label,
  hint,
  stacked = false,
  children,
}: {
  label: string;
  hint?: string;
  stacked?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div
      role="group"
      aria-labelledby={id}
      className={cn("flex gap-4 px-4 text-[13px]", stacked ? "flex-col gap-2 py-3" : "min-h-11 items-center justify-between py-2")}
    >
      <div className="shrink-0">
        <span id={id} className="block">
          {label}
        </span>
        {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      <div className={cn("min-w-0", stacked ? "w-full" : "flex flex-1 items-center justify-end gap-2")}>{children}</div>
    </div>
  );
}

export function TextRow({
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = "text",
  multiline = false,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
}) {
  return (
    <Row label={label} hint={hint} stacked={multiline}>
      {multiline ? (
        <textarea
          value={value}
          placeholder={placeholder}
          aria-label={label}
          rows={4}
          onChange={(event) => onChange(event.target.value)}
          className="w-full resize-y rounded-xl bg-secondary px-3 py-2 text-[13px] leading-relaxed outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
        />
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
          className={cn(fieldClass, "max-w-sm")}
        />
      )}
    </Row>
  );
}

export function ColorRow({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  const isHex = /^#[0-9a-f]{6}$/i.test(value);
  return (
    <Row label={label} hint={hint}>
      <input
        value={value}
        aria-label={`${label} (ค่าสี)`}
        onChange={(event) => onChange(event.target.value)}
        className={cn(fieldClass, "w-44 font-mono text-xs")}
      />
      <label
        className="relative size-6 shrink-0 overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)]"
        style={{ background: value }}
      >
        {isHex && (
          <input
            type="color"
            value={value}
            aria-label={label}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        )}
      </label>
    </Row>
  );
}

async function uploadImage(file: File) {
  const response = await fetch("/api/upload", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": file.type || "image/png",
      "X-Admin-Access-Code": window.sessionStorage.getItem("syncx-admin-access-code") || "",
    },
    body: file,
  });
  const data = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!response.ok || !data?.url) throw new Error(data?.error || `HTTP ${response.status}`);
  return data.url;
}

export function ImageRow({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadImage(file));
      toast.success(`อัปโหลด${label}สำเร็จ`);
    } catch (error) {
      toast.error(`อัปโหลด${label}ล้มเหลว: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Row label={label} stacked>
      <div className="flex items-center gap-3">
        <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-secondary">
          {value ? <img src={value} alt="" className="size-full object-cover" /> : <ImageIcon className="size-5 text-muted-foreground" strokeWidth={1.5} />}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <input
            value={draft ?? value}
            placeholder="https://..."
            aria-label={`ลิงก์${label}`}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => {
              if (draft !== null && draft !== value) onChange(draft);
              setDraft(null);
            }}
            className="w-full rounded-lg bg-secondary px-3 py-1.5 text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
          />
          <div className="flex gap-3 text-xs">
            <label className="cursor-pointer font-medium hover:underline">
              {uploading ? "กำลังอัปโหลด..." : "อัปโหลดรูป…"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploading}
                onChange={(event) => {
                  void onFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
            {value && (
              <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => onChange("")}>
                ลบรูป
              </button>
            )}
          </div>
        </div>
      </div>
    </Row>
  );
}

export function Empty({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className={cn(cardClass, "flex flex-col items-center gap-2 px-6 py-14 text-center text-[13px] text-muted-foreground")}>
      {icon}
      {children}
    </div>
  );
}

export function SaveStatus() {
  const { saveState, saveError, retrySave } = useSiteConfig();
  return (
    <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground" aria-live="polite">
      {saveState === "saving" && (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          กำลังบันทึก...
        </>
      )}
      {saveState === "saved" && (
        <>
          <Check className="size-3.5 text-foreground" />
          บันทึกแล้ว · อัปเดตหน้าร้าน
        </>
      )}
      {saveState === "error" && (
        <>
          <AlertCircle className="size-3.5 text-destructive" />
          <span className="text-destructive" title={saveError ?? undefined}>
            บันทึกไม่สำเร็จ
          </span>
          <button type="button" className="font-medium text-foreground hover:underline" onClick={retrySave}>
            ลองอีกครั้ง
          </button>
        </>
      )}
      {saveState === "idle" && "บันทึกอัตโนมัติ"}
    </span>
  );
}

export function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className="relative grid size-2.5 place-items-center">
      {ok && <span className="absolute size-2.5 animate-ping rounded-full bg-foreground/25" />}
      <span className={cn("size-2 rounded-full", ok ? "bg-foreground" : "bg-destructive")} />
    </span>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-foreground/[0.06] p-0.5 text-xs">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full px-3 py-1 transition-colors",
            value === option.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export const formatBaht = (value: number) => `฿${(value ?? 0).toLocaleString("th-TH", { maximumFractionDigits: 2 })}`;
