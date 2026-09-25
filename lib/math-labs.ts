/**
 * Math Labs are projector manipulatives. They stay in the Math category
 * (`format: "lab"` on the tool) beside the fluency drills.
 *
 * Shipped: Fraction Wall, Area vs Perimeter Tiles, Pythagoras, Unit Circle,
 * Sine from Circle, Slope–Intercept Explorer, Venn Diagram.
 * The index page is /math-labs (`getMathLabTools()` in lib/tools.ts).
 */

export const MATH_LAB_CATEGORY = "math" as const;

export const PLANNED_MATH_LABS = [
  { id: "fraction-wall", title: "Fraction Wall", slug: "fraction-wall" },
  { id: "pythagoras", title: "Pythagoras", slug: "pythagoras" },
  { id: "unit-circle", title: "Unit Circle", slug: "unit-circle" },
  { id: "sine-from-circle", title: "Sine from Circle", slug: "sine-from-circle" },
  { id: "area-perimeter", title: "Area vs Perimeter", slug: "area-perimeter" },
  { id: "slope", title: "Slope–Intercept Explorer", slug: "slope-intercept" },
  { id: "venn", title: "Venn Diagram", slug: "venn-diagram" },
] as const;

export type PlannedMathLabId = (typeof PLANNED_MATH_LABS)[number]["id"];
