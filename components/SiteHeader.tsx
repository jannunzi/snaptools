import Link from "next/link";
import { siteName } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="no-print border-b-2 border-accent bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-sm font-bold text-accent-ink"
          >
            S
          </span>
          <span className="font-display text-xl tracking-tight text-ink group-hover:text-accent">
            {siteName}
          </span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-4 text-sm">
          <Link
            href="/"
            className="font-semibold text-secondary-strong transition-colors hover:text-accent"
          >
            Tools
          </Link>
        </nav>
      </div>
    </header>
  );
}
