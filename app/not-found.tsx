import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center">
      <p className="text-sm font-medium text-ink-muted">404</p>
      <h1 className="mt-3 font-display text-4xl text-ink">Tool not found</h1>
      <p className="mt-3 text-ink-muted">
        That slug is not in the tools directory.
      </p>
      <Link href="/" className="snap-btn mt-8">
        Back to tools
      </Link>
    </div>
  );
}
