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
    tagline: "Listen to a word, then type the spelling.",
    description:
      "The browser speaks a word in English, Spanish, or French. Type what you hear. Instant feedback, a streak counter, replay, and an optional slow voice.",
    day: 3,
    publishedOn: "2026-09-08",
    audience: "Kids and language learners building everyday spelling",
    status: "live",
    howTo:
      "Start on Easy English. Hear the word, say the letters, then type. Replay if you need it. Switch on Slow speech for new languages. Move to Medium when a 10-word streak feels easy.",
    books: [
      {
        asin: "1483811751",
        title: "Spectrum Spelling Workbook Grade 2",
        author: "Spectrum",
        blurb:
          "Phonics, sight words, vowels, and compound words with puzzles — a classroom spelling workbook.",
      },
      {
        asin: "0071463380",
        title: "Easy Spanish Step-By-Step",
        author: "Barbara Bregstein",
        blurb:
          "High-frequency Spanish grammar and vocabulary, built for beginners who want words to stick.",
      },
      {
        asin: "0071453873",
        title: "Easy French Step-By-Step",
        author: "Myrna Bell Rochester",
        blurb:
          "A clear beginner path through French words and grammar, with practice that matches listen-and-type work.",
      },
    ],
  },
  {
    slug: "printable-coloring",
    title: "Printable Coloring Pages",
    tagline: "Original line art you can color, print, or download.",
    description:
      "Twelve original pages — animals, mandalas, generic fantasy, and nature. Fill shapes on screen, then print or download the SVG. No licensed TV or franchise characters.",
    day: 4,
    publishedOn: "2026-09-08",
    audience: "Kids, families, and anyone who wants a quick coloring break",
    status: "live",
    howTo:
      "Pick a category, tap a page, then tap a color and a shape. White erases. Print for paper, or download the SVG to keep your fills.",
    books: [
      {
        asin: "1780671067",
        title: "Secret Garden: An Inky Treasure Hunt and Coloring Book",
        author: "Johanna Basford",
        blurb:
          "Original pen-and-ink garden pages — the adult coloring book that started a shelf of inky worlds.",
      },
      {
        asin: "1780674872",
        title: "Enchanted Forest: An Inky Quest and Coloring Book",
        author: "Johanna Basford",
        blurb:
          "A follow-up forest of original line work. No characters from a show — just trees, creatures, and patterns.",
      },
      {
        asin: "0486494535",
        title: "Creative Haven In Full Bloom Coloring Book",
        author: "Ruth Soffer",
        blurb:
          "Original botanical line art — sunflowers, lilies, and garden close-ups. No franchise characters.",
      },
    ],
  },
  {
    slug: "civics-quiz",
    title: "US Civics Quiz",
    tagline: "Practice the official 2025 USCIS civics questions.",
    description:
      "A typed practice quiz from the official 128-question 2025 civics list. Quick 10, interview-style 20 (pass at 12), or browse every accepted answer. The real test is oral.",
    day: 5,
    publishedOn: "2026-09-08",
    audience: "Citizenship applicants and anyone studying U.S. civics",
    status: "live",
    howTo:
      "Use Quick 10 to warm up. Use Interview 20 when you want the real pass line (12 of 20). Open Study browse to read every official answer. Check USCIS test updates for names that change after elections.",
    books: [
      {
        asin: "1637988125",
        title: "US Citizenship Test Study Guide 2026 and 2027",
        author: "B. Hettinger / Trivium Test Prep",
        blurb:
          "Aligned to the 128-question USCIS civics exam, with explanations of government, history, and geography.",
      },
      {
        asin: "B0F1CJ3CWG",
        title: "US Citizenship Test Study Guide 2025",
        author: "American Citizenship Study Guide",
        blurb:
          "A 2025 study guide with civics Q&A plus reading and writing vocabulary for the interview.",
      },
      {
        asin: "1438002181",
        title: "U.S. Citizenship Test (Barron's Test Prep)",
        author: "Gladys E. Alesi",
        blurb:
          "Barron’s civics, history, and English practice for the naturalization interview, with application advice.",
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

  return true;
}
