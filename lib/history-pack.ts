import {
  eventBarMetrics,
  type HistoryEvent,
} from "@/lib/history-timeline";

const PACK_GAP = 8;

export type PackedEvent = {
  event: HistoryEvent;
  x: number;
  width: number;
  wide: boolean;
  row: number;
};

function intervalsOverlap(
  ax: number,
  aw: number,
  bx: number,
  bw: number,
  gap = PACK_GAP,
) {
  return ax < bx + bw + gap && bx < ax + aw + gap;
}

function rowFits(
  occupants: Array<{ x: number; width: number }>,
  x: number,
  width: number,
) {
  return occupants.every((item) => !intervalsOverlap(x, width, item.x, item.width));
}

/**
 * Assign sub-rows from the full lane set, then keep each event id’s row
 * across pan/zoom unless the budget changes or the sticky row is truly full.
 */
export function packEventsStable(
  events: HistoryEvent[],
  pixelsPerYear: number,
  minWidth: number,
  maxRows: number,
  sticky: Map<string, number>,
): PackedEvent[] {
  const rows = Math.max(1, maxRows);
  const items = events
    .map((event) => ({
      event,
      ...eventBarMetrics(event, pixelsPerYear, minWidth),
    }))
    .sort(
      (a, b) =>
        a.event.year - b.event.year || a.event.title.localeCompare(b.event.title),
    );

  for (const [id, row] of sticky) {
    if (row < 0 || row >= rows) sticky.delete(id);
  }

  const occupants: Array<Array<{ x: number; width: number }>> = Array.from(
    { length: rows },
    () => [],
  );
  const placed = new Map<string, PackedEvent>();
  const leftover: typeof items = [];

  for (const item of items) {
    const preferred = sticky.get(item.event.id);
    if (
      preferred !== undefined &&
      preferred >= 0 &&
      preferred < rows &&
      rowFits(occupants[preferred] ?? [], item.x, item.width)
    ) {
      occupants[preferred]?.push({ x: item.x, width: item.width });
      const packed = { ...item, row: preferred };
      placed.set(item.event.id, packed);
      continue;
    }
    leftover.push(item);
  }

  for (const item of leftover) {
    let row = occupants.findIndex((slot) => rowFits(slot, item.x, item.width));
    if (row === -1) row = rows - 1;
    occupants[row]?.push({ x: item.x, width: item.width });
    const packed = { ...item, row };
    placed.set(item.event.id, packed);
    sticky.set(item.event.id, row);
  }

  for (const packed of placed.values()) {
    sticky.set(packed.event.id, packed.row);
  }

  return items
    .map((item) => placed.get(item.event.id))
    .filter((item): item is PackedEvent => Boolean(item));
}
