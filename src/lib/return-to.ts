/** Keep post-login redirects inside this site. */
export function afterAuth(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.includes("://") && !next.includes("\\")) {
    return next;
  }
  return "/store";
}
