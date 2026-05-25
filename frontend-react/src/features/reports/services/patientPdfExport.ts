import jsPDF from "jspdf";
import type { PatientReportDataset, PatientGrowthPoint, AgeGroupStat } from "@/features/reports/types";

// ── Helpers (mirrors transactionPdfExport.ts) ────────────────────────

const number = (value: number) => new Intl.NumberFormat("en-PH").format(value);

const formatTimestamp = () =>
  new Date().toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ── Chart drawing helpers ────────────────────────────────────────────

/** Convert an SVG-style path string (M/L/Z) into the {op,c}[] format jsPDF.path() expects. */
function parseSvgPath(d: string): { op: string; c: number[] }[] {
  const cmds: { op: string; c: number[] }[] = [];
  const tokens = d.match(/[MLZmlz]|[-+]?\d*\.?\d+/g) ?? [];
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (t === "M" || t === "m") {
      cmds.push({ op: t.toLowerCase(), c: [+tokens[i + 1], +tokens[i + 2]] });
      i += 3;
    } else if (t === "L" || t === "l") {
      cmds.push({ op: t.toLowerCase(), c: [+tokens[i + 1], +tokens[i + 2]] });
      i += 3;
    } else if (t === "Z" || t === "z") {
      cmds.push({ op: "h", c: [] });
      i += 1;
    } else {
      // bare coordinate pair → implicit L
      cmds.push({ op: "l", c: [+tokens[i], +tokens[i + 1]] });
      i += 2;
    }
  }
  return cmds;
}

interface ChartRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Draws a vector area+line chart for patient growth trend data.
 * Mirrors the Net Revenue area chart in transactionPdfExport.ts.
 */
function drawAreaChart(
  doc: jsPDF,
  data: PatientGrowthPoint[],
  rect: ChartRect,
) {
  const { x, y, w, h } = rect;
  const pad = { top: 10, right: 6, bottom: 16, left: 14 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;
  const baseline = y + pad.top + chartH;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, 2, 2, "FD");

  if (data.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(130);
    doc.text("No growth trend data available.", x + w / 2, y + h / 2, { align: "center" });
    return;
  }

  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const step = chartW / (data.length - 1 || 1);

  const ySteps = 4;
  for (let i = 0; i <= ySteps; i++) {
    const val = Math.round((maxVal / ySteps) * i);
    const lineY = baseline - (chartH / ySteps) * i;
    doc.setDrawColor(220);
    doc.setLineWidth(0.1);
    doc.line(x + pad.left, lineY, x + pad.left + chartW, lineY);
    doc.setFontSize(6);
    doc.setTextColor(120);
    doc.text(number(val), x + pad.left - 1, lineY + 1.5, { align: "right" });
  }

  const pts: { px: number; py: number }[] = data.map((d, i) => ({
    px: x + pad.left + i * step,
    py: baseline - (d.count / maxVal) * chartH,
  }));

  let pathStr = `M ${pts[0].px.toFixed(1)} ${pts[0].py.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    pathStr += ` L ${pts[i].px.toFixed(1)} ${pts[i].py.toFixed(1)}`;
  }
  pathStr += ` L ${pts[pts.length - 1].px.toFixed(1)} ${baseline.toFixed(1)}`;
  pathStr += ` L ${pts[0].px.toFixed(1)} ${baseline.toFixed(1)} Z`;

  doc.path(parseSvgPath(pathStr));
  doc.setGState(doc.GState({ opacity: 0.3 }));
  doc.setFillColor(20, 184, 166);
  doc.fill();
  doc.setGState(doc.GState({ opacity: 1.0 }));

  doc.setDrawColor(20, 184, 166);
  doc.setLineWidth(0.6);
  for (let i = 0; i < pts.length - 1; i++) {
    doc.line(pts[i].px, pts[i].py, pts[i + 1].px, pts[i + 1].py);
  }

  for (let i = 0; i < pts.length; i++) {
    const isCurrentMonth = i === pts.length - 1;
    doc.setFillColor(20, 184, 166);
    doc.circle(pts[i].px, pts[i].py, isCurrentMonth ? 1.2 : 0.9, "F");
  }

  for (let i = 0; i < data.length; i++) {
    doc.setFontSize(5);
    doc.setTextColor(13, 148, 136);
    doc.text(number(data[i].count), pts[i].px, pts[i].py - 2.5, { align: "center" });
  }

  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    const [yr, mo] = d.month.split("-");
    const shortMonth = new Date(+yr, +mo - 1).toLocaleDateString("en-US", { month: "short" });
    const label = `${shortMonth} '${yr.slice(2)}`;
    doc.setFontSize(5.5);
    doc.setTextColor(100);
    doc.text(label, pts[i].px, baseline + 4, { align: "center" });
  }

  doc.setDrawColor(180);
  doc.setLineWidth(0.2);
  doc.line(x + pad.left, baseline, x + pad.left + chartW, baseline);
  doc.line(x + pad.left, y + pad.top, x + pad.left, baseline);
}

/**
 * Draws a vector donut chart using doc.path() with line-segment arc approximation.
 * Each wedge is one closed filled polygon: outer arc → line to inner → inner arc back → close.
 */
function drawPieChart(
  doc: jsPDF,
  entries: { label: string; count: number; color: [number, number, number] }[],
  rect: ChartRect,
): number {
  const { x, y, w, h } = rect;
  const total = entries.reduce((sum, e) => sum + e.count, 0);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, 2, 2, "FD");

  if (total === 0 || entries.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(130);
    doc.text("No data available.", x + w / 2, y + h / 2, { align: "center" });
    return h;
  }

  const activeEntries = entries.filter((e) => e.count > 0);
  const legendRows = Math.ceil(activeEntries.length / 2);
  const legendH = legendRows * 6 + 2;
  const donutH = h - legendH;

  const cx = x + w / 2;
  const cy = y + donutH * 0.48;
  const outerR = Math.min(w, donutH * 0.95) / 2;
  const innerR = outerR * 0.42;

  let angleDeg = -90;
  for (const entry of activeEntries) {
    const sweep = (entry.count / total) * 360;
    const segCount = Math.max(6, Math.round(sweep / 5));

    doc.setFillColor(entry.color[0], entry.color[1], entry.color[2]);
    doc.setDrawColor(entry.color[0], entry.color[1], entry.color[2]);

    // Build path string (exact same pattern as Transaction area chart)
    const startA = angleDeg;
    const startRad = (startA * Math.PI) / 180;
    let pathStr = `M ${(cx + outerR * Math.cos(startRad)).toFixed(1)} ${(cy + outerR * Math.sin(startRad)).toFixed(1)}`;

    // Outer arc
    for (let s = 1; s <= segCount; s++) {
      const a = startA + (s / segCount) * sweep;
      const rad = (a * Math.PI) / 180;
      pathStr += ` L ${(cx + outerR * Math.cos(rad)).toFixed(1)} ${(cy + outerR * Math.sin(rad)).toFixed(1)}`;
    }

    // Line to inner arc end, then inner arc back
    const endA = startA + sweep;
    const endRad = (endA * Math.PI) / 180;
    pathStr += ` L ${(cx + innerR * Math.cos(endRad)).toFixed(1)} ${(cy + innerR * Math.sin(endRad)).toFixed(1)}`;

    for (let s = segCount - 1; s >= 0; s--) {
      const a = startA + (s / segCount) * sweep;
      const rad = (a * Math.PI) / 180;
      pathStr += ` L ${(cx + innerR * Math.cos(rad)).toFixed(1)} ${(cy + innerR * Math.sin(rad)).toFixed(1)}`;
    }

    pathStr += " Z";

    doc.path(parseSvgPath(pathStr));
    doc.setFillColor(entry.color[0], entry.color[1], entry.color[2]);
    doc.fill();

    // Percentage label
    if (sweep > 15) {
      const midAngle = angleDeg + sweep / 2;
      const midRad = (midAngle * Math.PI) / 180;
      const labelR = innerR + (outerR - innerR) * 0.6;
      const lx = cx + labelR * Math.cos(midRad);
      const ly = cy + labelR * Math.sin(midRad);
      doc.setFontSize(5.5);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(`${((entry.count / total) * 100).toFixed(0)}%`, lx, ly + 0.5, { align: "center" });
    }

    angleDeg += sweep;
  }

  // Center hole
  doc.setFillColor(255, 255, 255);
  doc.circle(cx, cy, innerR, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.circle(cx, cy, outerR, "S");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.circle(cx, cy, innerR, "S");

  // Legend
  const legendY = y + donutH + 2;
  const legendItemW = w / 2;

  for (let i = 0; i < activeEntries.length; i++) {
    const entry = activeEntries[i];
    const col = i % 2;
    const row = Math.floor(i / 2);
    const lx = x + col * legendItemW;
    const ly = legendY + row * 5;
    const pct = total > 0 ? ((entry.count / total) * 100).toFixed(1) : "0";

    doc.setFillColor(entry.color[0], entry.color[1], entry.color[2]);
    doc.rect(lx + 2, ly - 2, 3.5, 3.5, "F");
    doc.setFontSize(6);
    doc.setTextColor(60);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${entry.label} — ${number(entry.count)} (${pct}%)`,
      lx + 7,
      ly + 0.5,
    );
  }

  return h;
}

/**
 * Draws a horizontal bar chart matching the on-screen Recharts AgeGroupChart.
 * - Entries sorted by count descending
 * - Dashed vertical grid lines
 * - Rounded right-side bar ends
 * - Numeric X-axis at bottom
 * - Per-row coloring via AGE_GROUP_COLORS
 */
function drawHorizontalBarChart(
  doc: jsPDF,
  entries: { label: string; count: number; color: [number, number, number] }[],
  rect: ChartRect,
): number {
  const { x, y, w, h } = rect;
  const pad = { top: 4, right: 10, bottom: 14, left: 4 };
  const chartH = h - pad.top - pad.bottom;

  // Background card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, 2, 2, "FD");

  if (entries.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(130);
    doc.text("No data available.", x + w / 2, y + h / 2, { align: "center" });
    return h;
  }

  const maxVal = Math.max(...entries.map((e) => e.count), 1);
  const rowCount = entries.length;
  const rowH = chartH / rowCount;

  // Measure label widths to set a dynamic left margin
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  let labelColW = 0;
  for (const entry of entries) {
    const tw = doc.getTextWidth(entry.label);
    if (tw > labelColW) labelColW = tw;
  }
  labelColW = Math.min(labelColW + 3, w * 0.35); // cap at 35% of chart width

  const barOriginX = x + pad.left + labelColW;
  const barMaxWidth = w - pad.left - pad.right - labelColW;
  const barHeight = Math.min(rowH * 0.5, 5);
  const barRadius = 1.5; // rounded right-side radius
  const baseline = y + pad.top + chartH; // bottom of chart area

  // ── Dashed vertical grid lines (mirrors CartesianGrid horizontal={false}) ──
  const xSteps = 4;
  doc.setDrawColor(180);
  doc.setLineWidth(0.1);
  for (let i = 1; i <= xSteps; i++) {
    const gx = barOriginX + (barMaxWidth / xSteps) * i;
    // Dashed line: segments of 1.5mm with 1mm gap
    let segY = y + pad.top;
    while (segY < baseline) {
      const segEnd = Math.min(segY + 1.5, baseline);
      doc.line(gx, segY, gx, segEnd);
      segY = segEnd + 1;
    }
  }

  // ── Bars + labels ──
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const barW = Math.max(0, (entry.count / maxVal) * barMaxWidth);
    const rowY = y + pad.top + i * rowH + rowH / 2;
    const barY = rowY - barHeight / 2;

    // Category label (left side)
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(entry.label, barOriginX - 2, rowY + 1.2, {
      align: "right",
      maxWidth: labelColW - 2,
    });

    // Rounded bar (right side rounded, left side flat)
    if (barW > 0) {
      doc.setFillColor(entry.color[0], entry.color[1], entry.color[2]);
      const r = Math.min(barRadius, barW / 2, barHeight / 2);
      if (barW > r * 2) {
        // Flat left + rounded right
        doc.rect(barOriginX, barY, barW - r, barHeight, "F");
        doc.roundedRect(barOriginX + barW - r * 2, barY, r * 2, barHeight, r, r, "F");
      } else {
        doc.roundedRect(barOriginX, barY, barW, barHeight, r, r, "F");
      }
    }

    // Count label (right of bar)
    doc.setFontSize(6.5);
    doc.setTextColor(entry.color[0], entry.color[1], entry.color[2]);
    doc.setFont("helvetica", "bold");
    doc.text(number(entry.count), barOriginX + barW + 1.5, rowY + 1.2, { align: "left" });
  }

  // ── X-axis tick labels (bottom) ──
  doc.setFontSize(6);
  doc.setTextColor(120);
  doc.setFont("helvetica", "normal");
  for (let i = 0; i <= xSteps; i++) {
    const val = Math.round((maxVal / xSteps) * i);
    const tx = barOriginX + (barMaxWidth / xSteps) * i;
    doc.text(number(val), tx, baseline + 4, { align: "center" });
  }

  return h;
}

// ── Color palettes (mirror screen components) ────────────────────────

const SEX_COLORS: Record<string, [number, number, number]> = {
  Male: [59, 130, 246],
  Female: [236, 72, 153],
};

const AGE_GROUP_COLORS: [number, number, number][] = [
  [59, 130, 246],
  [6, 182, 212],
  [16, 185, 129],
  [245, 158, 11],
  [239, 68, 68],
  [139, 92, 246],
  [236, 72, 153],
  [20, 184, 166],
  [249, 115, 22],
  [99, 102, 241],
];

// ── Main export (mirrors generateTransactionPdf) ─────────────────────

function generatePatientPdf(
  report: PatientReportDataset,
  growthTrend: PatientGrowthPoint[],
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let cursorY = margin + 2;

  // ═══════════════════════════════════════════════════════════
  // 1. Document Header
  // ═══════════════════════════════════════════════════════════
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.text("MM Torres Optical Clinic", pageW / 2, cursorY, { align: "center" });
  cursorY += 6;

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Patient Analytics Summary", pageW / 2, cursorY, { align: "center" });
  cursorY += 4.5;

  doc.setFontSize(8);
  doc.setTextColor(130);
  doc.text(
    `Generated: ${formatTimestamp()} by ${report.metadata.generatedBy}`,
    pageW / 2,
    cursorY,
    { align: "center" },
  );
  cursorY += 12;

  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(margin, cursorY, pageW - margin, cursorY);
  cursorY += 8;

  // ═══════════════════════════════════════════════════════════
  // 2. Patient Growth Trend — Area Chart (full width)
  // ═══════════════════════════════════════════════════════════
  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.setFont("helvetica", "bold");
  doc.text("12-Month Patient Growth Trend", margin, cursorY);
  cursorY += 5;

  const chartW = pageW - margin * 2;
  const growthChartH = 62;

  const growthRect: ChartRect = { x: margin, y: cursorY, w: chartW, h: growthChartH };
  drawAreaChart(doc, growthTrend, growthRect);
  cursorY = growthRect.y + growthRect.h + 12;

  // ═══════════════════════════════════════════════════════════
  // 3. Demographic Distributions — Dual-Column Split Row
  // ═══════════════════════════════════════════════════════════

  const pageH = doc.internal.pageSize.getHeight();
  const demoTargetH = 75;
  if (cursorY + demoTargetH > pageH - margin) {
    doc.addPage();
    cursorY = margin + 2;
  }

  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.setFont("helvetica", "bold");
  doc.text("Demographic Breakdown", margin, cursorY);
  cursorY += 5;

  const colGap = 6;
  const halfW = (chartW - colGap) / 2;
  const leftX = margin;
  const rightX = margin + halfW + colGap;

  // 3a. Sex Distribution (left column) — Donut Chart
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.setFont("helvetica", "bold");
  doc.text("Sex Distribution", leftX, cursorY);
  doc.text("Age Group Distribution", rightX, cursorY);
  cursorY += 3;

  const sexPieH = 50;
  const sexEntries: { label: string; count: number; color: [number, number, number] }[] = [
    { label: "Male", count: report.maleCount, color: SEX_COLORS.Male },
    { label: "Female", count: report.femaleCount, color: SEX_COLORS.Female },
  ];

  const sexRect: ChartRect = { x: leftX, y: cursorY, w: halfW, h: sexPieH };
  drawPieChart(doc, sexEntries, sexRect);

  // 3b. Age Group Distribution (right column) — Horizontal Bar Chart
  // Sort descending by count to match the on-screen chart
  const sortedAgeGroups = [...report.ageGroupDistribution].sort((a, b) => b.count - a.count);
  const ageEntries: { label: string; count: number; color: [number, number, number] }[] =
    sortedAgeGroups.map((ag: AgeGroupStat, i: number) => ({
      label: ag.groupLabel,
      count: ag.count,
      color: AGE_GROUP_COLORS[i % AGE_GROUP_COLORS.length],
    }));

  // Height: ~7mm per row + padding, matching the UI's spacious layout
  const ageBarH = Math.max(sexPieH, ageEntries.length * 7 + 18);
  const ageRect: ChartRect = { x: rightX, y: cursorY, w: halfW, h: ageBarH };
  drawHorizontalBarChart(doc, ageEntries, ageRect);

  // Save
  doc.save("patient_report.pdf");
}

export { generatePatientPdf };
