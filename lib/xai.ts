const XAI_API_BASE = "https://api.x.ai/v1";

export function getXaiApiKey() {
  const key = process.env.XAI_API_KEY?.trim();
  return key ? key : null;
}

export function xaiHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

export function xaiUrl(path: string) {
  return `${XAI_API_BASE}${path}`;
}

export const XAI_TTS_VOICE = "eve";
export const XAI_IMAGE_MODEL = "grok-imagine-image-2.0";
export const XAI_CHAT_MODEL = "grok-4.6";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: { content?: string | null };
  }>;
};

function extractJsonPayload(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1]?.trim() ?? trimmed;
  return JSON.parse(raw) as unknown;
}

export async function xaiChatJson(options: {
  apiKey: string;
  system: string;
  user: string;
  temperature?: number;
}): Promise<unknown> {
  const messages: ChatMessage[] = [
    { role: "system", content: options.system },
    { role: "user", content: options.user },
  ];

  const upstream = await fetch(xaiUrl("/chat/completions"), {
    method: "POST",
    headers: xaiHeaders(options.apiKey),
    body: JSON.stringify({
      model: XAI_CHAT_MODEL,
      messages,
      temperature: options.temperature ?? 0.25,
      response_format: { type: "json_object" },
    }),
    cache: "no-store",
  });

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    throw new Error(
      `xAI chat failed (${upstream.status}): ${detail.slice(0, 280)}`,
    );
  }

  const payload = (await upstream.json()) as ChatCompletionResponse;
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("xAI chat returned an empty message.");
  }

  try {
    return extractJsonPayload(content);
  } catch {
    throw new Error("xAI chat returned unreadable JSON.");
  }
}
