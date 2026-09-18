/** Public-domain Dolch basic sight words (E. W. Dolch, 1936). Not a proprietary list. */

export type SightListId =
  | "pre-primer"
  | "primer"
  | "grade1"
  | "grade2"
  | "grade3";

export type SightSetSize = 10 | 20 | 40;

export type SightWordList = {
  id: SightListId;
  label: string;
  hint: string;
  words: readonly string[];
};

export const SIGHT_SET_SIZES: { id: SightSetSize; label: string }[] = [
  { id: 10, label: "10" },
  { id: 20, label: "20" },
  { id: 40, label: "40" },
];

export const DEFAULT_SIGHT_SET_SIZE: SightSetSize = 10;

export const SIGHT_WORD_LISTS: SightWordList[] = [
  {
    id: "pre-primer",
    label: "Pre-Primer",
    hint: "First high-frequency words",
    words: [
      "a",
      "and",
      "away",
      "big",
      "blue",
      "can",
      "come",
      "down",
      "find",
      "for",
      "funny",
      "go",
      "help",
      "here",
      "I",
      "in",
      "is",
      "it",
      "jump",
      "little",
      "look",
      "make",
      "me",
      "my",
      "not",
      "one",
      "play",
      "red",
      "run",
      "said",
      "see",
      "the",
      "three",
      "to",
      "two",
      "up",
      "we",
      "where",
      "yellow",
      "you",
    ],
  },
  {
    id: "primer",
    label: "Primer",
    hint: "Kindergarten–early grade 1",
    words: [
      "all",
      "am",
      "are",
      "at",
      "ate",
      "be",
      "black",
      "brown",
      "but",
      "came",
      "did",
      "do",
      "eat",
      "four",
      "get",
      "good",
      "have",
      "he",
      "into",
      "like",
      "must",
      "new",
      "no",
      "now",
      "on",
      "our",
      "out",
      "please",
      "pretty",
      "ran",
      "ride",
      "saw",
      "say",
      "she",
      "so",
      "soon",
      "that",
      "there",
      "they",
      "this",
      "too",
      "under",
      "want",
      "was",
      "well",
      "went",
      "what",
      "white",
      "who",
      "will",
      "with",
      "yes",
    ],
  },
  {
    id: "grade1",
    label: "Grade 1",
    hint: "First-grade sight words",
    words: [
      "after",
      "again",
      "an",
      "any",
      "as",
      "ask",
      "by",
      "could",
      "every",
      "fly",
      "from",
      "give",
      "going",
      "had",
      "has",
      "her",
      "him",
      "his",
      "how",
      "just",
      "know",
      "let",
      "live",
      "may",
      "of",
      "old",
      "once",
      "open",
      "over",
      "put",
      "round",
      "some",
      "stop",
      "take",
      "thank",
      "them",
      "then",
      "think",
      "walk",
      "were",
      "when",
    ],
  },
  {
    id: "grade2",
    label: "Grade 2",
    hint: "Second-grade sight words",
    words: [
      "always",
      "around",
      "because",
      "been",
      "before",
      "best",
      "both",
      "buy",
      "call",
      "cold",
      "does",
      "don't",
      "fast",
      "first",
      "five",
      "found",
      "gave",
      "goes",
      "green",
      "its",
      "made",
      "many",
      "off",
      "or",
      "pull",
      "read",
      "right",
      "sing",
      "sit",
      "sleep",
      "tell",
      "their",
      "these",
      "those",
      "upon",
      "us",
      "use",
      "very",
      "wash",
      "which",
      "why",
      "wish",
      "work",
      "would",
      "write",
      "your",
    ],
  },
  {
    id: "grade3",
    label: "Grade 3",
    hint: "Third-grade sight words",
    words: [
      "about",
      "better",
      "bring",
      "carry",
      "clean",
      "cut",
      "done",
      "draw",
      "drink",
      "eight",
      "fall",
      "far",
      "full",
      "got",
      "grow",
      "hold",
      "hot",
      "hurt",
      "if",
      "keep",
      "kind",
      "laugh",
      "light",
      "long",
      "much",
      "myself",
      "never",
      "only",
      "own",
      "pick",
      "seven",
      "shall",
      "show",
      "six",
      "small",
      "start",
      "ten",
      "today",
      "together",
      "try",
      "warm",
    ],
  },
];

export const ALL_SIGHT_WORDS = SIGHT_WORD_LISTS.flatMap((list) => [...list.words]);

export function getSightList(id: SightListId) {
  return SIGHT_WORD_LISTS.find((list) => list.id === id) ?? SIGHT_WORD_LISTS[0];
}

export function wordsMatch(input: string, target: string) {
  return (
    input.trim().toLocaleLowerCase() === target.trim().toLocaleLowerCase()
  );
}

export function shuffleWords(words: readonly string[]) {
  const copy = [...words];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function dealSightSet(words: readonly string[], size: number) {
  return shuffleWords(words).slice(0, Math.min(size, words.length));
}

export function nextSightWord(words: readonly string[], last: string | null) {
  if (words.length === 0) return "";
  let pick = words[Math.floor(Math.random() * words.length)];
  for (let i = 0; i < 8 && last && words.length > 1; i += 1) {
    if (pick !== last) break;
    pick = words[Math.floor(Math.random() * words.length)];
  }
  return pick;
}

export function pickSightChoices(word: string, list: readonly string[]) {
  const pool = list.filter((item) => item !== word);
  const extra = ALL_SIGHT_WORDS.filter(
    (item) => item !== word && !pool.includes(item),
  );
  const distractors = shuffleWords(pool)
    .concat(shuffleWords(extra))
    .slice(0, 3);
  return shuffleWords([word, ...distractors]);
}
