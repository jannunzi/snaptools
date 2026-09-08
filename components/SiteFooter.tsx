import Link from "next/link";
import { amazonDisclosure } from "@/lib/amazon";
import { siteName } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="no-print mt-auto border-t border-line/80 bg-surface/60">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {new Date().getFullYear()} {siteName}. Free, browser-only, no
          accounts.
        </p>
        <div className="flex flex-col gap-2 sm:items-end">
          <p>{amazonDisclosure}</p>
          <Link href="/" className="font-semibold text-secondary-strong hover:text-accent">
            Back to tools
          </Link>
        </div>
      </div>
    </footer>
  );
}
