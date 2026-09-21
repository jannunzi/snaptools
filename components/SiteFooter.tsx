import Link from "next/link";
import { amazonDisclosure } from "@/lib/amazon";
import { siteName } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="no-print mt-auto border-t border-line/70">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-10 text-sm text-ink-muted sm:flex-row sm:items-start sm:justify-between sm:px-8">
        <p>
          © {new Date().getFullYear()} {siteName}. Free, browser-only, no
          accounts.
        </p>
        <div className="flex flex-col gap-2 sm:items-end">
          <p className="max-w-sm sm:text-right">{amazonDisclosure}</p>
          <div className="flex flex-wrap gap-4 sm:justify-end">
            <Link href="/" className="text-ink hover:opacity-70">
              Tools
            </Link>
            <Link href="/grades" className="text-ink hover:opacity-70">
              Grades
            </Link>
            <Link href="/learn" className="text-ink hover:opacity-70">
              Skill map
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
