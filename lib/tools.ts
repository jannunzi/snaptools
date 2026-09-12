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
  {
    slug: "spelling-practice",
    title: "Spelling Practice",
    tagline: "Hear a word, type the spelling — English, Spanish, or French.",
    description:
      "Grok reads a word aloud. Type what you heard. English, Spanish, or French, Easy or Challenge banks, and a 10 / 20 / 40 / all set. US or UK English accent, optional Spanish accents, score and streak. Browser speech is the fallback.",
    day: 3,
    publishedOn: "2026-09-08",
    audience: "Kids and language learners practicing spelling by ear",
    status: "live",
    howTo:
      "Pick a language, difficulty, and set size (default 10). For English, choose US or UK. Grok speaks the word — type it and press Enter; the box refocuses for the next one. Spanish accent marks are optional unless you turn on Require accent marks. After a set, deal the next batch from the bank.",
    books: [
      {
        asin: "148381176X",
        title: "Spectrum Spelling, Grade 3",
        author: "Spectrum",
        blurb:
          "Progressive lessons, puzzles, and a speller’s dictionary for everyday English words.",
      },
      {
        asin: "1260453499",
        title: "Practice Makes Perfect: Basic Spanish",
        author: "McGraw Hill",
        blurb:
          "Short lessons and high-frequency vocabulary for building Spanish from the ground up.",
      },
      {
        asin: "0071453873",
        title: "Easy French Step-by-Step",
        author: "Myrna Bell Rochester",
        blurb:
          "Grammar and core verbs first, then readings — a standard self-study French start.",
      },
    ],
  },
  {
    slug: "printable-coloring",
    title: "Printable Coloring Pages",
    tagline: "Coloring-book line art to color on screen or on paper.",
    description:
      "Animals, mandalas, generic fantasy, and nature. Twelve starter-pack pages stay on the site. Optional Generate makes a this-visit-only sheet (download or print to keep it). No licensed TV or cartoon characters.",
    day: 4,
    publishedOn: "2026-09-08",
    audience: "Kids, parents, and anyone who wants a quiet coloring sheet",
    status: "live",
    howTo:
      "Choose a category and a starter-pack page. Pick a color, then tap a region. Print or download. Generate new page can take up to a minute and is only for this visit — it is not a permanent link.",
    books: [
      {
        asin: "0486799875",
        title: "Creative Haven Magical Mandalas Coloring Book",
        author: "Alberta Hutchinson",
        blurb:
          "Intricate circular designs printed one side per page — a classic adult mandala book.",
      },
      {
        asin: "1780670257",
        title: "Secret Garden: An Inky Treasure Hunt and Coloring Book",
        author: "Johanna Basford",
        blurb:
          "Original garden line art — flowers, animals, and hidden details to color on paper.",
      },
      {
        asin: "1780671067",
        title: "Enchanted Forest: An Inky Quest & Coloring Book",
        author: "Johanna Basford",
        blurb:
          "Original woodland and garden line art — nature and fantasy without screen characters.",
      },
    ],
  },
  {
    slug: "civics-quiz",
    title: "USCIS Civics Quiz",
    tagline: "Practice the official 2025 naturalization civics bank.",
    description:
      "All 128 public questions and answers from the 2025 USCIS civics test (M-1778). Take a quick 10, sit an interview-style 20 (pass with 12+), or browse the bank. Current officeholders can change — confirm at USCIS.",
    day: 5,
    publishedOn: "2026-09-08",
    audience: "Applicants studying for the naturalization civics interview",
    status: "live",
    howTo:
      "Start with Quick 10 to warm up. Interview 20 asks up to 20 questions and stops at 12 correct or 9 wrong — the 2025 pass rule. Browse shows every official answer. This tool is not affiliated with USCIS.",
    books: [
      {
        asin: "1637988125",
        title: "US Citizenship Test Study Guide 2026 and 2027",
        author: "Trivium Test Prep",
        blurb:
          "128 USCIS civics questions with explanations, aligned to the current naturalization exam.",
      },
      {
        asin: "1601703325",
        title: "Learn About the United States: Quick Civics Lessons",
        author: "U.S. Citizenship and Immigration Services",
        blurb:
          "Short civics lessons that expand on the naturalization questions.",
      },
      {
        asin: "1516730690",
        title: "US Citizenship Test Study Guide 2026-2027",
        author: "Mometrix Test Preparation",
        blurb:
          "Review of the English and civics tests with detailed answer explanations.",
      },
    ],
  },
  {
    slug: "division-facts",
    title: "Division Facts Practice",
    tagline: "Fact fluency for divisors 1–12.",
    description:
      "Pick divisors, then practice, race a 60-second quiz, or see how long you can streak. Instant feedback, missed-fact review, and a printable 1–12 chart. Exact facts only — no remainders.",
    day: 6,
    publishedOn: "2026-09-12",
    audience: "Kids, parents, and teachers building division fluency",
    status: "live",
    howTo:
      "Start with Easy (1, 2, 5, 10). Say the fact out loud, then type the quotient. When you can do 20 in a row, add a harder divisor. Use Timed for a one-minute sprint; use Streak to find the facts that still stall you.",
    books: [
      {
        asin: "1635783046",
        title: "Humble Math — 100 Days of Timed Tests: Division",
        author: "Humble Math",
        blurb:
          "Daily 0–12 division drills with an answer key. A few minutes a day builds recall.",
      },
      {
        asin: "1589473299",
        title: "School Zone Multiplication & Division Workbook",
        author: "School Zone",
        blurb:
          "Colorful 3rd–4th grade pages for multiplication and division practice.",
      },
      {
        asin: "B009O4YW9S",
        title: "School Zone Division 0–12 Flash Cards",
        author: "School Zone",
        blurb:
          "Take-anywhere flash cards for the 1–12 division facts.",
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
