import Link from "next/link";
import type { Tool } from "@/lib/tools";

type ComingSoonPanelProps = {
  tool: Tool;
};

export function ComingSoonPanel({ tool }: ComingSoonPanelProps) {
  return (
    <section className="rounded-2xl border border-dashed border-line bg-surface p-6 sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">
        Coming soon
      </p>
      <h2 className="mt-2 font-display text-2xl text-ink">{tool.title}</h2>
      <p className="mt-3 max-w-xl text-ink-muted">{tool.description}</p>
      <p className="mt-4 text-sm text-ink-muted">
        Add this tool by creating a client component in{" "}
        <code className="rounded bg-surface-muted px-1.5 py-0.5 text-ink">
          components/tools
        </code>
        , marking it{" "}
        <code className="rounded bg-surface-muted px-1.5 py-0.5 text-ink">
          live
        </code>{" "}
        in{" "}
        <code className="rounded bg-surface-muted px-1.5 py-0.5 text-ink">
          lib/tools.ts
        </code>
        , and mapping the slug in{" "}
        <code className="rounded bg-surface-muted px-1.5 py-0.5 text-ink">
          lib/tool-components.tsx
        </code>
        .
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-ink"
      >
        Back to today’s tools
      </Link>
    </section>
  );
}
