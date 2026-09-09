import type { SpellingLang } from "@/lib/spelling-words";

/** xAI TTS BCP-47 codes used for EN / ES / FR spelling lists. */
export const ttsLanguageByLang: Record<SpellingLang, string> = {
  en: "en",
  es: "es-ES",
  fr: "fr",
};

export type VoiceSource = "grok" | "browser";
