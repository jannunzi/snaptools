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
