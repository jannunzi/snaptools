import { track } from "@vercel/analytics";

/** Stable custom event names. Page views come from `<Analytics />` in the root layout. */
export const analyticsEvents = {
  practiceStart: "practice_start",
  practiceFinish: "practice_finish",
  nextSet: "next_set",
  coloringGenerate: "coloring_generate",
  printChart: "print_chart",
  amazonClick: "amazon_click",
} as const;

export type AnalyticsEventName =
  (typeof analyticsEvents)[keyof typeof analyticsEvents];

/** Small enums, slugs, and numbers already shown in the UI. No PII. */
export type AnalyticsEventProps = {
  tool: string;
  mode?: string;
  score?: number;
  count?: number;
  asin?: string;
  category?: string;
};

export function trackEvent(
  name: AnalyticsEventName,
  props: AnalyticsEventProps,
) {
  track(name, props);
}
