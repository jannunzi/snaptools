import Link from "next/link";
import { siteName } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="no-print sticky top-0 z-20 border-b border-line/70 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-[9px] bg-accent text-[13px] font-semibold text-accent-ink"
          >
            F
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-ink group-hover:opacity-70">
            {siteName}
          </span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-5 text-sm">
          <Link
            href="/"
            className="font-medium text-ink-muted transition-colors hover:text-ink"
          >
            Tools
          </Link>
          <Link
            href="/grades"
            className="font-medium text-ink-muted transition-colors hover:text-ink"
          >
            Grades
          </Link>
        </nav>
      </div>
    </header>
  );
}
