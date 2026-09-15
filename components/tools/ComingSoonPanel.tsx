import Link from "next/link";
import type { Tool } from "@/lib/tools";

type ComingSoonPanelProps = {
  tool: Tool;
};

export function ComingSoonPanel({ tool }: ComingSoonPanelProps) {
  return (
    <section className="snap-panel">
      <p className="snap-badge snap-badge-muted">Coming soon</p>
      <h2 className="mt-4 font-display text-2xl text-ink">{tool.title}</h2>
      <p className="mt-3 max-w-xl text-ink-muted">{tool.description}</p>
      <p className="mt-4 text-sm text-ink-muted">
        Add this tool by creating a client component in{" "}
        <code className="rounded-md bg-surface-muted px-1.5 py-0.5 text-ink">
          components/tools
        </code>
        , marking it{" "}
        <code className="rounded-md bg-surface-muted px-1.5 py-0.5 text-ink">
          live
        </code>{" "}
        in{" "}
        <code className="rounded-md bg-surface-muted px-1.5 py-0.5 text-ink">
          lib/tools.ts
        </code>
        , and mapping the slug in{" "}
        <code className="rounded-md bg-surface-muted px-1.5 py-0.5 text-ink">
          lib/tool-components.tsx
        </code>
        .
      </p>
      <Link href="/" className="snap-btn mt-6">
        Back to tools
      </Link>
    </section>
  );
}
