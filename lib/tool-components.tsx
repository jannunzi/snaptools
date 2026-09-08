import { CivicsQuiz } from "@/components/tools/CivicsQuiz";
import { ComingSoonPanel } from "@/components/tools/ComingSoonPanel";
import { MultiplicationTables } from "@/components/tools/MultiplicationTables";
import { MusicNoteRecognition } from "@/components/tools/MusicNoteRecognition";
import { PrintableColoring } from "@/components/tools/PrintableColoring";
import { SpellingPractice } from "@/components/tools/SpellingPractice";
import type { Tool } from "@/lib/tools";

export function ToolBody({ tool }: { tool: Tool }) {
  switch (tool.slug) {
    case "multiplication-tables":
      return <MultiplicationTables />;
    case "music-note-recognition":
      return <MusicNoteRecognition />;
    case "spelling-practice":
      return <SpellingPractice />;
    case "printable-coloring":
      return <PrintableColoring />;
    case "civics-quiz":
      return <CivicsQuiz />;
    default:
      return <ComingSoonPanel tool={tool} />;
  }
}
