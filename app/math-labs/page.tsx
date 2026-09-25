import type { Metadata } from "next";
import { MathLabsSignup } from "@/components/labs/MathLabsSignup";
import { ToolCard } from "@/components/ToolCard";
import { getSiteUrl } from "@/lib/site";
import { getMathLabTools } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Math Labs",
  description:
    "Free projector manipulatives: fraction bars, area and perimeter, Pythagoras, the unit circle, sine, slope, and Venn diagrams with De Morgan’s laws. No login.",
  keywords: [
    "math labs",
    "interactive venn diagram",
    "de morgan laws venn diagram",
    "slope intercept explorer",
    "interactive fraction wall",
    "interactive unit circle",
    "interactive pythagorean theorem",
    "classroom math labs",
  ],
  openGraph: {
    title: "Math Labs",
    description:
      "Free projector manipulatives: fraction bars, area and perimeter, Pythagoras, the unit circle, sine, slope, and Venn diagrams with De Morgan’s laws. No login.",
    url: `${getSiteUrl()}/math-labs`,
  },
};

export default function MathLabsPage() {
  const labs = getMathLabTools();

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
      <section className="max-w-3xl">
        <h1 className="font-display text-[2.5rem] leading-[1.08] text-ink sm:text-6xl">Math Labs</h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-muted sm:text-xl">
          Projector manipulatives for a short lesson. Drag a model, read the equation, and stop when the idea is clear.
          Free, no login.
        </p>
      </section>
      <section className="mt-12" aria-labelledby="math-labs-heading">
        <h2 id="math-labs-heading" className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-muted">
          Labs
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {labs.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>
      <MathLabsSignup />
    </div>
  );
}
