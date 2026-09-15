"use client";

import { AmazonBookCover } from "@/components/AmazonBookCover";
import { analyticsEvents, trackEvent } from "@/lib/analytics";
import { amazonDisclosure, amazonProductUrl } from "@/lib/amazon";
import type { AmazonBook } from "@/lib/tools";

type AmazonBookBannerProps = {
  books: AmazonBook[];
  tool: string;
};

export function AmazonBookBanner({ books, tool }: AmazonBookBannerProps) {
  if (books.length === 0) {
    return null;
  }

  return (
    <aside
      className="no-print mt-14 border-t border-line pt-10"
      aria-label="Related books"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Related books
          </p>
          <h2 className="mt-2 font-display text-2xl text-ink sm:text-3xl">
            Keep going on paper
          </h2>
        </div>
        <p className="max-w-sm text-xs text-ink-muted sm:text-right">
          {amazonDisclosure}
        </p>
      </div>
      <ul className="mt-6 grid gap-4 md:grid-cols-3">
        {books.map((book) => {
          const href = amazonProductUrl(book.asin);
          const onAmazonClick = () =>
            trackEvent(analyticsEvents.amazonClick, {
              tool,
              asin: book.asin,
            });
          return (
            <li key={book.asin} className="snap-panel flex flex-col">
              <a
                href={href}
                target="_blank"
                rel="nofollow sponsored noopener noreferrer"
                className="block"
                onClick={onAmazonClick}
              >
                <AmazonBookCover asin={book.asin} title={book.title} />
              </a>
              <h3 className="mt-4 text-base font-semibold leading-snug text-ink">
                {book.title}
              </h3>
              <p className="mt-1 text-sm text-ink-muted">{book.author}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted">
                {book.blurb}
              </p>
              <a
                href={href}
                target="_blank"
                rel="nofollow sponsored noopener noreferrer"
                className="snap-btn-secondary mt-5"
                onClick={onAmazonClick}
              >
                View on Amazon
              </a>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
