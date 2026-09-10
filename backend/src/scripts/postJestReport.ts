import fs from "fs";
import path from "path";

type CoverageMetric = {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
};

type CoverageSummary = {
  total: {
    statements: CoverageMetric;
    branches: CoverageMetric;
    functions: CoverageMetric;
    lines: CoverageMetric;
  };
  [filePath: string]: {
    statements: CoverageMetric;
    branches: CoverageMetric;
    functions: CoverageMetric;
    lines: CoverageMetric;
  };
};

type CoverageRecord = {
  path: string;
  statements: CoverageMetric;
  branches: CoverageMetric;
  functions: CoverageMetric;
  lines: CoverageMetric;
  uncoveredLines: string;
};

type AggregatedRecord = {
  name: string;
  statementsTotal: number;
  statementsCovered: number;
  branchesTotal: number;
  branchesCovered: number;
  functionsTotal: number;
  functionsCovered: number;
  linesTotal: number;
  linesCovered: number;
};

function getStatusClass(pct: number): string {
  if (pct >= 80) return "coverage-good";
  if (pct >= 50) return "coverage-warn";
  return "coverage-bad";
}

function renderMetricRow(label: string, metric: CoverageMetric): string {
  return `
    <tr>
      <td>${label}</td>
      <td>${metric.total}</td>
      <td>${metric.covered}</td>
      <td>${metric.skipped}</td>
      <td class="${getStatusClass(metric.pct)}">${metric.pct.toFixed(2)}%</td>
    </tr>`;
}

function renderCoverageSection(summary: CoverageSummary): string {
  const rows = [
    renderMetricRow("Statements", summary.total.statements),
    renderMetricRow("Branches", summary.total.branches),
    renderMetricRow("Functions", summary.total.functions),
    renderMetricRow("Lines", summary.total.lines),
  ].join("\n");

  return `
<!-- coverage-summary:start -->
<section id="coverage-summary-panel">
  <h2>Coverage Summary</h2>
  <table id="coverage-summary-table" aria-label="Coverage summary table">
    <thead>
      <tr>
        <th>Metric</th>
        <th>Total</th>
        <th>Covered</th>
        <th>Skipped</th>
        <th>Coverage</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</section>
<!-- coverage-summary:end -->`;
}

function normalizeForCoverage(filePath: string): string {
  return filePath.replaceAll("\\", "/").replace(/^\.?\//, "");
}

function extractSrcRelativePath(filePath: string): string {
  const normalized = normalizeForCoverage(filePath);
  const srcIndex = normalized.toLowerCase().lastIndexOf("/src/");
  if (srcIndex >= 0) {
    return normalized.slice(srcIndex + 5);
  }

  const relative = normalizeForCoverage(path.relative(process.cwd(), filePath));
  if (relative.startsWith("backend/src/")) {
    return relative.replace("backend/src/", "");
  }
  if (relative.startsWith("src/")) {
    return relative.replace("src/", "");
  }
  return relative;
}

function formatPct(pct: number): string {
  if (Number.isNaN(pct)) {
    return "0";
  }
  return Number(pct.toFixed(2)).toString();
}

function pct(covered: number, total: number): number {
  if (total === 0) {
    return 100;
  }
  return (covered / total) * 100;
}

function parseLcovUncoveredLineMap(lcovRaw: string): Map<string, string> {
  const map = new Map<string, string>();
  const records = lcovRaw.split("end_of_record");

  for (const record of records) {
    const lines = record.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) {
      continue;
    }

    const sf = lines.find((line) => line.startsWith("SF:"));
    if (!sf) {
      continue;
    }

    const sfPath = sf.slice(3);
    const normalizedPath = normalizeForCoverage(sfPath);

    const uncovered = lines
      .filter((line) => line.startsWith("DA:"))
      .map((line) => line.slice(3).split(","))
      .filter((parts) => parts.length >= 2)
      .filter((parts) => Number(parts[1]) === 0)
      .map((parts) => Number(parts[0]))
      .filter((lineNo) => Number.isFinite(lineNo))
      .sort((a, b) => a - b);

    if (uncovered.length === 0) {
      map.set(normalizedPath, "");
      continue;
    }

    const ranges: string[] = [];
    let start = uncovered[0];
    let prev = uncovered[0];

    for (let i = 1; i < uncovered.length; i += 1) {
      const current = uncovered[i];
      if (current === prev + 1) {
        prev = current;
        continue;
      }

      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = current;
      prev = current;
    }

    ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
    map.set(normalizedPath, ranges.join(","));
  }

  return map;
}

function collectCoverageRecords(
  summary: CoverageSummary,
  uncoveredByFile: Map<string, string>,
): CoverageRecord[] {
  return Object.entries(summary)
    .filter(([key]) => key !== "total")
    .map(([filePath, metrics]) => {
      const srcRelativePath = extractSrcRelativePath(filePath);
      const lcovPath = normalizeForCoverage(`src/${srcRelativePath}`);

      return {
        path: srcRelativePath,
        statements: metrics.statements,
        branches: metrics.branches,
        functions: metrics.functions,
        lines: metrics.lines,
        uncoveredLines: uncoveredByFile.get(lcovPath) ?? "",
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

function aggregateByTopFolder(records: CoverageRecord[]): AggregatedRecord[] {
  const map = new Map<string, AggregatedRecord>();

  for (const record of records) {
    const [folder] = record.path.split("/");
    if (!map.has(folder)) {
      map.set(folder, {
        name: folder,
        statementsTotal: 0,
        statementsCovered: 0,
        branchesTotal: 0,
        branchesCovered: 0,
        functionsTotal: 0,
        functionsCovered: 0,
        linesTotal: 0,
        linesCovered: 0,
      });
    }

    const current = map.get(folder)!;
    current.statementsTotal += record.statements.total;
    current.statementsCovered += record.statements.covered;
    current.branchesTotal += record.branches.total;
    current.branchesCovered += record.branches.covered;
    current.functionsTotal += record.functions.total;
    current.functionsCovered += record.functions.covered;
    current.linesTotal += record.lines.total;
    current.linesCovered += record.lines.covered;
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function renderDetailedCoverageSection(summary: CoverageSummary, records: CoverageRecord[]): string {
  const folderRows = aggregateByTopFolder(records)
    .map((folder) => `
      <tr class="coverage-folder-row">
        <td>${folder.name}</td>
        <td class="${getStatusClass(pct(folder.statementsCovered, folder.statementsTotal))}">${formatPct(pct(folder.statementsCovered, folder.statementsTotal))}</td>
        <td class="${getStatusClass(pct(folder.branchesCovered, folder.branchesTotal))}">${formatPct(pct(folder.branchesCovered, folder.branchesTotal))}</td>
        <td class="${getStatusClass(pct(folder.functionsCovered, folder.functionsTotal))}">${formatPct(pct(folder.functionsCovered, folder.functionsTotal))}</td>
        <td class="${getStatusClass(pct(folder.linesCovered, folder.linesTotal))}">${formatPct(pct(folder.linesCovered, folder.linesTotal))}</td>
        <td></td>
      </tr>
      ${records
        .filter((record) => record.path.startsWith(`${folder.name}/`))
        .map((record) => `
          <tr class="coverage-file-row">
            <td>${record.path.split("/").slice(1).join("/")}</td>
            <td class="${getStatusClass(record.statements.pct)}">${formatPct(record.statements.pct)}</td>
            <td class="${getStatusClass(record.branches.pct)}">${formatPct(record.branches.pct)}</td>
            <td class="${getStatusClass(record.functions.pct)}">${formatPct(record.functions.pct)}</td>
            <td class="${getStatusClass(record.lines.pct)}">${formatPct(record.lines.pct)}</td>
            <td>${record.uncoveredLines}</td>
          </tr>`)
        .join("")}`)
    .join("");

  const total = summary.total;
  const allFilesRow = `
    <tr class="coverage-total-row">
      <td>All files</td>
      <td class="${getStatusClass(total.statements.pct)}">${formatPct(total.statements.pct)}</td>
      <td class="${getStatusClass(total.branches.pct)}">${formatPct(total.branches.pct)}</td>
      <td class="${getStatusClass(total.functions.pct)}">${formatPct(total.functions.pct)}</td>
      <td class="${getStatusClass(total.lines.pct)}">${formatPct(total.lines.pct)}</td>
      <td></td>
    </tr>`;

  return `
<!-- coverage-details:start -->
<section id="coverage-details-panel">
  <h2>Coverage Details</h2>
  <table id="coverage-details-table" aria-label="Coverage details table">
    <thead>
      <tr>
        <th>File</th>
        <th>% Stmts</th>
        <th>% Branch</th>
        <th>% Funcs</th>
        <th>% Lines</th>
        <th>Uncovered Line #s</th>
      </tr>
    </thead>
    <tbody>
      ${allFilesRow}
      ${folderRows}
    </tbody>
  </table>
</section>
<!-- coverage-details:end -->`;
}

function main(): void {
  const reportPath = path.resolve(process.cwd(), "coverage", "jest-report.html");
  const summaryPath = path.resolve(
    process.cwd(),
    "coverage",
    "coverage-summary.json",
  );
  const lcovPath = path.resolve(process.cwd(), "coverage", "lcov.info");
  const themePath = path.resolve(process.cwd(), "src", "theme", "jest-report.css");

  if (!fs.existsSync(reportPath)) {
    console.warn("[postJestReport] Report not found, skipping.");
    return;
  }

  if (!fs.existsSync(summaryPath)) {
    console.warn("[postJestReport] Coverage summary not found, skipping.");
    return;
  }

  if (!fs.existsSync(lcovPath)) {
    console.warn("[postJestReport] lcov.info not found, skipping details section.");
  }

  const reportHtml = fs.readFileSync(reportPath, "utf8");
  const summary = JSON.parse(
    fs.readFileSync(summaryPath, "utf8"),
  ) as CoverageSummary;
  const lcovRaw = fs.existsSync(lcovPath) ? fs.readFileSync(lcovPath, "utf8") : "";
  const themeCss = fs.existsSync(themePath) ? fs.readFileSync(themePath, "utf8") : "";
  const uncoveredByFile = parseLcovUncoveredLineMap(lcovRaw);
  const detailedRecords = collectCoverageRecords(summary, uncoveredByFile);

  const section = renderCoverageSection(summary);
  const detailsSection = renderDetailedCoverageSection(summary, detailedRecords);

  const cleanedSummary = reportHtml.replace(
    /<!-- coverage-summary:start -->[\s\S]*?<!-- coverage-summary:end -->/g,
    "",
  );
  const cleaned = cleanedSummary.replace(
    /<!-- coverage-details:start -->[\s\S]*?<!-- coverage-details:end -->/g,
    "",
  );
  const cleanedWithNoThemeBlock = cleaned.replace(
    /<style id="edcomet-theme-overrides">[\s\S]*?<\/style>/g,
    "",
  );

  const anchor = '<div id="summary">';
  if (!cleanedWithNoThemeBlock.includes(anchor)) {
    console.warn("[postJestReport] Summary anchor not found, skipping.");
    return;
  }

  const withCoverage = cleanedWithNoThemeBlock.replace(
    anchor,
    `${section}\n${detailsSection}\n${anchor}`,
  );

  const withTheme = themeCss.trim().length > 0
    ? withCoverage.replace(
      "</head>",
      `<style id="edcomet-theme-overrides">\n${themeCss}\n</style></head>`,
    )
    : withCoverage;

  fs.writeFileSync(reportPath, withTheme, "utf8");
  console.log("[postJestReport] Coverage summary and details injected into jest-report.html");
}

main();
