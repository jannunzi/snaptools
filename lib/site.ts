export const siteName = "SnapTools";

export const siteTagline = "Tiny free tools you finish in seconds.";

export const siteDescription =
  "Free browser-only tools for practice, templates, and quick reference. No accounts.";

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://snaptools.vercel.app"
  );
}
