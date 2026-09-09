import { spellingBanks } from "@/lib/spelling-banks";

export type SpellingLang = "en" | "es" | "fr";
export type SpellingDifficulty = "easy" | "challenge";
export type SpellingSetSize = 10 | 20 | 40 | "all";

export type SpellingList = {
  id: SpellingLang;
  label: string;
  locale: string;
};

export const spellingLists: SpellingList[] = [
  { id: "en", label: "English", locale: "en-US" },
  { id: "es", label: "Español", locale: "es-ES" },
  { id: "fr", label: "Français", locale: "fr-FR" },
];

export const spellingDifficulties: {
  id: SpellingDifficulty;
  label: string;
  hint: string;
}[] = [
  { id: "easy", label: "Easy", hint: "Everyday words" },
  { id: "challenge", label: "Challenge", hint: "Trickier spellings" },
];

export const spellingSetSizes: { id: SpellingSetSize; label: string }[] = [
  { id: 10, label: "10" },
  { id: 20, label: "20" },
  { id: 40, label: "40" },
  { id: "all", label: "All" },
];

export const DEFAULT_SET_SIZE: SpellingSetSize = 10;

export function getSpellingList(id: SpellingLang) {
  return spellingLists.find((list) => list.id === id) ?? spellingLists[0];
}

export function getSpellingBank(
  lang: SpellingLang,
  difficulty: SpellingDifficulty,
) {
  return spellingBanks[lang][difficulty];
}

export function bankSize(lang: SpellingLang, difficulty: SpellingDifficulty) {
  return getSpellingBank(lang, difficulty).length;
}

const COMBINING_MARKS = /\p{M}/gu;

/** Lowercase + trim + strip combining marks (á→a, ñ→n, ü→u). */
export function foldSpelling(value: string) {
  return value.trim().normalize("NFD").replace(COMBINING_MARKS, "").toLocaleLowerCase();
}

export function spellingMatches(
  input: string,
  target: string,
  requireAccents: boolean,
) {
  if (requireAccents) {
    return (
      input.trim().normalize("NFC").toLocaleLowerCase() ===
      target.trim().normalize("NFC").toLocaleLowerCase()
    );
  }
  return foldSpelling(input) === foldSpelling(target);
}

export function shuffleWords(words: string[]) {
  const copy = [...words];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function dealSpellingSet(
  remaining: string[],
  bank: string[],
  size: SpellingSetSize,
): { set: string[]; remaining: string[]; reshuffled: boolean } {
  let pool = remaining;
  let reshuffled = false;
  if (pool.length === 0) {
    pool = shuffleWords(bank);
    reshuffled = true;
  }
  const count = size === "all" ? pool.length : Math.min(size, pool.length);
  return {
    set: pool.slice(0, count),
    remaining: pool.slice(count),
    reshuffled,
  };
}

export function setSizeLabel(size: SpellingSetSize, setLength?: number) {
  if (size === "all") return setLength ? `All (${setLength})` : "All";
  return String(size);
}
