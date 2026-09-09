export type ColoringCategory = "animals" | "mandalas" | "fantasy" | "nature";

export type ColoringPage = {
  id: string;
  title: string;
  category: ColoringCategory;
  src: string;
  prompt: string;
  /** True when the checked-in PNG is still a stand-in, not Imagine art. */
  temporary: boolean;
};

export const COLORING_LINE_ART_RULES = [
  "Black-and-white coloring book page for children.",
  "Clean black outlines on a pure white background.",
  "Thick kid-friendly contour lines, closed shapes that are easy to color in.",
  "No gray shading, no hatching, no gradients, no drop shadows.",
  "No large filled black regions that block coloring (tiny eye pupils are OK).",
  "No text, letters, numbers, captions, signatures, watermarks, or logos.",
  "No licensed, trademarked, or copyrighted characters.",
  "Original generic design, centered, printable portrait composition.",
  "Simple decorative details, not photorealistic.",
].join(" ");

export function coloringPrompt(subject: string) {
  return `${COLORING_LINE_ART_RULES} Subject: ${subject}`;
}

export const coloringPages: ColoringPage[] = [
  {
    id: "cat",
    title: "Sitting cat",
    category: "animals",
    src: "/coloring/cat.png",
    prompt: coloringPrompt(
      "A friendly sitting house cat with whiskers, a striped tail, and a ball of yarn.",
    ),
    temporary: false,
  },
  {
    id: "fish",
    title: "Fish",
    category: "animals",
    src: "/coloring/fish.png",
    prompt: coloringPrompt(
      "A cheerful tropical fish with large fins, empty outlined scales, bubbles, and seaweed.",
    ),
    temporary: false,
  },
  {
    id: "butterfly",
    title: "Butterfly",
    category: "animals",
    src: "/coloring/butterfly.png",
    prompt: coloringPrompt(
      "A butterfly with large patterned wings made of empty outlined cells, beside a flower.",
    ),
    temporary: false,
  },
  {
    id: "owl",
    title: "Owl",
    category: "animals",
    src: "/coloring/owl.png",
    prompt: coloringPrompt(
      "A perched owl on a branch with big round outlined eyes and empty feather shapes.",
    ),
    temporary: false,
  },
  {
    id: "mandala-petals",
    title: "Petal mandala",
    category: "mandalas",
    src: "/coloring/mandala-petals.png",
    prompt: coloringPrompt(
      "A circular flower mandala with many empty petal rings and geometric cells.",
    ),
    temporary: false,
  },
  {
    id: "mandala-star",
    title: "Star mandala",
    category: "mandalas",
    src: "/coloring/mandala-star.png",
    prompt: coloringPrompt(
      "A geometric star mandala with an eight-point star, concentric rings, and empty cells.",
    ),
    temporary: false,
  },
  {
    id: "castle",
    title: "Castle",
    category: "fantasy",
    src: "/coloring/castle.png",
    prompt: coloringPrompt(
      "A fairy-tale castle with towers, empty window shapes, a gate, and simple clouds.",
    ),
    temporary: false,
  },
  {
    id: "dragon",
    title: "Garden dragon",
    category: "fantasy",
    src: "/coloring/dragon.png",
    prompt: coloringPrompt(
      "A friendly cute garden dragon with wings and empty outlined belly scales among flowers.",
    ),
    temporary: false,
  },
  {
    id: "dinosaur",
    title: "Stegosaurus",
    category: "fantasy",
    src: "/coloring/dinosaur.png",
    prompt: coloringPrompt(
      "A friendly smiling stegosaurus with empty outlined back plates and simple plants.",
    ),
    temporary: false,
  },
  {
    id: "tree",
    title: "Shade tree",
    category: "nature",
    src: "/coloring/tree.png",
    prompt: coloringPrompt(
      "A large shade tree with a thick trunk, empty outlined leaf clusters, grass, and a bird.",
    ),
    temporary: false,
  },
  {
    id: "flower",
    title: "Sunflower",
    category: "nature",
    src: "/coloring/flower.png",
    prompt: coloringPrompt(
      "A big sunflower with empty petals, an outlined seed center, stem, leaves, and a butterfly.",
    ),
    temporary: false,
  },
  {
    id: "sailboat",
    title: "Sailboat",
    category: "nature",
    src: "/coloring/sailboat.png",
    prompt: coloringPrompt(
      "A sailboat with two empty outlined sails, a hull, waves, a sun, and a seagull.",
    ),
    temporary: false,
  },
];

export const coloringCategories: { id: ColoringCategory; label: string }[] = [
  { id: "animals", label: "Animals" },
  { id: "mandalas", label: "Mandalas" },
  { id: "fantasy", label: "Fantasy" },
  { id: "nature", label: "Nature" },
];

export const extraColoringSubjects: Record<ColoringCategory, string[]> = {
  animals: [
    "A happy puppy chasing a butterfly in a garden.",
    "A sea turtle swimming with outlined shell plates.",
    "A rabbit with long ears sitting beside a carrot.",
  ],
  mandalas: [
    "A snowflake mandala with six-fold symmetry and empty cells.",
    "A sunburst mandala with pointed rays and inner rings.",
  ],
  fantasy: [
    "A small cottage with a round door and mushroom garden.",
    "A unicorn standing in a meadow with a flowing mane.",
  ],
  nature: [
    "A seashell and starfish still life on outlined sand.",
    "A mountain cabin with pine trees and a winding path.",
  ],
};

export function pagesForCategory(category: ColoringCategory) {
  return coloringPages.filter((page) => page.category === category);
}

export function randomSubject(category: ColoringCategory) {
  const extras = extraColoringSubjects[category];
  const starters = coloringPages
    .filter((page) => page.category === category)
    .map((page) => page.prompt.replace(`${COLORING_LINE_ART_RULES} Subject: `, ""));
  const pool = [...starters, ...extras];
  return pool[Math.floor(Math.random() * pool.length)] ?? starters[0] ?? "A simple flower.";
}
