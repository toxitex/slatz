import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { CornerDownLeft, LayoutGrid, Search, ShoppingBag } from "lucide-react";
import { useInventoryProducts } from "@/hooks/useInventoryProducts";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

type Tab = "products" | "categories";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SearchModal({ open, onClose }: Props) {
  const { config } = useSiteConfig();
  const { products } = useInventoryProducts();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("products");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const product of products) {
      if (product.category) set.add(product.category);
    }
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) =>
      [product.name, product.description, product.category].some((field) =>
        field?.toLowerCase().includes(q),
      ),
    );
  }, [products, query]);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((category) => category.toLowerCase().includes(q));
  }, [categories, query]);

  const currentList: Array<{ key: string; label: string; sublabel?: string; onPick: () => void }> =
    tab === "products"
      ? filteredProducts.map((product) => ({
          key: product.id,
          label: product.name,
          sublabel: product.category || undefined,
          onPick: () => {
            setLocation(`/product/${product.id}`);
            onClose();
          },
        }))
      : filteredCategories.map((category) => ({
          key: category,
          label: category,
          onPick: () => {
            setLocation(`/category/${encodeURIComponent(category)}`);
            onClose();
          },
        }));

  useEffect(() => {
    setActiveIndex(0);
  }, [query, tab]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "Tab") {
        event.preventDefault();
        setTab((current) => (current === "products" ? "categories" : "products"));
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, Math.max(currentList.length - 1, 0)));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
      } else if (event.key === "Enter") {
        const item = currentList[activeIndex];
        if (item) {
          event.preventDefault();
          item.onPick();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, currentList, activeIndex]);

  if (!open) return null;

  return (
    <div
      className="search-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="search-modal">
        <div className="search-modal-input-row">
          <Search size={18} className="search-modal-icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-modal-input"
            placeholder={config.searchPlaceholder || "ค้นหาสินค้า หมวดหมู่..."}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="button" className="search-modal-esc" onClick={onClose}>esc</button>
        </div>

        <div className="search-modal-body">
          <aside className="search-modal-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "products"}
              className={`search-modal-tab${tab === "products" ? " active" : ""}`}
              onClick={() => setTab("products")}
            >
              <span className="search-modal-tab-label">
                <ShoppingBag size={15} /> สินค้า
              </span>
              <span className="search-modal-tab-count">{filteredProducts.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "categories"}
              className={`search-modal-tab${tab === "categories" ? " active" : ""}`}
              onClick={() => setTab("categories")}
            >
              <span className="search-modal-tab-label">
                <LayoutGrid size={15} /> หมวดหมู่
              </span>
              <span className="search-modal-tab-count">{filteredCategories.length}</span>
            </button>
          </aside>

          <div className="search-modal-results" role="listbox">
            {currentList.length === 0 ? (
              <div className="search-modal-empty">ไม่พบผลลัพธ์</div>
            ) : (
              currentList.map((item, index) => (
                <button
                  key={item.key}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`search-modal-result${index === activeIndex ? " active" : ""}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={item.onPick}
                >
                  <span className="search-modal-result-label">{item.label}</span>
                  {item.sublabel ? <span className="search-modal-result-sub">{item.sublabel}</span> : null}
                </button>
              ))
            )}
          </div>
        </div>

        <footer className="search-modal-footer">
          <span className="search-modal-brand">{config.logoText}</span>
          <div className="search-modal-hints">
            <span className="search-modal-hint">
              <kbd className="search-kbd">↑</kbd>
              <kbd className="search-kbd">↓</kbd>
              เลือก
            </span>
            <span className="search-modal-hint">
              <kbd className="search-kbd">Tab</kbd>
              สลับ
            </span>
            <span className="search-modal-hint">
              <kbd className="search-kbd"><CornerDownLeft size={11} /></kbd>
              เปิด
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
