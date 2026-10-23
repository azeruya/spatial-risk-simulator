import type {
  PlanningAssessment,
  SimulationView,
} from "@/types/simulation";
import type { SimulationResult } from "@/lib/simulation";
import { formatHazardStatus } from "./hazardLabels";

type ReportInput = {
  assessment: PlanningAssessment;
  simulation: SimulationResult;
  simulationView: SimulationView;
  projectAreaHa: number;
  radiusMeters: number;
  nearbyPopulation: number | null;
  additionalPopulation: number;
  elevationM: number | null;
  hasMitigation: boolean;
  runoffFormula?: string;
};

const cell = (value: string | undefined) =>
  (value ?? "–").replace(/\|/g, "\\|");

function pct(from: number, to: number) {
  if (from === 0) return "–";
  const change = ((to - from) / from) * 100;
  if (Math.abs(change) < 0.5) return "No change";
  return `${change > 0 ? "+" : "-"}${Math.abs(Math.round(change))}%`;
}

const STATUS_LABEL = {
  low: "Lower concern",
  attention: "Attention",
  review: "Review",
} as const;

const GROUPS = [
  { key: "before-build", title: "Before you build" },
  { key: "design", title: "In the design" },
  { key: "expert-review", title: "Check with experts" },
] as const;

export function buildReportMarkdown(input: ReportInput) {
  const { assessment, simulation } = input;
  const areaM2 = Math.round(input.projectAreaHa * 10_000);
  const lines: string[] = [];

  lines.push("# SIVORA site assessment", "");
  lines.push(
    `Date: ${new Date().toISOString().slice(0, 10)}  `,
    `Site area: ${areaM2.toLocaleString()} m²  `,
    `Scenario on screen: ${input.simulationView}`,
    ""
  );

  lines.push("## Verdict", "");
  lines.push(
    `**${STATUS_LABEL[assessment.status]}.** ${assessment.verdict.headline}`,
    "",
    assessment.verdict.action,
    ""
  );

  lines.push("## About the site", "", "Same in every scenario.", "");

  for (const [hazard, status] of Object.entries(assessment.site)) {
    if (!status) continue;
    lines.push(
      `- ${hazard.charAt(0).toUpperCase()}${hazard.slice(1)}: ${formatHazardStatus(status)}`
    );
  }

  lines.push(
    `- Ground height: ${
      input.elevationM !== null
        ? `about ${Math.round(input.elevationM)} m (approximate)`
        : "unavailable"
    }`,
    `- People within ${input.radiusMeters} m: ${
      input.nearbyPopulation !== null
        ? Math.round(input.nearbyPopulation).toLocaleString()
        : "unavailable"
    }${
      input.additionalPopulation > 0
        ? ` (+${input.additionalPopulation.toLocaleString()} from the proposal)`
        : ""
    }`,
    ""
  );

  lines.push("## About your design", "");
  lines.push("| Scenario | Runoff index | Change vs today |", "|---|---|---|");
  lines.push(`| Current | ${simulation.baselineRunoffPressure.toFixed(2)} | – |`);
  lines.push(
    `| Proposed | ${simulation.scenarioRunoffPressure.toFixed(2)} | ${pct(
      simulation.baselineRunoffPressure,
      simulation.scenarioRunoffPressure
    )} |`
  );

  if (input.hasMitigation) {
    lines.push(
      `| Mitigated | ${simulation.mitigatedRunoffPressure.toFixed(2)} | ${pct(
        simulation.baselineRunoffPressure,
        simulation.mitigatedRunoffPressure
      )} (${pct(
        simulation.scenarioRunoffPressure,
        simulation.mitigatedRunoffPressure
      )} vs proposed) |`
    );
  }

  lines.push("", "## What this means", "");
  for (const finding of assessment.findings) {
    lines.push(`- [${finding.scope}] **${finding.headline}.** ${finding.detail}`);
  }

  lines.push("", "## Recommendations", "");
  for (const group of GROUPS) {
    const items = assessment.recommendations.filter(
      (item) => item.group === group.key
    );
    if (items.length === 0) continue;

    lines.push(`### ${group.title}`, "");
    for (const item of items) {
      lines.push(`- ${item.text}${item.priority === "high" ? " (priority)" : ""}`);
    }
    lines.push("");
  }

  const scenarioRows = assessment.analysisRows.filter(
    (row) => row.current || row.proposed || row.mitigated
  );
  const siteRows = assessment.analysisRows.filter(
    (row) => !(row.current || row.proposed || row.mitigated)
  );

  lines.push("## Analysis", "");

  if (scenarioRows.length > 0) {
    lines.push("| Item | Current | Proposed | Mitigated |", "|---|---|---|---|");
    for (const row of scenarioRows) {
      lines.push(
        `| ${cell(row.label)} | ${cell(row.current)} | ${cell(row.proposed)} | ${cell(row.mitigated)} |`
      );
    }
    lines.push("");
  }

  for (const row of siteRows) {
    lines.push(`- ${row.label}: ${row.value ?? "–"}`);
  }

  lines.push("", "## Data", "");
  for (const source of assessment.dataSources) {
    lines.push(
      `- ${source.source}: ${source.measures}${source.coverage ? `. ${source.coverage}` : ""}`
    );
  }

  lines.push("", "## Method and limits", "");
  if (input.runoffFormula) {
    lines.push("```", input.runoffFormula, "```", "");
  }
  for (const limitation of assessment.limitations) {
    lines.push(`- ${limitation}`);
  }

  lines.push(
    "",
    "_Screening-level planning indicators. Not a substitute for AMDAL or an engineering study._",
    ""
  );

  return lines.join("\n");
}

export function downloadTextFile(
  filename: string,
  text: string,
  mime = "text/markdown;charset=utf-8"
) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}