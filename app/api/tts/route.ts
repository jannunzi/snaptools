import { NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { resolveTtsLanguage, resolveTtsVoiceId } from "@/lib/tts";
import { getXaiApiKey, xaiHeaders, xaiUrl } from "@/lib/xai";

export const dynamic = "force-dynamic";

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

  const record = typeof body === "object" && body ? (body as Record<string, unknown>) : {};
  const text = String(record.text ?? "").trim();
  const language = resolveTtsLanguage(record.language);
  const voiceId = resolveTtsVoiceId(record.voice_id ?? record.voiceId);

  if (!text || text.length > 200) {
    return NextResponse.json({ error: "Text is required (max 200 characters)." }, { status: 400 });
  }

  const upstream = await fetch(xaiUrl("/tts"), {
    method: "POST",
    headers: xaiHeaders(apiKey),
    body: JSON.stringify({
      text,
      voice_id: voiceId,
      language,
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
        voice_id: voiceId,
        language,
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
