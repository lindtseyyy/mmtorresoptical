import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  TransactionHierarchicalReportDataset,
  TransactionEntry,
  TransactionMonthlyTrendPoint,
} from "@/features/reports/types";
import type { AgingReceivable } from "@/features/sales/services/transactionApi";

// ── Currency / date helpers ──────────────────────────────────────────

const currency = (value: number): string => {
  const abs = Math.abs(value);
  const [int_, dec] = abs.toFixed(2).split(".");
  return `PHP ${int_.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${dec}`;
};

const number = (value: number) => new Intl.NumberFormat("en-PH").format(value);

const formatDate = (raw: string) => {
  const [y, m, d] = raw.split("-");
  return new Date(+y, +m - 1, +d).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTimestamp = () =>
  new Date().toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ── Aggregation (mirrors AggregatedFinancialSummary.tsx) ─────────────

interface StatusAggregate {
  count: number;
  totalValue: number;
}

function aggregate(
  statusGroups: Record<string, TransactionEntry[]>,
  key: string,
): StatusAggregate {
  const entries = statusGroups[key];
  if (!entries || entries.length === 0) return { count: 0, totalValue: 0 };
  return {
    count: entries.length,
    totalValue: entries.reduce((sum, e) => sum + e.totalAmount, 0),
  };
}

function paidAggregate(
  statusGroups: Record<string, TransactionEntry[]>,
  key: string,
): StatusAggregate {
  const entries = statusGroups[key];
  if (!entries || entries.length === 0) return { count: 0, totalValue: 0 };
  return {
    count: entries.length,
    totalValue: entries.reduce((sum, e) => sum + e.amountPaid, 0),
  };
}

function refundDeductionAggregate(
  statusGroups: Record<string, TransactionEntry[]>,
): StatusAggregate {
  let count = 0;
  let totalValue = 0;
  for (const entries of Object.values(statusGroups)) {
    for (const e of entries) {
      if (e.refundStatus === "PARTIAL" || e.refundStatus === "FULL") {
        count++;
        totalValue += e.items.reduce((sum, item) => sum + (item.refundAmount ?? 0), 0);
      }
    }
  }
  return { count, totalValue };
}

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

function drawBarChart(
  doc: jsPDF,
  data: TransactionMonthlyTrendPoint[],
  rect: ChartRect,
) {
  const { x, y, w, h } = rect;
  const pad = { top: 10, right: 6, bottom: 16, left: 8 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;
  const baseline = y + pad.top + chartH;

  // Chart background
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, 2, 2, "FD");

  if (data.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(130);
    doc.text("No chart data available.", x + w / 2, y + h / 2, { align: "center" });
    return;
  }

  const maxVal = Math.max(...data.map((d) => d.transactionCount), 1);
  const colW = chartW / data.length - 2;
  const barW = Math.min(colW * 0.7, 8);

  // Y-axis grid lines & labels
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

  // Bars
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    const barH = (d.transactionCount / maxVal) * chartH;
    const barX = x + pad.left + i * (chartW / data.length) + (chartW / data.length - barW) / 2;
    const barY = baseline - barH;

    // Bar fill
    doc.setFillColor(59, 130, 246);
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0);
    doc.rect(barX, barY, barW, barH, "F");

    // Value label on top of bar
    doc.setFontSize(5);
    doc.setTextColor(37, 99, 235);
    doc.text(number(d.transactionCount), barX + barW / 2, barY - 1, { align: "center" });

    // Month label
    const [yr, mo] = d.month.split("-");
    const shortMonth = new Date(+yr, +mo - 1).toLocaleDateString("en-US", { month: "short" });
    const label = `${shortMonth} '${yr.slice(2)}`;
    doc.setFontSize(5.5);
    doc.setTextColor(100);
    doc.text(label, barX + barW / 2, baseline + 4, { align: "center" });
  }

  // Axis lines
  doc.setDrawColor(180);
  doc.setLineWidth(0.2);
  doc.line(x + pad.left, baseline, x + pad.left + chartW, baseline);
  doc.line(x + pad.left, y + pad.top, x + pad.left, baseline);
}

function drawAreaChart(
  doc: jsPDF,
  data: TransactionMonthlyTrendPoint[],
  rect: ChartRect,
) {
  const { x, y, w, h } = rect;
  const pad = { top: 10, right: 6, bottom: 16, left: 16 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;
  const baseline = y + pad.top + chartH;

  // Chart background
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, 2, 2, "FD");

  if (data.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(130);
    doc.text("No chart data available.", x + w / 2, y + h / 2, { align: "center" });
    return;
  }

  const maxVal = Math.max(...data.map((d) => d.netRevenue), 1);
  const step = chartW / (data.length - 1 || 1);

  // Y-axis grid lines & labels
  const ySteps = 4;
  for (let i = 0; i <= ySteps; i++) {
    const val = Math.round((maxVal / ySteps) * i);
    const lineY = baseline - (chartH / ySteps) * i;
    doc.setDrawColor(220);
    doc.setLineWidth(0.1);
    doc.line(x + pad.left, lineY, x + pad.left + chartW, lineY);
    doc.setFontSize(6);
    doc.setTextColor(120);
    doc.text(shortCurrency(val), x + pad.left - 1, lineY + 1.5, { align: "right" });
  }

  // Build data points (scaled to chart area)
  const pts: { px: number; py: number }[] = data.map((d, i) => ({
    px: x + pad.left + i * step,
    py: baseline - (d.netRevenue / maxVal) * chartH,
  }));

  // Draw area fill (translucent)
  doc.setFillColor(34, 197, 94);
  doc.setDrawColor(34, 197, 94);

  // Draw filled polygon using path API
  let pathStr = `M ${pts[0].px.toFixed(1)} ${pts[0].py.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    pathStr += ` L ${pts[i].px.toFixed(1)} ${pts[i].py.toFixed(1)}`;
  }
  pathStr += ` L ${pts[pts.length - 1].px.toFixed(1)} ${baseline.toFixed(1)}`;
  pathStr += ` L ${pts[0].px.toFixed(1)} ${baseline.toFixed(1)} Z`;

  doc.path(parseSvgPath(pathStr));
  doc.setGState(doc.GState({ opacity: 0.3 }));
  doc.setFillColor(34, 197, 94);
  doc.fill();
  doc.setGState(doc.GState({ opacity: 1.0 }));

  // Draw the line on top
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.6);
  for (let i = 0; i < pts.length - 1; i++) {
    doc.line(pts[i].px, pts[i].py, pts[i + 1].px, pts[i + 1].py);
  }

  // Value labels above data points
  for (let i = 0; i < data.length; i++) {
    doc.setFontSize(5);
    doc.setTextColor(5, 150, 105);
    doc.text(shortCurrency(data[i].netRevenue), pts[i].px, pts[i].py - 2, { align: "center" });
  }

  // Month labels
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    const [yr, mo] = d.month.split("-");
    const shortMonth = new Date(+yr, +mo - 1).toLocaleDateString("en-US", { month: "short" });
    const label = `${shortMonth} '${yr.slice(2)}`;
    doc.setFontSize(5.5);
    doc.setTextColor(100);
    doc.text(label, pts[i].px, baseline + 4, { align: "center" });
  }

  // Axis lines
  doc.setDrawColor(180);
  doc.setLineWidth(0.2);
  doc.line(x + pad.left, baseline, x + pad.left + chartW, baseline);
  doc.line(x + pad.left, y + pad.top, x + pad.left, baseline);
}

function shortCurrency(value: number) {
  if (value >= 1_000_000) return `PHP ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `PHP ${(value / 1_000).toFixed(0)}K`;
  return `PHP ${value}`;
}

// ── Main export ──────────────────────────────────────────────────────

function generateTransactionPdf(
  report: TransactionHierarchicalReportDataset,
  monthlyTrend: TransactionMonthlyTrendPoint[],
  receivables: AgingReceivable[],
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
  doc.text("Transaction Report", pageW / 2, cursorY, { align: "center" });
  cursorY += 4.5;

  doc.setFontSize(8);
  doc.setTextColor(130);
  doc.text(`Generated: ${formatTimestamp()} by ${report.metadata.generatedBy}`, pageW / 2, cursorY, { align: "center" });
  cursorY += 12;

  // Divider line
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(margin, cursorY, pageW - margin, cursorY);
  cursorY += 6;

  // ═══════════════════════════════════════════════════════════
  // 2. Aggregated Financial Summary — Table 1
  // ═══════════════════════════════════════════════════════════
  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Aggregated Financial Summary (${formatDate(report.minDate)} \u2013 ${formatDate(report.maxDate)})`,
    margin,
    cursorY,
  );
  cursorY += 5;

  const paid = aggregate(report.statusGroups, "PAID");
  const partiallyPaid = paidAggregate(report.statusGroups, "DEPOSIT");
  const voided = aggregate(report.statusGroups, "VOIDED");
  const refunded = refundDeductionAggregate(report.statusGroups);

  const grossCount = paid.count + partiallyPaid.count;
  const grossValue = paid.totalValue + partiallyPaid.totalValue;
  const deductionCount = voided.count + refunded.count;
  const deductionValue = voided.totalValue + refunded.totalValue;
  const totalTransactions = grossCount + voided.count;
  const netActiveTransactions = grossCount;
  const netRevenue = grossValue - deductionValue;

  const summaryBody = [
    [
      { content: "INFLOW", colSpan: 3, styles: { fontStyle: "bold", fillColor: [245, 245, 245], textColor: [100] } },
    ],
    [
      "Paid",
      number(paid.count),
      paid.totalValue > 0 ? `+${currency(paid.totalValue)}` : currency(0),
    ],
    [
      "Deposit",
      number(partiallyPaid.count),
      partiallyPaid.totalValue > 0 ? `+${currency(partiallyPaid.totalValue)}` : currency(0),
    ],
    [
      {
        content: "Gross Total",
        styles: { fontStyle: "bold", fillColor: [209, 250, 229] },
      },
      {
        content: number(grossCount),
        styles: { fontStyle: "bold", fillColor: [209, 250, 229] },
      },
      {
        content: grossValue > 0 ? `+${currency(grossValue)}` : currency(0),
        styles: { fontStyle: "bold", fillColor: [209, 250, 229] },
      },
    ],
    [
      { content: "DEDUCTIONS", colSpan: 3, styles: { fontStyle: "bold", fillColor: [245, 245, 245], textColor: [100] } },
    ],
    [
      "Voided",
      number(voided.count),
      voided.totalValue > 0 ? `-${currency(voided.totalValue)}` : currency(0),
    ],
    [
      "Refunded",
      number(refunded.count),
      refunded.totalValue > 0 ? `-${currency(refunded.totalValue)}` : currency(0),
    ],
    [
      {
        content: "Total Deductions",
        styles: { fontStyle: "bold", fillColor: [254, 226, 226] },
      },
      {
        content: number(deductionCount),
        styles: { fontStyle: "bold", fillColor: [254, 226, 226] },
      },
      {
        content: deductionValue > 0 ? `-${currency(deductionValue)}` : currency(0),
        styles: { fontStyle: "bold", fillColor: [254, 226, 226] },
      },
    ],
    [
      "Total Transactions",
      number(totalTransactions),
      "",
    ],
    [
      "Net Active Transactions",
      number(netActiveTransactions),
      "",
    ],
    [
      {
        content: "Net Revenue",
        styles: { fontStyle: "bold", fillColor: [219, 234, 254], textColor: [30, 64, 175] },
      },
      {
        content: "",
        styles: { fillColor: [219, 234, 254] },
      },
      {
        content: currency(netRevenue),
        styles: { fontStyle: "bold", fillColor: [219, 234, 254], textColor: [30, 64, 175] },
      },
    ],
  ];

  const tableW = pageW - margin * 2;
  const col0 = Math.round(tableW * 0.52);
  const col1 = Math.round(tableW * 0.18);
  const col2 = tableW - col0 - col1;

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    head: [[
      { content: "", styles: { halign: "left" } },
      { content: "Count", styles: { halign: "right" } },
      { content: "Amount", styles: { halign: "right" } },
    ]],
    body: summaryBody,
    theme: "plain",
    tableWidth: tableW,
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 8 },
    columnStyles: {
      0: { cellWidth: col0, halign: "left" },
      1: { cellWidth: col1, halign: "right" },
      2: { cellWidth: col2, halign: "right" },
    },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 6;

  // Separator
  doc.setDrawColor(180);
  doc.setLineWidth(0.3);
  doc.line(margin, cursorY, pageW - margin, cursorY);
  cursorY += 10;

  // ═══════════════════════════════════════════════════════════
  // 3. Aging Accounts Receivable — Table 2
  // ═══════════════════════════════════════════════════════════
  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.setFont("helvetica", "bold");
  doc.text("Aging Accounts Receivable", margin, cursorY);
  cursorY += 5;

  if (receivables.length > 0) {
    const arCols = [26, 24, 32, 26, 26, 26, 22];
    const arTotal = arCols.reduce((a, b) => a + b, 0);
    const arScale = tableW / arTotal;
    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      tableWidth: tableW,
      head: [[
        "Transaction #",
        "Date",
        "Customer",
        { content: "Total", styles: { halign: "right" } },
        { content: "Paid", styles: { halign: "right" } },
        { content: "Balance Due", styles: { halign: "right" } },
        { content: "Days Out.", styles: { halign: "right" } },
      ]],
      body: receivables.map((r) => [
        r.transactionNumber,
        new Date(r.transactionDate).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }),
        r.customerName,
        currency(r.totalAmount),
        currency(r.amountPaid),
        currency(r.balanceDue),
        `${r.daysOutstanding} days`,
      ]),
      theme: "striped",
      styles: { fontSize: 7.5, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 7.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: Math.round(arCols[0] * arScale) },
        1: { cellWidth: Math.round(arCols[1] * arScale) },
        2: { cellWidth: Math.round(arCols[2] * arScale) },
        3: { halign: "right", cellWidth: Math.round(arCols[3] * arScale) },
        4: { halign: "right", cellWidth: Math.round(arCols[4] * arScale) },
        5: { halign: "right", cellWidth: Math.round(arCols[5] * arScale) },
        6: { halign: "right", cellWidth: Math.round(arCols[6] * arScale) },
      },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 6;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(130);
    doc.setFont("helvetica", "italic");
    doc.text("No outstanding accounts receivable older than 14 days.", margin, cursorY);
    cursorY += 6;
  }

  // Separator
  doc.setDrawColor(180);
  doc.setLineWidth(0.3);
  doc.line(margin, cursorY, pageW - margin, cursorY);
  cursorY += 10;

  // ═══════════════════════════════════════════════════════════
  // 4. Charts — Transaction Volume + Net Revenue Trend
  // ═══════════════════════════════════════════════════════════

  // Check if we need a new page for charts (if remaining space < 70mm)
  const pageH = doc.internal.pageSize.getHeight();
  const remainingSpace = pageH - cursorY - margin;
  if (remainingSpace < 70) {
    doc.addPage();
    cursorY = margin + 2;
  }

  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.setFont("helvetica", "bold");
  doc.text("Monthly Trends", margin, cursorY);
  cursorY += 5;

  const chartW = pageW - margin * 2;
  const chartH = 58;

  // Transaction Volume
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.setFont("helvetica", "bold");
  doc.text("Transaction Volume", margin, cursorY);
  cursorY += 3;

  const barRect: ChartRect = { x: margin, y: cursorY, w: chartW, h: chartH };
  drawBarChart(doc, monthlyTrend, barRect);
  cursorY = barRect.y + barRect.h + 10;

  if (cursorY + chartH > pageH - margin) {
    doc.addPage();
    cursorY = margin + 2;
  }

  // Net Revenue Trend
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.setFont("helvetica", "bold");
  doc.text("Net Revenue Trend", margin, cursorY);
  cursorY += 3;

  const areaRect: ChartRect = { x: margin, y: cursorY, w: chartW, h: chartH };
  drawAreaChart(doc, monthlyTrend, areaRect);

  // Save
  doc.save("transaction_report.pdf");
}

export { generateTransactionPdf };
