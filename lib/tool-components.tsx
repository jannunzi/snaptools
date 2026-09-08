import { ComingSoonPanel } from "@/components/tools/ComingSoonPanel";
import { MultiplicationTables } from "@/components/tools/MultiplicationTables";
import { MusicNoteRecognition } from "@/components/tools/MusicNoteRecognition";
import type { Tool } from "@/lib/tools";

export function ToolBody({ tool }: { tool: Tool }) {
  switch (tool.slug) {
    case "multiplication-tables":
      return <MultiplicationTables />;
    case "music-note-recognition":
      return <MusicNoteRecognition />;
    default:
      return <ComingSoonPanel tool={tool} />;
  }
}
