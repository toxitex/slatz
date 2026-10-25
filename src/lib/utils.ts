import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export function formatBaht(value: number) {
  return `฿${value.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`;
}

/** True when a CSS color is dark enough that light text should sit on it. */
export function isDarkColor(color: string) {
  const text = color.trim();
  const hex = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  let r = 255;
  let g = 255;
  let b = 255;
  if (hex) {
    const raw = hex[1].length === 3 ? hex[1].replace(/./g, (c) => c + c) : hex[1];
    r = Number.parseInt(raw.slice(0, 2), 16);
    g = Number.parseInt(raw.slice(2, 4), 16);
    b = Number.parseInt(raw.slice(4, 6), 16);
  } else {
    const rgb = text.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
    if (!rgb) return false;
    r = Number(rgb[1]);
    g = Number(rgb[2]);
    b = Number(rgb[3]);
  }
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.55;
}

export function parsePrice(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  return Number(String(value ?? "").replace(/[^\d.]/g, "")) || 0;
}
