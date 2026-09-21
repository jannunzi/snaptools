/**
 * Math Labs are projector manipulatives. They stay in the Math category
 * (`format: "lab"` on the tool) beside the fluency drills.
 *
 * Shipped: Fraction Wall, Area vs Perimeter Tiles, Pythagoras.
 * Planned: unit circle, sine-from-circle, slope.
 *
 * TODO(math-labs-hub): Three labs are registered. The hub page stays out of
 * this PR — list `getMathLabTools()` from lib/tools.ts when the hub is built.
 */

export const MATH_LAB_CATEGORY = "math" as const;

export const PLANNED_MATH_LABS = [
  { id: "fraction-wall", title: "Fraction Wall", slug: "fraction-wall" },
  { id: "pythagoras", title: "Pythagoras", slug: "pythagoras" },
  { id: "unit-circle", title: "Unit Circle" },
  { id: "sine-from-circle", title: "Sine from the Circle" },
  { id: "area-perimeter", title: "Area vs Perimeter", slug: "area-perimeter" },
  { id: "slope", title: "Slope" },
] as const;

export type PlannedMathLabId = (typeof PLANNED_MATH_LABS)[number]["id"];
