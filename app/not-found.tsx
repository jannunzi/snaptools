import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">
        404
      </p>
      <h1 className="mt-2 font-display text-4xl text-ink">Tool not found</h1>
      <p className="mt-3 text-ink-muted">
        That slug is not in the tools directory.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-ink"
      >
        Back to tools
      </Link>
    </div>
  );
}
