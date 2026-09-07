import { amazonDisclosure, amazonProductUrl } from "@/lib/amazon";
import type { AmazonBook } from "@/lib/tools";

type AmazonBookBannerProps = {
  books: AmazonBook[];
};

export function AmazonBookBanner({ books }: AmazonBookBannerProps) {
  if (books.length === 0) {
    return null;
  }

  return (
    <aside
      className="no-print mt-10 rounded-2xl border border-line bg-surface p-5 sm:p-6"
      aria-label="Related books"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Related books
          </p>
          <h2 className="mt-1 font-display text-2xl text-ink">
            Keep going on paper
          </h2>
        </div>
        <p className="text-xs text-ink-muted">{amazonDisclosure}</p>
      </div>
      <ul className="mt-5 grid gap-4 md:grid-cols-3">
        {books.map((book) => (
          <li
            key={book.asin}
            className="flex flex-col rounded-xl border border-line bg-bg/50 p-4"
          >
            <h3 className="text-base font-semibold leading-snug text-ink">
              {book.title}
            </h3>
            <p className="mt-1 text-sm text-ink-muted">{book.author}</p>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted">
              {book.blurb}
            </p>
            <a
              href={amazonProductUrl(book.asin)}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-3 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90"
            >
              View on Amazon
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
