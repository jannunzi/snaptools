import { AdditionSubtractionFacts } from "@/components/tools/AdditionSubtractionFacts";
import { CivicsQuiz } from "@/components/tools/CivicsQuiz";
import { HistoryTimeline } from "@/components/tools/HistoryTimeline";
import { ComingSoonPanel } from "@/components/tools/ComingSoonPanel";
import { CountingMoney } from "@/components/tools/CountingMoney";
import { DivisionFacts } from "@/components/tools/DivisionFacts";
import { FractionsPractice } from "@/components/tools/FractionsPractice";
import { MultiplicationTables } from "@/components/tools/MultiplicationTables";
import { MusicNoteRecognition } from "@/components/tools/MusicNoteRecognition";
import { PrintableColoring } from "@/components/tools/PrintableColoring";
import { SightWords } from "@/components/tools/SightWords";
import { SpellingPractice } from "@/components/tools/SpellingPractice";
import { StatesAndCapitals } from "@/components/tools/StatesAndCapitals";
import { TellingTime } from "@/components/tools/TellingTime";
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
    case "division-facts":
      return <DivisionFacts />;
    case "telling-time":
      return <TellingTime />;
    case "counting-money":
      return <CountingMoney />;
    case "addition-subtraction-facts":
      return <AdditionSubtractionFacts />;
    case "history-timeline":
      return <HistoryTimeline />;
    case "states-and-capitals":
      return <StatesAndCapitals />;
    case "fractions-practice":
      return <FractionsPractice />;
    case "sight-words":
      return <SightWords />;
    default:
      return <ComingSoonPanel tool={tool} />;
  }
}
