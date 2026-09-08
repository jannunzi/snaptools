export type AmazonBook = {
  asin: string;
  title: string;
  author: string;
  blurb: string;
};

export type ToolStatus = "live" | "coming-soon";

export type Tool = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  day: number;
  publishedOn: string;
  audience: string;
  status: ToolStatus;
  howTo: string;
  books: AmazonBook[];
};

export const tools: Tool[] = [
  {
    slug: "multiplication-tables",
    title: "Multiplication Tables Practice",
    tagline: "Fact fluency for the 1–12 tables.",
    description:
      "Pick tables, then practice, race a 60-second quiz, or see how long you can streak. Instant feedback, missed-fact review, and a printable 1–12 chart.",
    day: 1,
    publishedOn: "2026-09-07",
    audience: "Kids, parents, and teachers doing a quick fluency session",
    status: "live",
    howTo:
      "Start with Easy (1, 2, 5, 10). Say the fact out loud, then type it. When you can do 20 in a row, add a harder table. Use Timed for a one-minute sprint; use Streak to find the facts that still stall you.",
    books: [
      {
        asin: "1945841176",
        title: "Multiplication Facts That Stick",
        author: "Kate Snow",
        blurb:
          "Ten weeks of short lessons, games, and practice pages so facts stick without hours of flash cards.",
      },
      {
        asin: "1589473280",
        title: "School Zone Multiplication Facts Made Easy",
        author: "School Zone",
        blurb:
          "Colorful 3rd–4th grade pages for skip counting, arrays, word problems, and the core facts.",
      },
      {
        asin: "1635783011",
        title: "Humble Math — 100 Days of Timed Tests: Multiplication",
        author: "Humble Math",
        blurb:
          "Reproducible 0–12 drills with an answer key. A few minutes a day builds recall.",
      },
    ],
  },
  {
    slug: "music-note-recognition",
    title: "Music Note Recognition",
    tagline: "Name the note on the treble staff.",
    description:
      "A one-screen treble-clef quiz. A note appears on the staff — tap or type C D E F G A B. Instant feedback, a streak counter, and a lines-only warmup before you add spaces.",
    day: 2,
    publishedOn: "2026-09-08",
    audience: "Beginners learning to read notes",
    status: "live",
    howTo:
      "Start on the treble staff with just the lines (Every Good Boy Does Fine), then add spaces (FACE). Say the letter before you tap. Use Streak when you want the first miss to end the round.",
    books: [
      {
        asin: "0882848941",
        title: "Alfred's Essentials of Music Theory, Book 1",
        author: "Andrew Surmani, Karen Farnum Surmani, Morton Manus",
        blurb:
          "Short lessons on the staff, notes, and rhythm — a standard first theory workbook.",
      },
      {
        asin: "0793574072",
        title: "FastTrack Music Instruction: Keyboard 1",
        author: "Blake Neely and Gary Meisner",
        blurb:
          "Beginner keyboard method that starts with music notation, then songs you can play.",
      },
    ],
  },
];

export function getTool(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}

export function getLiveTools() {
  return tools.filter((tool) => tool.status === "live");
}

export function getFeaturedTool() {
  return (
    [...getLiveTools()].sort((a, b) => b.day - a.day)[0] ?? tools[0]
  );
}

export function getNextToolDay() {
  return Math.max(...tools.map((tool) => tool.day)) + 1;
}

const NEW_TOOL_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export function isNewTool(tool: Tool, now = Date.now()) {
  if (tool.status !== "live") return false;
  const published = Date.parse(`${tool.publishedOn}T00:00:00.000Z`);
  if (Number.isNaN(published)) return false;
  const age = now - published;
  if (age < 0 || age > NEW_TOOL_WINDOW_MS) return false;

  const newestLive = getLiveTools().reduce((latest, item) =>
    item.publishedOn >= latest.publishedOn ? item : latest,
  );
  return newestLive.slug === tool.slug;
}
