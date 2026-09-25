import fs from "fs";
import path from "path";

const minimumCoverage = 90;
const metrics = ["statements", "branches", "functions", "lines"] as const;

type Metric = {
  pct: number;
};

type FileCoverage = Record<(typeof metrics)[number], Metric>;
type CoverageSummary = Record<string, FileCoverage>;

function main(): void {
  const summaryPath = path.resolve(process.cwd(), "coverage", "coverage-summary.json");
  if (!fs.existsSync(summaryPath)) {
    throw new Error(`Coverage summary not found: ${summaryPath}`);
  }

  const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8")) as CoverageSummary;
  const failures = Object.entries(summary)
    .filter(([filePath]) => filePath !== "total")
    .flatMap(([filePath, coverage]) =>
      metrics
        .filter((metric) => coverage[metric].pct < minimumCoverage)
        .map(
          (metric) =>
            `${path.relative(process.cwd(), filePath)}: ${metric} ${coverage[metric].pct}%`,
        ),
    );

  if (failures.length > 0) {
    throw new Error(
      `Per-file coverage must be at least ${minimumCoverage}% for every metric:\n${failures.join("\n")}`,
    );
  }

  console.log(`All covered files meet the ${minimumCoverage}% minimum for every metric.`);
}

main();