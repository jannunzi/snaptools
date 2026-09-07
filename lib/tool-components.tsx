import { ComingSoonPanel } from "@/components/tools/ComingSoonPanel";
import { MultiplicationTables } from "@/components/tools/MultiplicationTables";
import type { Tool } from "@/lib/tools";

export function ToolBody({ tool }: { tool: Tool }) {
  switch (tool.slug) {
    case "multiplication-tables":
      return <MultiplicationTables />;
    default:
      return <ComingSoonPanel tool={tool} />;
  }
}
