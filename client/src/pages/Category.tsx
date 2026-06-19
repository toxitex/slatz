import { useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { RefreshCw, Search } from "lucide-react";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { useInventoryProducts } from "@/hooks/useInventoryProducts";
import { useCategories } from "@/hooks/useCategories";
import { TopNav, MobileNav, Footer, ProductCard } from "@/pages/Store";
import { ExpandableSearchBar, GlowingCards } from "@/components/fx";

/**
 * Design philosophy reminder: Cyber-Noir Thai Commerce.
 * Category page lists products filtered by selected categories using Tailwind utility layout structures.
 */

export default function Category() {
  const [, params] = useRoute("/category/:name");
  const rawName = params?.name ? decodeURIComponent(params.name) : "";
  const { config } = useSiteConfig();
  const { products, loading, error, refreshProducts } = useInventoryProducts();
  const { categories: dbCategories, loading: categoriesLoading } = useCategories();
  const [query, setQuery] = useState("");

  const category = useMemo(
    () => dbCategories.find((c) => c.name === rawName),
    [dbCategories, rawName]
  );

  const inCategory = useMemo(
    () => products.filter((p) => p.category === rawName),
    [products, rawName]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inCategory;
    return inCategory.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
    );
  }, [inCategory, query]);

  const categoryImageUrl = useMemo(() => {
    if (category?.imageUrl) return category.imageUrl;
    const firstProductWithImage = inCategory.find((p) => p.imageUrl);
    return firstProductWithImage?.imageUrl || "";
  }, [category, inCategory]);

  return (
    <>
      <TopNav />
      <main className="syncx-page">
        <section className="max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-12 w-full flex-grow">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 mb-6 text-xs font-semibold tracking-wider uppercase text-gray-500" aria-label="Store breadcrumb">
            <Link href="/store" className="text-gray-400 hover:text-white transition-colors duration-200 no-underline">ร้านค้า</Link>
            <span>/</span>
            <Link href="/store" className="text-gray-400 hover:text-white transition-colors duration-200 no-underline">หมวดหมู่</Link>
            <span>/</span>
            <span className="text-white font-bold">{rawName}</span>
          </nav>

          {/* Category Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white uppercase tracking-tight">{rawName}</h1>
              <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-wider">{inCategory.length} สินค้าในหมวดหมู่นี้</p>
            </div>
            <div className="w-full md:max-w-xs">
              <ExpandableSearchBar
                placeholder="ค้นหาสินค้าในหมวดหมู่นี้..."
                onChange={(val) => setQuery(val)}
                expandedWidth="100%"
                className="w-full"
              />
            </div>
          </header>

          {/* Banner with blur overlay */}
          {categoryImageUrl && (
            <div
              className="category-banner-card cursor-default hover:scale-100 hover:translate-y-0 hover:shadow-none mb-8"
              style={{
                backgroundImage: `url("${categoryImageUrl}")`
              }}
              role="img"
              aria-label={rawName}
            >
              <div className="category-banner-overlay" />
              <span className="category-banner-watermark">CAT</span>
            </div>
          )}

          {error ? (
            <button className="w-full p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center gap-2 transition-colors hover:bg-red-500/15 cursor-pointer" onClick={() => void refreshProducts()}>
              โหลดสินค้าไม่สำเร็จ: {error} <RefreshCw size={14} className="animate-spin" />
            </button>
          ) : null}

          {loading || categoriesLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <RefreshCw size={24} className="animate-spin text-[var(--syncx-accent)]" />
              <p className="text-xs font-semibold uppercase tracking-wider">กำลังโหลดสินค้าจากฐานข้อมูล</p>
            </div>
          ) : filtered.length ? (
            <div className="product-grid">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  buttonText={config.store.productButtonText}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4 syncx-glass rounded-2xl">
              <Search size={28} className="text-gray-500" />
              <div>
                <p className="text-sm font-bold text-white">
                  {query
                    ? `ไม่พบสินค้าที่ตรงกับ "${query}"`
                    : `ยังไม่มีสินค้าในหมวด "${rawName}"`}
                </p>
                <Link href="/store" className="inline-block mt-3 text-xs font-semibold text-[var(--syncx-accent)] hover:underline">← ดูหมวดหมู่อื่น / Browse Categories</Link>
              </div>
            </div>
          )}
        </section>
        <Footer />
      </main>
      <MobileNav />
    </>
  );
}
