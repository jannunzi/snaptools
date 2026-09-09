import type { SpellingLang } from "@/lib/spelling-words";

export type VoiceSource = "grok" | "browser";

export type EnglishAccent = "en-US" | "en-GB";

export const englishAccents: { id: EnglishAccent; label: string; hint: string }[] = [
  { id: "en-US", label: "US", hint: "American English" },
  { id: "en-GB", label: "UK", hint: "British English" },
];

export const ttsVoices = [
  { id: "eve", label: "Eve", hint: "Energetic" },
  { id: "ara", label: "Ara", hint: "Warm" },
  { id: "leo", label: "Leo", hint: "Strong" },
  { id: "rex", label: "Rex", hint: "Clear" },
] as const;

export type TtsVoiceId = (typeof ttsVoices)[number]["id"];

export const DEFAULT_TTS_VOICE: TtsVoiceId = "eve";
export const DEFAULT_ENGLISH_ACCENT: EnglishAccent = "en-US";

const VOICE_IDS = new Set<string>(ttsVoices.map((voice) => voice.id));

const TTS_LANGUAGES = new Set([
  "en",
  "en-US",
  "en-GB",
  "es",
  "es-ES",
  "fr",
  "fr-FR",
]);

/** Default xAI language tags when the client only sends a short language id. */
export const ttsLanguageByLang: Record<SpellingLang, string> = {
  en: "en-US",
  es: "es-ES",
  fr: "fr",
};

export function isTtsVoiceId(value: string): value is TtsVoiceId {
  return VOICE_IDS.has(value.toLowerCase());
}

export function resolveTtsVoiceId(value: unknown): TtsVoiceId {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  return isTtsVoiceId(raw) ? raw : DEFAULT_TTS_VOICE;
}

export function resolveTtsLanguage(
  value: unknown,
  fallback: SpellingLang = "en",
): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (TTS_LANGUAGES.has(raw)) {
    if (raw === "en") return "en-US";
    if (raw === "es") return "es-ES";
    return raw;
  }
  if (raw === "en" || raw === "es" || raw === "fr") {
    return ttsLanguageByLang[raw];
  }
  return ttsLanguageByLang[fallback];
}

export function ttsLanguageFor(
  lang: SpellingLang,
  accent: EnglishAccent = DEFAULT_ENGLISH_ACCENT,
): string {
  if (lang === "en") return accent;
  return ttsLanguageByLang[lang];
}

export function browserLocaleFor(
  lang: SpellingLang,
  accent: EnglishAccent = DEFAULT_ENGLISH_ACCENT,
): string {
  if (lang === "en") return accent;
  if (lang === "es") return "es-ES";
  return "fr-FR";
}
