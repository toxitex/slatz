import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Clock, History, ShoppingBag, User as UserIcon, Wallet } from "lucide-react";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { useAuth } from "@/hooks/useAuth";

/**
 * Design philosophy reminder: Cyber-Noir Thai Commerce.
 * User account dashboard layout structure aligned with Tailwind styling system.
 */

type Tab = "topup" | "orders" | "history" | "profile";

const SIDEBAR_ITEMS: { key: Tab; href: string; label: string; icon: typeof Wallet }[] = [
  { key: "topup", href: "/topup", label: "เติมเงิน", icon: Wallet },
  { key: "orders", href: "/orders", label: "คำสั่งซื้อ", icon: ShoppingBag },
  { key: "history", href: "/history", label: "ประวัติเติมเงิน", icon: History },
  { key: "profile", href: "/profile", label: "โปรไฟล์", icon: UserIcon },
];

type Props = {
  activeTab: Tab;
  children: ReactNode;
};

export function UserLayout({ activeTab, children }: Props) {
  const { config } = useSiteConfig();
  const { user, signOut } = useAuth();
  const [, navigate] = useLocation();

  if (!user) return null;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-black/10">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[var(--syncx-border)] bg-black/30 backdrop-blur-md flex flex-col gap-6 p-5 flex-shrink-0">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors duration-200 no-underline cursor-pointer">
          <ArrowLeft size={14} className="text-[var(--syncx-accent)]" />
          กลับหน้าหลัก
        </Link>

        <div className="flex items-center gap-3 bg-white/5 border border-white/5 p-4 rounded-xl">
          <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--syncx-accent)]/10 text-white font-bold border border-white/10 overflow-hidden flex-shrink-0">
            {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : user.initial}
          </span>
          <div>
            <strong className="block text-xs font-bold text-white tracking-wide">{user.displayName}</strong>
            <span className="block text-[10px] font-bold text-[var(--syncx-accent)] mt-0.5">฿{user.balance.toLocaleString("th-TH")}</span>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex flex-col gap-1 overflow-y-auto pr-1" aria-label="User sections">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-2.5 text-xs font-medium py-2 px-3 rounded-lg transition-all duration-200 outline-none w-full cursor-pointer no-underline ${
                  isActive
                    ? "bg-[var(--syncx-accent)]/10 text-white font-bold border-l-2 border-[var(--syncx-accent)] pl-2.5"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon size={15} className={isActive ? "text-[var(--syncx-accent)]" : "text-gray-500"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout button */}
        <button
          type="button"
          className="syncx-btn-danger mt-auto py-2 w-full text-xs cursor-pointer"
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
        >
          ออกจากระบบ
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-grow p-6 md:p-8 overflow-x-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
