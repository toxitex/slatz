import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, Clock, History, LogOut, ShoppingBag, User as UserIcon, Wallet } from "lucide-react";
import type { SyncxAuthUser } from "@/hooks/useAuth";

type Props = {
  user: SyncxAuthUser;
  onSignOut: () => void | Promise<void>;
};

export function UserMenu({ user, onSignOut }: Props) {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    await onSignOut();
    setLocation("/");
  }

  return (
    <div className="user-menu" ref={wrapRef}>
      <button
        type="button"
        className={`user-pill${open ? " open" : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="user-pill-avatar">
          {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : user.initial}
        </span>
        <span className="user-pill-name">{user.displayName}</span>
        <ChevronDown size={14} className="user-pill-chev" />
      </button>

      {open && (
        <div className="user-dropdown" role="menu">
          <div className="user-dropdown-header">
            <span className="user-pill-avatar lg">
              {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : user.initial}
            </span>
            <div>
              <div className="user-dropdown-name">{user.displayName}</div>
              <div className="user-dropdown-balance">ยอดเงิน {user.balance.toLocaleString("th-TH")}</div>
            </div>
          </div>

          <Link href="/store" className="user-dropdown-item" onClick={() => setOpen(false)}>
            <ShoppingBag size={16} /> ร้านค้า
          </Link>
          <Link href="/topup" className="user-dropdown-item" onClick={() => setOpen(false)}>
            <Wallet size={16} /> เติมเงิน
          </Link>
          <Link href="/orders" className="user-dropdown-item" onClick={() => setOpen(false)}>
            <Clock size={16} /> คำสั่งซื้อ
          </Link>
          <Link href="/history" className="user-dropdown-item" onClick={() => setOpen(false)}>
            <History size={16} /> ประวัติ
          </Link>
          <Link href="/profile" className="user-dropdown-item" onClick={() => setOpen(false)}>
            <UserIcon size={16} /> โปรไฟล์
          </Link>

          <button type="button" className="user-dropdown-logout" onClick={handleSignOut}>
            <LogOut size={16} /> ออกจากระบบ
          </button>
        </div>
      )}
    </div>
  );
}
