import { MATH_LAB_CATEGORY } from "@/lib/math-labs";

export type AmazonBook = {
  asin: string;
  title: string;
  author: string;
  blurb: string;
};

export type ToolStatus = "live" | "coming-soon";

/** Fluency drills omit this. Labs are projector manipulatives. */
export type ToolFormat = "practice" | "lab";

export const TOOL_CATEGORIES = [
  { id: "math", label: "Math" },
  { id: "history-civics", label: "History & Civics" },
  { id: "languages", label: "Languages" },
  { id: "arts", label: "Arts" },
  { id: "faith", label: "Faith" },
] as const;

export type ToolCategoryId = (typeof TOOL_CATEGORIES)[number]["id"];

export const TOOL_CATEGORY_ORDER: readonly ToolCategoryId[] =
  TOOL_CATEGORIES.map((category) => category.id);

const TOOL_CATEGORY_LABELS: Record<ToolCategoryId, string> = Object.fromEntries(
  TOOL_CATEGORIES.map((category) => [category.id, category.label]),
) as Record<ToolCategoryId, string>;

export type Tool = {
  slug: string;
  /** Hub grouping. Assign one of the locked ids in TOOL_CATEGORIES. */
  category: ToolCategoryId;
  /** Omit for fluency drills. Labs can be listed together later. */
  format?: ToolFormat;
  title: string;
  tagline: string;
  description: string;
  /** Extra search phrases for the tool page. Omit to keep the site keywords. */
  keywords?: string[];
  day: number;
  publishedOn: string;
  audience: string;
  status: ToolStatus;
  howTo: string;
  /** Optional link rendered at the end of the teacher tip. */
  tipLink?: { href: string; label: string };
  books: AmazonBook[];
};

export const tools: Tool[] = [
  {
    slug: "multiplication-tables",
    category: "math",
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
    category: "arts",
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
    category: "languages",
    title: "Spelling Practice",
    tagline: "Hear a word, type the spelling — English, Spanish, or French.",
    description:
      "Clear voice reads a word aloud. Type what you heard. English, Spanish, or French, Easy or Challenge banks, and a 10 / 20 / 40 / all set. US or UK English accent, optional Spanish accents, score and streak. Browser speech is the fallback.",
    day: 3,
    publishedOn: "2026-09-08",
    audience: "Kids and language learners practicing spelling by ear",
    status: "live",
    howTo:
      "Pick a language, difficulty, and set size (default 10). For English, choose US or UK. Clear voice reads the word — type it and press Enter; the box refocuses for the next one. Spanish accent marks are optional unless you turn on Require accent marks. After a set, deal the next batch from the bank.",
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
    category: "arts",
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
    category: "history-civics",
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
    category: "math",
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
  {
    slug: "telling-time",
    category: "math",
    title: "Telling Time Practice",
    tagline: "Read the analog clock — hours to the minute.",
    description:
      "Read an analog clock and type the digital time. Practice, race a 60-second quiz, or see how long you can streak. Instant feedback and missed-time review, from whole hours to the minute.",
    day: 7,
    publishedOn: "2026-09-13",
    audience: "Kids, parents, and teachers practicing analog clocks",
    status: "live",
    howTo:
      "Start with Easy (whole hours). Type the time you see, like 3:00, and press Enter. When that feels easy, move to half hours, then quarters, five-minute marks, and finally every minute. Use Timed for a one-minute sprint; use Streak to find the times that still stall you.",
    books: [
      {
        asin: "1635783259",
        title: "Humble Math — 100 Days of Money, Fractions, & Telling the Time",
        author: "Humble Math",
        blurb:
          "Daily pages for counting money, fractions, and telling time — hours through minutes, with an answer key.",
      },
      {
        asin: "0938256440",
        title: "School Zone Time, Money & Fractions Workbook",
        author: "School Zone",
        blurb:
          "Short 1st–2nd grade pages for telling time, counting coins, and simple fractions.",
      },
      {
        asin: "1483826910",
        title: "The Complete Book of Time and Money, Grades K–3",
        author: "Carson Dellosa",
        blurb:
          "A thick K–3 workbook for analog clocks, hours and minutes, coins, bills, and making change.",
      },
    ],
  },
  {
    slug: "counting-money",
    category: "math",
    title: "Counting Money Practice",
    tagline: "Count US coins and bills — or make change.",
    description:
      "Count pennies through quarters, add $1 and $5 bills, or make change from a price and payment. Practice, race a 60-second quiz, or see how long you can streak. Instant feedback and missed-item review.",
    day: 8,
    publishedOn: "2026-09-14",
    audience: "Kids, parents, and teachers practicing US money skills",
    status: "live",
    howTo:
      "Start with Easy: name a coin or count a pile of the same coins. Type cents (25) or dollars ($0.25). When that feels easy, mix coins, then add $1 and $5 bills. Challenge is make-change: read the price, count what was paid, and type the change owed. Use Timed for a one-minute sprint; use Streak to find the problems that still stall you.",
    books: [
      {
        asin: "1483831108",
        title: "Spectrum Counting Money, Grade 2",
        author: "Spectrum",
        blurb:
          "Coins, bills, skip-counting, and making change from a dollar — focused Grade 2 money pages with an answer key.",
      },
      {
        asin: "1589473256",
        title: "School Zone Time, Money & Fractions Workbook",
        author: "School Zone",
        blurb:
          "Short 1st–2nd grade pages for coin values, adding money, telling time, and simple fractions.",
      },
      {
        asin: "1635783259",
        title: "Humble Math — 100 Days of Money, Fractions, & Telling the Time",
        author: "Humble Math",
        blurb:
          "Daily pages for counting money, fractions, and telling time — coins through making change, with an answer key.",
      },
    ],
  },
  {
    slug: "addition-subtraction-facts",
    category: "math",
    title: "Addition & Subtraction Facts Practice",
    tagline: "Fact fluency for sums and differences through 20.",
    description:
      "Pick addition, subtraction, or both, then practice, race a 60-second quiz, or see how long you can streak. Instant feedback, missed-fact review, and a printable 0–12 addition chart.",
    day: 9,
    publishedOn: "2026-09-15",
    audience: "Kids, parents, and teachers building early fact fluency",
    status: "live",
    howTo:
      "Start with Easy add or subtract (0–5, sums to 10). Say the fact out loud, then type it. When that feels easy, try Medium (through 10), then mixed Challenge through 20. Use Timed for a one-minute sprint; use Streak to find the facts that still stall you.",
    books: [
      {
        asin: "1635783003",
        title: "Humble Math — 100 Days of Timed Tests: Addition and Subtraction",
        author: "Humble Math",
        blurb:
          "Daily 0–20 addition and subtraction drills with an answer key. A few minutes a day builds recall.",
      },
      {
        asin: "0938256912",
        title: "School Zone Addition 0–12 Flash Cards",
        author: "School Zone",
        blurb:
          "Take-anywhere flash cards for addition facts through 12 — speed and accuracy in short sessions.",
      },
      {
        asin: "0938256920",
        title: "School Zone Subtraction 0–12 Flash Cards",
        author: "School Zone",
        blurb:
          "Matching subtraction flash cards for the 0–12 facts — a pocket drill next to the addition deck.",
      },
    ],
  },
  {
    slug: "history-timeline",
    category: "history-civics",
    title: "History Timeline",
    tagline: "Parallel lanes of world history — past left, future right.",
    description:
      "Scroll a horizontal timeline with several history lanes at once. Add, remove, or drag-reorder the rows, set a lane’s color in its config, zoom from millennia to days, and let missing spans fill as you pan. Seeded events show immediately; Grok writes the blanks and MongoDB remembers the window.",
    day: 10,
    publishedOn: "2026-09-15",
    audience: "Students, teachers, and anyone lining up what happened when",
    status: "live",
    howTo:
      "Scroll left for the past, right for the future. Add a lane from the dropdown, drag the grip to reorder, or remove it with ×. The gear opens color and rename. Zoom from millennia through days. Lanes, colors, zoom, and scroll restore on reload. A new custom lane starts filling for the window you are looking at.",
    books: [
      {
        asin: "0062316117",
        title: "Sapiens: A Brief History of Humankind",
        author: "Yuval Noah Harari",
        blurb:
          "A wide-angle tour from the Cognitive Revolution to the present — useful context beside any lane on the timeline.",
      },
      {
        asin: "030014332X",
        title: "A Little History of the World",
        author: "E. H. Gombrich",
        blurb:
          "A short, chronological telling of world history written to be read, not crammed — a companion for panning eras.",
      },
      {
        asin: "0393317552",
        title: "Guns, Germs, and Steel",
        author: "Jared Diamond",
        blurb:
          "Why some societies accumulated empires, crops, and tools first — a long-range view next to the inventions and empires lanes.",
      },
    ],
  },
  {
    slug: "states-and-capitals",
    category: "history-civics",
    title: "US States & Capitals",
    tagline: "Name the capital — or the state.",
    description:
      "Practice all 50 U.S. states and capitals. Capital from state, state from capital, or mixed. Multiple choice or type-the-answer, by Census region, with a quick 10, a full 50, or a streak.",
    day: 11,
    publishedOn: "2026-09-16",
    audience: "Kids, parents, and anyone brushing up on U.S. geography",
    status: "live",
    howTo:
      "Pick a direction and a region. Use multiple choice to warm up, then type the answer. Quick 10 is a short set; Full 50 covers every state in the filter. Streak ends on the first miss. Turn on postal abbreviations if you want a hint on capital-from-state questions.",
    books: [
      {
        asin: "0593196899",
        title: "Fun with 50 States",
        author: "Nicole Claesen",
        blurb:
          "Maps, mazes, and state facts for ages 6–10 — capitals, nicknames, and landmarks without a worksheet stack.",
      },
      {
        asin: "B0CKZ1L3RT",
        title: "All About The 50 States Workbook",
        author: "Julie K. Tolleson",
        blurb:
          "One research page per state — capital, geography, and places of interest for a short sit-down after the quiz.",
      },
      {
        asin: "B0CHG91SMP",
        title: "United States Activity and Fun Fact Book",
        author: "Mrs Huntington",
        blurb:
          "Two pages per state with maps, capitals, and puzzles — a homeschool-style paper companion to the practice set.",
      },
    ],
  },
  {
    slug: "fractions-practice",
    category: "math",
    title: "Fractions Practice",
    tagline: "Identify, simplify, compare, and operate on fractions.",
    description:
      "Read a shaded pie or bar, reduce to lowest terms, compare two fractions, then add and subtract like denominators or convert improper and mixed numbers. Practice, race a 60-second quiz, or see how long you can streak. Instant feedback and missed-item review.",
    day: 12,
    publishedOn: "2026-09-17",
    audience: "Kids, parents, and teachers building fraction fluency (grades ~3–6)",
    status: "live",
    howTo:
      "Start with Easy: name the shaded part of a pie or bar — halves, thirds, fourths, fifths, eighths, and tenths. Type 3/4 or tap the numerator and denominator. When that feels easy, try Medium: simplify, name an equivalent, or compare two fractions. Challenge adds and subtracts with the same denominator and converts improper ↔ mixed numbers. Use Timed for a one-minute sprint; use Streak to find the problems that still stall you.",
    books: [
      {
        asin: "1635783186",
        title: "Humble Math — 100 Days of Decimals, Percents & Fractions",
        author: "Humble Math",
        blurb:
          "Daily drills for converting, reducing, and operating on fractions/decimals/percents.",
      },
      {
        asin: "148380478X",
        title: "Spectrum Fractions, Grade 5",
        author: "Spectrum",
        blurb:
          "Focused grade-5 fraction concepts, operations, pretests/posttests, answer key.",
      },
      {
        asin: "1483804801",
        title: "Spectrum Fractions Workbook, Grade 6",
        author: "Spectrum",
        blurb:
          "Add/subtract/multiply/divide fractions with step-by-step examples and assessments.",
      },
    ],
  },
  {
    slug: "sight-words",
    category: "languages",
    title: "Sight Words Practice",
    tagline: "Flash and type high-frequency Dolch words.",
    description:
      "Practice Dolch pre-primer through grade 3 sight words. Flash recognition (pick from four), type-the-word, Practice / Timed / Streak modes, and set size 10 / 20 / 40. Instant feedback and missed-word review.",
    day: 13,
    publishedOn: "2026-09-18",
    audience: "Kids, parents, and teachers building early reading fluency",
    status: "live",
    howTo:
      "Start with Pre-Primer and Flash to warm up. When that feels easy, switch to Type, then Primer / Grade 1+. Use Timed for a one-minute sprint; use Streak to find words that still stall you.",
    books: [
      {
        asin: "1483811883",
        title: "Spectrum Sight Words, Kindergarten",
        author: "Spectrum",
        blurb:
          "Kindergarten phonics, sentence strips, and flash cards for the first sight words — a paper follow-up after a short on-screen set.",
      },
      {
        asin: "1483811891",
        title: "Spectrum Sight Words, Grade 1",
        author: "Spectrum",
        blurb:
          "Scrambled sentences and flash cards for grade 1 sight words — extra pages once Pre-Primer and Primer feel easy.",
      },
      {
        asin: "1589473388",
        title: "School Zone Sight Word Fun Workbook",
        author: "School Zone",
        blurb:
          "1st grade word recognition and spelling pages — short, colorful practice next to the flash and type modes.",
      },
    ],
  },
  {
    slug: "place-value",
    category: "math",
    title: "Place Value Practice",
    tagline: "Name the place — or the value of a digit.",
    description:
      "Name the place of an underlined digit, or its value. Practice, race a 60-second quiz, or see how long you can streak. Instant feedback, missed-item review, and a printable place-value chart — ones through hundred thousands, plus tenths and hundredths.",
    day: 14,
    publishedOn: "2026-09-19",
    audience: "Kids, parents, and teachers building place-value fluency (grades ~2–5)",
    status: "live",
    howTo:
      "Start with Easy: whole numbers to hundreds. Type the place of the underlined digit (tens, 10s, or ten) or its value (40 or four tens). When that feels easy, try Medium: numbers through hundred thousands, expanded form, and compare two numbers. Challenge adds decimals to thousandths and rounding to a named place. Use Timed for a one-minute sprint; use Streak to find the problems that still stall you.",
    books: [
      {
        asin: "1635783313",
        title: "Humble Math — 100 Days of Place Value, Rounding & Estimation",
        author: "Humble Math",
        blurb:
          "Daily place-value, rounding, and estimation practice with an answer key.",
      },
      {
        asin: "1483824268",
        title: "Spectrum Place Value and Rounding, Grade 4",
        author: "Spectrum",
        blurb:
          "Focused Grade 4 pages for multi-digit place value and rounding.",
      },
      {
        asin: "0887431372",
        title: "School Zone Math Basics 1",
        author: "School Zone",
        blurb:
          "Numbers, skip counting, and early place value for ages 6–7.",
      },
    ],
  },
  {
    slug: "skip-counting",
    category: "math",
    title: "Skip Counting Practice",
    tagline: "Count by 2s, 5s, 10s — and beyond.",
    description:
      "Fill the missing number in a short skip-counting sequence. Practice, race a 60-second quiz, or see how long you can streak. Instant feedback, missed-item review, and a printable chart for 2s, 5s, and 10s.",
    day: 15,
    publishedOn: "2026-09-20",
    audience: "Kids, parents, and teachers building early number fluency",
    status: "live",
    howTo:
      "Start with Easy (2, 5, 10). Type the missing number in the sequence and press Enter. When that feels easy, add 3s and 4s, then Challenge (6–9, 25, 100). Use Timed for a one-minute sprint; use Streak to find the skips that still stall you.",
    books: [
      {
        asin: "0887431372",
        title: "School Zone Math Basics 1 Workbook",
        author: "School Zone",
        blurb:
          "1st grade numbers 1–100, skip counting, and more — short colorful pages after a fluency set.",
      },
      {
        asin: "1483871444",
        title: "Spectrum 1st Grade Math Workbook",
        author: "Spectrum",
        blurb:
          "Addition, subtraction, place value, shapes, and early number skills for ages 6–7.",
      },
      {
        asin: "B0GTHSLD3B",
        title: "Skip Counting Workbook Grade 2",
        author: "Kristen Math",
        blurb:
          "Patterns and sequences by 2s, 5s, 10s, and 100s, with word problems and an answer key.",
      },
    ],
  },
  {
    slug: "first-communion-prayers",
    category: "faith",
    title: "First Communion Prayers",
    tagline: "Our Father, Hail Mary, Glory Be, Act of Contrition.",
    description:
      "Practice the core prayers for First Communion. Put the lines in order or fill in a missing word. Practice, a short quiz, or streak — instant feedback, reverent and simple.",
    day: 16,
    publishedOn: "2026-09-20",
    audience: "Children preparing for First Communion (~Grade 2), with a parent or catechist",
    status: "live",
    howTo:
      "Read a prayer, then put its lines in order or tap the missing word. Start with one prayer; mix all four when that feels easy. Use the short quiz for a scored set of 8; use Streak until the first miss.",
    books: [
      {
        asin: "0899422403",
        title: "St. Joseph First Communion Catechism (No. 0)",
        author: "Bennet Kelley",
        blurb:
          "Baltimore Catechism No. 0 for grades 1–2 — prayers, pictures, and short lessons for First Communion prep.",
      },
      {
        asin: "0895551446",
        title: "Baltimore Catechism One",
        author: "Third Council of Baltimore",
        blurb:
          "Question-and-answer lessons for First Communicants through about fifth grade — a paper companion to the prayers.",
      },
      {
        asin: "1593251491",
        title: "Jesus Speaks to Me on My First Holy Communion",
        author: "Angela M. Burrin",
        blurb:
          "A gentle First Communion gift book with Scripture scenes and the traditional prayers children memorize.",
      },
    ],
  },
  {
    slug: "parts-of-the-mass",
    category: "faith",
    title: "Parts of the Mass",
    tagline: "Name the four parts — and the moments inside them.",
    description:
      "A First Communion quiz on Introductory Rites, Liturgy of the Word, Liturgy of the Eucharist, and Concluding Rites. Multiple choice or match Gospel, Homily, Consecration, Sign of Peace, Communion, and Dismissal.",
    day: 17,
    publishedOn: "2026-09-20",
    audience: "Children preparing for First Communion (~Grade 2), with a parent or catechist",
    status: "live",
    howTo:
      "Start with multiple choice to learn the four parts in order. Switch to Match to place each moment in the right part of Mass. Practice keeps going; the short quiz is 8 questions; Streak ends on the first miss.",
    books: [
      {
        asin: "1592760759",
        title: "The Mass Book for Children",
        author: "Rosemarie Gortler and Donna Piscitelli",
        blurb:
          "A short, illustrated walk through the parts of Mass for children about preschool to age 9.",
      },
      {
        asin: "0899422403",
        title: "St. Joseph First Communion Catechism (No. 0)",
        author: "Bennet Kelley",
        blurb:
          "First Communion lessons on the Mass and the Eucharist, with pictures for grades 1–2.",
      },
      {
        asin: "0895551446",
        title: "Baltimore Catechism One",
        author: "Third Council of Baltimore",
        blurb:
          "Clear Q&A on the Mass and the Holy Eucharist for First Communicants.",
      },
    ],
  },
  {
    slug: "eucharist-basics",
    category: "faith",
    title: "Eucharist Basics",
    tagline: "Jesus is truly present — Body and Blood.",
    description:
      "A First Communion quiz: the Eucharist is the Body and Blood of Christ; bread and wine; reverence; Baptism and a ready heart; the Communion fast in simple words; who may receive. Standard catechism teaching for children.",
    day: 18,
    publishedOn: "2026-09-20",
    audience: "Children preparing for First Communion (~Grade 2), with a parent or catechist",
    status: "live",
    howTo:
      "Read each question and tap the best answer. Practice keeps going; the short quiz is 8 questions; Streak ends on the first miss. Review the missed items before the next round.",
    books: [
      {
        asin: "0899422403",
        title: "St. Joseph First Communion Catechism (No. 0)",
        author: "Bennet Kelley",
        blurb:
          "The classic First Communion catechism — Who is Jesus in the Eucharist, and how we receive him.",
      },
      {
        asin: "1593251491",
        title: "Jesus Speaks to Me on My First Holy Communion",
        author: "Angela M. Burrin",
        blurb:
          "Jesus invites the child to friendship in the Eucharist, with memory pages and traditional prayers.",
      },
      {
        asin: "0895551446",
        title: "Baltimore Catechism One",
        author: "Third Council of Baltimore",
        blurb:
          "Short Q&A on the Holy Eucharist for First Communicants through about fifth grade.",
      },
    ],
  },
  {
    slug: "roman-numerals",
    category: "math",
    title: "Roman Numerals Practice",
    tagline: "Read and write Roman numerals — I to M.",
    description:
      "Convert Arabic numbers to Roman numerals and back. Practice, race a 60-second quiz, or see how long you can streak. Instant feedback, missed-item review, and a printable chart for I, V, X, L, C, D, and M.",
    day: 19,
    publishedOn: "2026-09-21",
    audience: "Kids, parents, and teachers practicing Roman numerals (grades ~3–5)",
    status: "live",
    howTo:
      "Start with Easy: numbers 1–20 (I–XX). Type the Roman numeral or the number you see. When that feels easy, try Medium (1–100, including IV, IX, XL, XC), then Challenge through 3999 (I–MMMCMXCIX). Use Timed for a one-minute sprint; use Streak to find the numerals that still stall you.",
    books: [
      {
        asin: "B0FTFRB4H3",
        title: "Roman Numerals Workbook Grades 3-4",
        author: "Victoria School Math",
        blurb:
          "Step-by-step Grades 3–4 pages with more than 1,600 exercises and an answer key — a paper follow-up after a short on-screen set.",
      },
      {
        asin: "B0GCVW5H28",
        title: "Learning Roman Numerals for Kids",
        author: "Mr. Hocine Boumessid",
        blurb:
          "One hundred worksheets for conversions 1–100, sequences, comparisons, and an answer key.",
      },
      {
        asin: "B0CFCXD1XJ",
        title: "Math Practice Roman Numerals Workbook Grade 3rd–6th",
        author: "Nasipa Learning",
        blurb:
          "Grade 3–6 reading and writing practice — a thicker paper companion once Medium and Challenge feel familiar.",
      },
    ],
  },
  {
    slug: "fraction-wall",
    category: "math",
    format: "lab",
    title: "Interactive Fraction Wall",
    tagline: "Tap fraction bars that line up to one.",
    description:
      "An interactive fraction wall — fraction bars online for grades 3–6. Tap pieces from a whole through twelfths, compare two lengths, or match a target such as another way to show 3/4. Free, no login, ready for a classroom projector.",
    keywords: [
      "interactive fraction wall",
      "fraction bars online",
      "fraction wall",
      "equivalent fractions",
      "compare fractions",
    ],
    day: 20,
    publishedOn: "2026-09-21",
    audience: "Grades 3–6 on a projector or iPad",
    status: "live",
    howTo:
      "Project this page and tap Full screen. Tap a brick to shade from the left edge through that brick — the first half is 1/2, the third fourth is 3/4. Leave Equivalents on and tap 1/2, then 2/4, then 3/6; matching lengths are marked together. Compare sets two fractions and shows which bar is longer. Challenge asks for the same length on another row, such as a different way to show 3/4. One idea fits in five minutes.",
    books: [
      {
        asin: "1635783186",
        title: "Humble Math — 100 Days of Decimals, Percents & Fractions",
        author: "Humble Math",
        blurb:
          "Daily drills for converting, reducing, and operating on fractions/decimals/percents.",
      },
      {
        asin: "148380478X",
        title: "Spectrum Fractions, Grade 5",
        author: "Spectrum",
        blurb:
          "Focused grade-5 fraction concepts, operations, pretests/posttests, answer key.",
      },
      {
        asin: "1483804801",
        title: "Spectrum Fractions Workbook, Grade 6",
        author: "Spectrum",
        blurb:
          "Add/subtract/multiply/divide fractions with step-by-step examples and assessments.",
      },
    ],
  },
  {
    slug: "area-perimeter",
    category: "math",
    format: "lab",
    title: "Area vs Perimeter Tiles",
    tagline: "Paint squares. Compare area and perimeter.",
    description:
      "An area vs perimeter interactive. Paint unit squares or drag a rectangle and watch area and perimeter update together. Try same perimeter, different area: a long bar and a square can share the distance around while the square holds more squares. Free, no login, ready for a classroom projector.",
    keywords: [
      "area vs perimeter interactive",
      "same perimeter different area",
      "same area different perimeter",
      "area and perimeter",
      "perimeter of a rectangle",
    ],
    day: 21,
    publishedOn: "2026-09-21",
    audience: "Grades 3–5 on a projector or iPad",
    status: "live",
    howTo:
      "Project this page and tap Full screen. Explore opens on a rectangle — drag a handle, or tap Width and Height. Area is the filled squares. The bright edge is the perimeter, the walk around the outside. Open Same perimeter: the long bar and the square can share a perimeter while the square holds more squares. Tap More square, same perimeter and watch the area climb. Same area keeps the tile count — tap Longer bar, same area and the walk around grows. Target asks for an area, a perimeter, or both. Paint is there when you want a shape that is not a rectangle. One idea fits in five minutes.",
    books: [
      {
        asin: "1635783305",
        title: "Humble Math — Area, Perimeter, Volume, & Surface Area",
        author: "Humble Math",
        blurb:
          "Area and perimeter problems first, then volume and surface area, with an answer key.",
      },
      {
        asin: "1523293179",
        title: "Area & Perimeter - Grade 3 Workbook",
        author: "Maria Miller",
        blurb:
          "Grade 3 area and perimeter, including rectangles that share a perimeter and differ in area.",
      },
      {
        asin: "1934968676",
        title: "Grade 4 Geometry & Measurement",
        author: "Kumon Publishing",
        blurb:
          "Grade 4 geometry: area and perimeter of rectangles, then volume, angles, and circles.",
      },
    ],
  },
  {
    slug: "pythagoras",
    category: "math",
    format: "lab",
    title: "Pythagoras Lab",
    tagline: "Drag a right triangle. Watch a² + b² = c².",
    description:
      "An interactive Pythagorean theorem. Drag a right triangle and watch the Pythagoras area squares on each side — a², b², and c² — update together. The a²+b²=c² visual stays true as you drag. The right angle stays fixed. Free, no login, ready for a classroom projector.",
    keywords: [
      "interactive pythagorean theorem",
      "pythagoras area squares",
      "a²+b²=c² visual",
      "pythagorean theorem",
      "right triangle squares",
    ],
    day: 22,
    publishedOn: "2026-09-21",
    audience: "Grades 7–9 on a projector or iPad",
    status: "live",
    howTo:
      "Project this page and tap Full screen. Explore opens on a 3–4–5 triangle. Drag a corner: the squares are the areas, and 9 + 16 = 25 stays true. Tap Show why — the big square splits into two rectangles, one matching each leg. Open Triples and tap 5–12–13, then 8–15–17. Missing side hides one length. Add the areas, or drag the free leg until the hypotenuse matches, then tap Check. One idea fits in five minutes.",
    books: [
      {
        asin: "1570911509",
        title: "What's Your Angle, Pythagoras?",
        author: "Julie Ellis",
        blurb:
          "A picture-book adventure that introduces the right angle and how the squares on its sides fit together.",
      },
      {
        asin: "1570917760",
        title: "Pythagoras and the Ratios",
        author: "Julie Ellis",
        blurb:
          "The sequel: Pythagoras tunes pipes and lyres and finds a mathematical ratio that makes the notes agree.",
      },
      {
        asin: "0691148236",
        title: "The Pythagorean Theorem: A 4,000-Year History",
        author: "Eli Maor",
        blurb:
          "A short history of the theorem, from Babylonian tablets to the proofs still taught beside a right triangle.",
      },
    ],
  },
  {
    slug: "unit-circle",
    category: "math",
    format: "lab",
    title: "Unit Circle Lab",
    tagline: "Drag the point. Read sine and cosine.",
    description:
      "An interactive unit circle. Drag a point on the circumference and read the angle in unit circle radians and degrees, plus the fraction of a turn. Coordinates show sin and cos on the unit circle, with the reference right triangle drawn in. Snap to 0°, 30°, 45°, 60°, 90° and the matching radian measures. Free, no login, ready for a classroom projector.",
    keywords: [
      "interactive unit circle",
      "unit circle radians degrees",
      "sin cos on unit circle",
      "unit circle",
      "trig ratios",
    ],
    day: 23,
    publishedOn: "2026-09-21",
    audience: "Algebra 2 and precalculus on a projector or iPad",
    status: "live",
    howTo:
      "Project this page and tap Full screen. It opens at 45°, π/4, one eighth of a turn, with cosine and sine both √2/2. Drag the black thumb — Snap is on, so it catches 30°, 60°, and 90°, the same places as π/6, π/3, and π/2. Stop at the top: 90°, π/2, one quarter turn, coordinates (0, 1). The flat side of the triangle is adjacent, cosine. The upright side is opposite, sine. Switch the big readout to Radians. Tap All six and slide toward 90°: tangent grows, then reads undefined on the axis. Tap Reset to return to 45°. One idea fits in five minutes.",
    books: [
      {
        asin: "1394168551",
        title: "Trigonometry For Dummies",
        author: "Mary Jane Sterling",
        blurb:
          "A plain-English tour of sine, cosine, and tangent, including how a right triangle sits on the unit circle.",
      },
      {
        asin: "1477497781",
        title: "Trigonometry Essentials Practice Workbook with Answers",
        author: "Chris McMullen",
        blurb:
          "Calculator-free practice for degrees and radians, and the sine and cosine of the common angles through 360°.",
      },
      {
        asin: "1615641823",
        title: "The Humongous Book of Trigonometry Problems",
        author: "W. Michael Kelley",
        blurb:
          "Hundreds of worked trigonometry problems, with the missing steps written in the margin.",
      },
    ],
  },
  {
    slug: "sine-from-circle",
    category: "math",
    format: "lab",
    title: "Sine from Circle Lab",
    tagline: "Unwrap the circle into a sine wave.",
    description:
      "Unwrap the unit circle into a sine wave. A point travels the circle while a sine wave from the unit circle draws the same height — y = sin θ — against the angle. Play, pause, or drag. Turn on cosine for an interactive sine cosine circle, the picture of unwrapping the unit circle. Free, no login, ready for a classroom projector.",
    keywords: [
      "sine wave from unit circle",
      "interactive sine cosine circle",
      "unwrapping the unit circle",
      "sine and cosine waves",
      "unit circle sine wave",
    ],
    day: 24,
    publishedOn: "2026-09-21",
    audience: "Algebra 2 and precalculus on a projector or iPad",
    status: "live",
    howTo:
      "Project this page and tap Full screen. It opens at 0°. Tap Play and watch one turn: the point's height on the circle is the height of the sine wave. Pause near the top — about 90°, sine 1 — then drag a point on the wave back toward 180° and the circle follows. Tap Cosine and play again: the blue wave is the horizontal coordinate, cosine. Slow gives the room a longer look. For one angle and its right triangle, open the",
    tipLink: { href: "/tools/unit-circle", label: "Unit Circle Lab" },
    books: [
      {
        asin: "0817639144",
        title: "Trigonometry",
        author: "I.M. Gelfand and Mark Saul",
        blurb:
          "A short geometry-first introduction to sine and cosine that reaches the unit circle without a rush of formulas.",
      },
      {
        asin: "0071795359",
        title: "Schaum's Outline of Trigonometry",
        author: "Robert E. Moyer and Frank Ayres",
        blurb:
          "Worked trigonometry problems with the steps written out, for practice after a lesson on the circle and the wave.",
      },
      {
        asin: "1592441300",
        title: "Precalculus Mathematics in a Nutshell",
        author: "George F. Simmons",
        blurb:
          "Geometry, algebra, and trigonometry in one slim review, including sine and cosine as functions of a real number.",
      },
    ],
  },
  {
    slug: "slope-intercept",
    category: "math",
    format: "lab",
    title: "Slope–Intercept Explorer",
    tagline: "Drag the line. Read y = mx + b.",
    description:
      "A slope intercept explorer for an interactive y = mx + b graph. Drag the intercept and a second point anywhere on the grid. Snap to whole-number points, read signed rise and run, and see undefined slope on a vertical line. Compare a second line, or match a dashed target. Free, no login, ready for a classroom projector.",
    keywords: [
      "slope intercept explorer",
      "interactive y=mx+b",
      "graph slope rise run",
      "slope intercept form",
      "rise over run",
    ],
    day: 25,
    publishedOn: "2026-09-21",
    audience: "Algebra 1 on a projector or iPad",
    status: "live",
    howTo:
      "Project this page and tap Full screen. Explore opens on y = 2x + 1, with a rise 4, run 2 triangle — the same slope as 2. Drag the blue point anywhere on the grid, including left of the y-axis: run shows a minus when the point is to the left. Drag it straight above or below the intercept and the line is vertical, x = 0, with undefined slope. Snap lands on whole-number points. Compare adds a second line. Match asks the room to cover the dashed line; its equation stays hidden until the two agree. One idea fits in five minutes. See every lab on",
    tipLink: { href: "/math-labs", label: "Math Labs" },
    books: [
      {
        asin: "1941691056",
        title: "Basic Linear Graphing Skills Practice Workbook",
        author: "Chris McMullen",
        blurb:
          "Plotting points, slope, y-intercept, and the equation of a straight line, with answers in the back.",
      },
      {
        asin: "1523504382",
        title: "Everything You Need to Ace Pre-Algebra and Algebra 1 in One Big Fat Notebook",
        author: "Workman Publishing",
        blurb:
          "A year of pre-algebra and algebra 1 in one notebook, including graphing a line.",
      },
      {
        asin: "194169134X",
        title: "Master Essential Algebra Skills Practice Workbook with Answers",
        author: "Chris McMullen",
        blurb:
          "Worked examples and practice for the algebra that sits next to a graph of y = mx + b.",
      },
    ],
  },
  {
    slug: "venn-diagram",
    category: "math",
    format: "lab",
    title: "Venn Diagram Lab",
    tagline: "Shade the sets. Read a correct formula.",
    description:
      "An interactive Venn diagram for two or three sets inside a universal set. Shade a union, intersection, complement, or exactly-one region and the inclusion-exclusion formula fills in with your counts. Switch to elements and read A ∪ B in roster notation, or open De Morgan’s laws and see both sides shade the same region. The shading matches the formula. Free, no login, ready for a classroom projector.",
    keywords: [
      "interactive venn diagram",
      "venn diagram formula",
      "inclusion exclusion",
      "three circle venn diagram",
      "sets union intersection",
      "de morgan laws venn diagram",
      "roster notation",
    ],
    day: 26,
    publishedOn: "2026-09-25",
    audience: "Grades 5–8 on a projector or iPad",
    status: "live",
    howTo:
      "Project this page and tap Full screen. Explore opens on two sets, shaded as A ∪ B: everything in A or B, not only the overlap. The line under the diagram is n(A) + n(B) − n(A ∩ B), with the counts filled in. Change a region count and the total follows. Tap a region to shade it yourself. When the shading matches a formula, the lab names it. Elements replaces the counts with members such as A = {1, 2, 3, 4} and B = {2, 4, 6, 8}. Drag a member into a region and the lab writes A ∪ B = {1, 2, 3, 4, 6, 8} plus the set-builder line. De Morgan puts (A ∪ B)′ beside A′ ∩ B′, and (A ∩ B)′ beside A′ ∪ B′. Both diagrams in a row shade the same region. Switch to 3 sets for at least one, exactly one, exactly two, and all three. Exactly one subtracts each pairwise overlap and adds the center back, because that center was removed twice. Word problem gives soccer, chess, and music totals. Fill each region, then tap Check. One idea fits in five minutes. See every lab on",
    tipLink: { href: "/math-labs", label: "Math Labs" },
    books: [
      {
        asin: "1934124109",
        title: "Introduction to Counting & Probability",
        author: "David Patrick",
        blurb:
          "A grades 7–10 counting course that draws Venn diagrams for overlapping groups and shows why the overlap is subtracted.",
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

export function getCategoryLabel(category: ToolCategoryId) {
  return TOOL_CATEGORY_LABELS[category];
}

export function compareToolsByPublishOrder(a: Tool, b: Tool) {
  const byDate = a.publishedOn.localeCompare(b.publishedOn);
  if (byDate !== 0) return byDate;
  return a.day - b.day;
}

/** Math Labs only. The index page is /math-labs. */
export function getMathLabTools(list: readonly Tool[] = tools) {
  return getToolsByCategory(MATH_LAB_CATEGORY, list).filter(
    (tool) => tool.format === "lab",
  );
}

export function getToolsByCategory(
  category: ToolCategoryId,
  list: readonly Tool[] = tools,
) {
  return list
    .filter((tool) => tool.category === category)
    .slice()
    .sort(compareToolsByPublishOrder);
}

export type ToolCategoryGroup = {
  id: ToolCategoryId;
  label: string;
  tools: Tool[];
};

export function groupToolsByCategory(
  list: readonly Tool[] = tools,
): ToolCategoryGroup[] {
  return TOOL_CATEGORY_ORDER.map((id) => ({
    id,
    label: getCategoryLabel(id),
    tools: getToolsByCategory(id, list),
  })).filter((group) => group.tools.length > 0);
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
