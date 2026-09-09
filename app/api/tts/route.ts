import { NextResponse } from "next/server";
import type { SpellingLang } from "@/lib/spelling-words";
import { getXaiApiKey, XAI_TTS_VOICE, xaiHeaders, xaiUrl } from "@/lib/xai";
import { ttsLanguageByLang } from "@/lib/tts";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const LANGS = new Set<SpellingLang>(["en", "es", "fr"]);

export async function GET() {
  return NextResponse.json({ available: Boolean(getXaiApiKey()) });
}

export async function POST(request: Request) {
  const apiKey = getXaiApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "XAI_API_KEY is not configured", fallback: true },
      { status: 503 },
    );
  }

  if (!rateLimit(`tts:${clientKey(request)}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Too many speech requests. Try again in a moment.", fallback: true },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text =
    typeof body === "object" && body && "text" in body
      ? String((body as { text: unknown }).text ?? "").trim()
      : "";
  const languageRaw =
    typeof body === "object" && body && "language" in body
      ? String((body as { language: unknown }).language ?? "en")
      : "en";
  const language = (LANGS.has(languageRaw as SpellingLang) ? languageRaw : "en") as SpellingLang;

  if (!text || text.length > 200) {
    return NextResponse.json({ error: "Text is required (max 200 characters)." }, { status: 400 });
  }

  const upstream = await fetch(xaiUrl("/tts"), {
    method: "POST",
    headers: xaiHeaders(apiKey),
    body: JSON.stringify({
      text,
      voice_id: XAI_TTS_VOICE,
      language: ttsLanguageByLang[language],
      speed: 0.9,
    }),
    cache: "no-store",
  });

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    return NextResponse.json(
      {
        error: "xAI TTS request failed",
        fallback: true,
        status: upstream.status,
        detail: detail.slice(0, 300),
      },
      { status: 502 },
    );
  }

  const audio = await upstream.arrayBuffer();
  return new NextResponse(audio, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
