import {
  exportCurriculumSnapshot,
  formatCurriculumGapReport,
} from "../lib/curriculum";

const json = process.argv.includes("--json");

if (json) {
  process.stdout.write(`${JSON.stringify(exportCurriculumSnapshot(), null, 2)}\n`);
} else {
  process.stdout.write(`${formatCurriculumGapReport()}\n`);
}
