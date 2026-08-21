import {
  formatEvaluationReport,
  runNextzenEvaluation,
} from "@/lib/evaluation/nextzen-evaluation";

const summary = runNextzenEvaluation();

console.log(formatEvaluationReport(summary));

if (!summary.passed) {
  process.exitCode = 1;
}
