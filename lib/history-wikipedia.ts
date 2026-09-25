import {
  eventSpan,
  formatYearRange,
  type HistoryEvent,
} from "@/lib/history-timeline";

const WIKI_HOST = "https://en.wikipedia.org/wiki/";
const WIKI_PATH_RE =
  /(?:https?:\/\/)?(?:[a-z]{2}\.)?wikipedia\.org\/wiki\/([^?#]+)/i;

export function parseWikipediaField(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const raw = value.trim();
  if (!raw || raw.length > 160) return undefined;

  const fromUrl = raw.match(WIKI_PATH_RE);
  const title = fromUrl?.[1] ? safeDecode(fromUrl[1]) : raw;
  const cleaned = title.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned || /^Special:/i.test(cleaned)) return undefined;
  return cleaned.slice(0, 160);
}

export function wikipediaArticleTitle(
  event: Pick<HistoryEvent, "wikipedia" | "wikiTitle">,
): string | undefined {
  return parseWikipediaField(event.wikipedia) ?? parseWikipediaField(event.wikiTitle);
}

export function wikipediaArticleHref(title: string): string {
  const slug = title.trim().replace(/\s+/g, "_");
  const encoded = slug
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${WIKI_HOST}${encoded}`;
}

export function wikipediaSearchHref(query: string): string {
  return `${WIKI_HOST}Special:Search?search=${encodeURIComponent(query)}`;
}

export function wikipediaSearchQuery(
  event: Pick<HistoryEvent, "title" | "year" | "endYear" | "projected">,
): string {
  const span = eventSpan(event as HistoryEvent);
  const range = formatYearRange(span.start, span.end);
  return `${event.title} ${range}`.trim();
}

/** Direct article when known; otherwise English Wikipedia search. */
export function wikipediaEventHref(
  event: Pick<
    HistoryEvent,
    "title" | "year" | "endYear" | "projected" | "wikipedia" | "wikiTitle"
  >,
): string {
  const article = wikipediaArticleTitle(event);
  if (article) return wikipediaArticleHref(article);
  return wikipediaSearchHref(wikipediaSearchQuery(event));
}

export function withKnownWikipedia(
  primary: HistoryEvent,
  secondary?: HistoryEvent,
): HistoryEvent {
  if (primary.wikipedia || primary.wikiTitle || !secondary) return primary;
  if (!secondary.wikipedia && !secondary.wikiTitle) return primary;
  return {
    ...primary,
    wikipedia: secondary.wikipedia,
    wikiTitle: secondary.wikiTitle,
  };
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
