"use client";

import { FaithQuiz } from "@/components/tools/FaithQuiz";
import {
  MASS_CHOICE_QUESTIONS,
  MASS_MATCH_QUESTIONS,
  MASS_PART_ORDER,
} from "@/lib/first-communion";

export function PartsOfTheMass() {
  return (
    <div className="space-y-4">
      <aside className="rounded-xl border border-line bg-bg px-4 py-3 text-sm text-ink">
        <p className="font-semibold text-ink">The four parts of Mass</p>
        <ol className="mt-2 grid gap-1 sm:grid-cols-2">
          {MASS_PART_ORDER.map((part, index) => (
            <li key={part}>
              <span className="tabular-nums text-ink-muted">{index + 1}.</span>{" "}
              {part}
            </li>
          ))}
        </ol>
      </aside>
      <FaithQuiz
        toolSlug="parts-of-the-mass"
        intro="Name the four parts of Mass and match common moments — Gospel, Homily, Consecration, Sign of Peace, Communion, and Dismissal."
        questions={MASS_CHOICE_QUESTIONS}
        matchQuestions={MASS_MATCH_QUESTIONS}
      />
    </div>
  );
}
