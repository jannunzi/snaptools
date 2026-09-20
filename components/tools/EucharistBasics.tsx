"use client";

import { FaithQuiz } from "@/components/tools/FaithQuiz";
import { EUCHARIST_QUESTIONS } from "@/lib/first-communion";

export function EucharistBasics() {
  return (
    <FaithQuiz
      toolSlug="eucharist-basics"
      intro="Simple First Communion teaching: the Eucharist is Jesus — his Body and Blood — received with love, after Baptism, and with a ready heart."
      questions={EUCHARIST_QUESTIONS}
    />
  );
}
