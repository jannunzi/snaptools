"use client";

import Image from "next/image";
import { useState } from "react";
import { amazonCoverUrl } from "@/lib/amazon";

type AmazonBookCoverProps = {
  asin: string;
  title: string;
};

export function AmazonBookCover({ asin, title }: AmazonBookCoverProps) {
  const [failed, setFailed] = useState(false);
  const initial = title.trim().charAt(0).toUpperCase() || "B";

  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-surface-muted">
      {failed ? (
        <div
          className="grid h-full w-full place-items-center bg-accent-soft font-display text-5xl text-accent"
          aria-hidden
        >
          {initial}
        </div>
      ) : (
        <Image
          src={amazonCoverUrl(asin)}
          alt={`${title} cover`}
          fill
          sizes="(min-width: 768px) 220px, 50vw"
          className="object-contain p-1.5"
          onError={() => setFailed(true)}
          onLoad={(event) => {
            const img = event.currentTarget;
            if (img.naturalWidth < 8 || img.naturalHeight < 8) {
              setFailed(true);
            }
          }}
        />
      )}
    </div>
  );
}
