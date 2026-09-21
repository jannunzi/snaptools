/**
 * Math Labs are projector manipulatives. They stay in the Math category
 * (`format: "lab"` on the tool) beside the fluency drills.
 *
 * Shipped: Fraction Wall.
 * Planned: Pythagoras, unit circle, sine-from-circle, area and perimeter, slope.
 *
 * TODO(math-labs-hub): Do not add a hub page until a second lab ships.
 * Then list `getMathLabTools()` from lib/tools.ts and link it from Math.
 */

export const MATH_LAB_CATEGORY = "math" as const;

export const PLANNED_MATH_LABS = [
  { id: "fraction-wall", title: "Fraction Wall", slug: "fraction-wall" },
  { id: "pythagoras", title: "Pythagoras" },
  { id: "unit-circle", title: "Unit Circle" },
  { id: "sine-from-circle", title: "Sine from the Circle" },
  { id: "area-perimeter", title: "Area and Perimeter" },
  { id: "slope", title: "Slope" },
] as const;

export type PlannedMathLabId = (typeof PLANNED_MATH_LABS)[number]["id"];
