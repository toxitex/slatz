import type { SiteConfig } from "$lib/types";

/** Messages shared between open tabs so the storefront reflects dashboard edits without a reload. */
export type SyncMessage =
  | { type: "config"; config: SiteConfig }
  | { type: "products" }
  | { type: "categories" }
  | { type: "coupons" };

const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("slatz-sync");

export function broadcast(message: SyncMessage) {
  channel?.postMessage(message);
}

export function onSync(handler: (message: SyncMessage) => void) {
  const listener = (event: MessageEvent<SyncMessage>) => handler(event.data);
  channel?.addEventListener("message", listener);
  return () => channel?.removeEventListener("message", listener);
}
