import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  ComprehensiveInventoryReportDataset,
  CategoryBreakdownDTO,
  InventoryValueTrendPoint,
  ProductDetailsDTO,
  TopSellingProductDTO,
} from "@/features/reports/types";

// ── Currency / date helpers (mirrors transactionPdfExport.ts) ─────────

const currency = (value: number): string => {
  const abs = Math.abs(value);
  const [int_, dec] = abs.toFixed(2).split(".");
  return `PHP ${int_.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${dec}`;
};

const number = (value: number) => new Intl.NumberFormat("en-PH").format(value);

const formatTimestamp = () =>
  new Date().toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatCategory = (cat: string) =>
  cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function shortCurrency(value: number) {
  if (value >= 1_000_000) return `PHP ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `PHP ${(value / 1_000).toFixed(0)}K`;
  return `PHP ${value}`;
}

// ── Chart drawing helpers ────────────────────────────────────────────

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
 * Draws a vector area+line chart for the 12-Month Inventory Value Trend.
 * Mirrors drawAreaChart in patientPdfExport.ts — data key: d.value, green color scheme.
 */
function drawAreaChart(
  doc: jsPDF,
  data: InventoryValueTrendPoint[],
  rect: ChartRect,
) {
  const { x, y, w, h } = rect;
  const pad = { top: 10, right: 6, bottom: 16, left: 16 };
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
    doc.text("No value trend data available.", x + w / 2, y + h / 2, { align: "center" });
    return;
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);
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
    doc.text(shortCurrency(val), x + pad.left - 1, lineY + 1.5, { align: "right" });
  }

  const pts: { px: number; py: number }[] = data.map((d, i) => ({
    px: x + pad.left + i * step,
    py: baseline - (d.value / maxVal) * chartH,
  }));

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

  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.6);
  for (let i = 0; i < pts.length - 1; i++) {
    doc.line(pts[i].px, pts[i].py, pts[i + 1].px, pts[i + 1].py);
  }

  for (let i = 0; i < pts.length; i++) {
    const isCurrentMonth = i === pts.length - 1;
    doc.setFillColor(34, 197, 94);
    doc.circle(pts[i].px, pts[i].py, isCurrentMonth ? 1.2 : 0.9, "F");
  }

  for (let i = 0; i < data.length; i++) {
    doc.setFontSize(5);
    doc.setTextColor(5, 150, 105);
    doc.text(shortCurrency(data[i].value), pts[i].px, pts[i].py - 2.5, { align: "center" });
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
 * Draws a horizontal bar chart for the Inventory Valuation by Category.
 * Mirrors drawHorizontalBarChart in patientPdfExport.ts — all bars single color.
 */
function drawHorizontalBarChart(
  doc: jsPDF,
  data: CategoryBreakdownDTO[],
  rect: ChartRect,
): number {
  const { x, y, w, h } = rect;
  const pad = { top: 4, right: 10, bottom: 14, left: 4 };
  const chartH = h - pad.top - pad.bottom;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, 2, 2, "FD");

  if (data.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(130);
    doc.text("No category data available.", x + w / 2, y + h / 2, { align: "center" });
    return h;
  }

  const maxVal = Math.max(...data.map((d) => d.totalValue), 1);
  const rowCount = data.length;
  const rowH = chartH / rowCount;

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  let labelColW = 0;
  for (const d of data) {
    const tw = doc.getTextWidth(d.category);
    if (tw > labelColW) labelColW = tw;
  }
  labelColW = Math.min(labelColW + 3, w * 0.38);

  const barOriginX = x + pad.left + labelColW;
  const barMaxWidth = w - pad.left - pad.right - labelColW;
  const barHeight = Math.min(rowH * 0.55, 5);
  const barRadius = 1.5;
  const baseline = y + pad.top + chartH;

  const xSteps = 4;
  doc.setDrawColor(180);
  doc.setLineWidth(0.1);
  for (let i = 1; i <= xSteps; i++) {
    const gx = barOriginX + (barMaxWidth / xSteps) * i;
    let segY = y + pad.top;
    while (segY < baseline) {
      const segEnd = Math.min(segY + 1.5, baseline);
      doc.line(gx, segY, gx, segEnd);
      segY = segEnd + 1;
    }
  }

  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    const barW = Math.max(0, (d.totalValue / maxVal) * barMaxWidth);
    const rowY = y + pad.top + i * rowH + rowH / 2;
    const barY = rowY - barHeight / 2;

    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(d.categoryName, barOriginX - 2, rowY + 1.2, {
      align: "right",
      maxWidth: labelColW - 2,
    });

    if (barW > 0) {
      doc.setFillColor(34, 197, 94);
      const r = Math.min(barRadius, barW / 2, barHeight / 2);
      if (barW > r * 2) {
        doc.rect(barOriginX, barY, barW - r, barHeight, "F");
        doc.roundedRect(barOriginX + barW - r * 2, barY, r * 2, barHeight, r, r, "F");
      } else {
        doc.roundedRect(barOriginX, barY, barW, barHeight, r, r, "F");
      }
    }

    doc.setFontSize(6.5);
    doc.setTextColor(5, 150, 105);
    doc.setFont("helvetica", "bold");
    doc.text(currency(d.totalValue), barOriginX + barW + 1.5, rowY + 1.2, { align: "left" });
  }

  doc.setFontSize(6);
  doc.setTextColor(120);
  doc.setFont("helvetica", "normal");
  for (let i = 0; i <= xSteps; i++) {
    const val = Math.round((maxVal / xSteps) * i);
    const tx = barOriginX + (barMaxWidth / xSteps) * i;
    doc.text(shortCurrency(val), tx, baseline + 4, { align: "center" });
  }

  return h;
}

// ── Table rendering helpers ──────────────────────────────────────────

function renderProductTable(
  doc: jsPDF,
  title: string,
  products: ProductDetailsDTO[],
  startY: number,
  pageW: number,
  margin: number,
  extraCol?: { header: string; dataKey: string },
): number {
  if (products.length === 0) {
    doc.setFontSize(9);
    doc.setTextColor(130);
    doc.setFont("helvetica", "normal");
    doc.text(`No ${title.toLowerCase()} products.`, margin, startY + 5);
    return startY + 10;
  }

  const tableW = pageW - margin * 2;
  const columns = [
    { header: "Product", dataKey: "productName" },
    { header: "Category", dataKey: "category" },
    { header: "Qty", dataKey: "quantity" },
    ...(extraCol ? [{ header: extraCol.header, dataKey: extraCol.dataKey }] : []),
    { header: "Unit Price", dataKey: "unitPrice" },
  ];

  const body = products.map((p) => {
    const row: Record<string, string> = {
      productName: p.productName,
      category: p.category.replace(/_/g, " "),
      quantity: String(p.quantity),
      unitPrice: currency(p.unitPrice),
    };
    if (extraCol) {
      row[extraCol.dataKey] = String(
        (p as unknown as Record<string, unknown>)[extraCol.dataKey] ?? "",
      );
    }
    return row;
  });

  const qtyColIdx = 2;
  const thresholdColIdx = extraCol ? 3 : -1;
  const unitPriceColIdx = extraCol ? 4 : 3;

  const rightAlignCols = new Set([qtyColIdx, unitPriceColIdx]);
  if (thresholdColIdx >= 0) rightAlignCols.add(thresholdColIdx);

  const headCells: any[] = columns.map((c, i) => {
    if (rightAlignCols.has(i)) {
      return { content: c.header, styles: { halign: "right" } };
    }
    return c.header;
  });

  const colStyles: Record<number, { halign: "right" }> = {};
  for (const idx of rightAlignCols) {
    colStyles[idx] = { halign: "right" };
  }

  autoTable(doc, {
    startY,
    margin: { left: margin, right: margin },
    tableWidth: tableW,
    head: [headCells],
    body: body.map((r) => columns.map((c) => r[c.dataKey])),
    theme: "striped",
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 7.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: colStyles,
  });

  return (doc as any).lastAutoTable.finalY;
}

function renderTopSellingTable(
  doc: jsPDF,
  products: TopSellingProductDTO[],
  startY: number,
  pageW: number,
  margin: number,
): number {
  if (products.length === 0) {
    doc.setFontSize(9);
    doc.setTextColor(130);
    doc.setFont("helvetica", "normal");
    doc.text("No top selling products.", margin, startY + 5);
    return startY + 10;
  }

  const tableW = pageW - margin * 2;

  autoTable(doc, {
    startY,
    margin: { left: margin, right: margin },
    tableWidth: tableW,
    head: [[
      "Product",
      "Category",
      { content: "Unit Price", styles: { halign: "right" } },
      { content: "Units Sold", styles: { halign: "right" } },
      { content: "Revenue", styles: { halign: "right" } },
    ]],
    body: products.map((p) => [
      p.productName,
      p.category.replace(/_/g, " "),
      currency(p.unitPrice),
      number(p.totalSold),
      currency(p.totalRevenue),
    ]),
    theme: "striped",
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 7.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
  });

  return (doc as any).lastAutoTable.finalY;
}

// ── Main export ──────────────────────────────────────────────────────

function generateInventoryPdf(
  report: ComprehensiveInventoryReportDataset,
  valueTrend: InventoryValueTrendPoint[],
  categoryBreakdown: CategoryBreakdownDTO[],
  outOfStockProducts: ProductDetailsDTO[],
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
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
  doc.text("Inventory Analytics Summary", pageW / 2, cursorY, { align: "center" });
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
  // 2. Charts — stacked full-width rows
  // ═══════════════════════════════════════════════════════════

  const chartTargetH = 62;
  const fullChartW = pageW - margin * 2;

  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.setFont("helvetica", "bold");
  doc.text("Macro Inventory Analytics", margin, cursorY);
  cursorY += 5;

  // 2a. 12-Month Inventory Value Trend (area chart)
  if (cursorY + chartTargetH > pageH - margin) {
    doc.addPage();
    cursorY = margin + 2;
  }

  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.setFont("helvetica", "bold");
  doc.text("12-Month Inventory Value Trend", margin, cursorY);
  cursorY += 3;

  const areaRect: ChartRect = { x: margin, y: cursorY, w: fullChartW, h: chartTargetH };
  drawAreaChart(doc, valueTrend, areaRect);
  cursorY = areaRect.y + areaRect.h + 8;

  // 2b. Inventory Valuation by Category (horizontal bar)
  if (cursorY + chartTargetH > pageH - margin) {
    doc.addPage();
    cursorY = margin + 2;
  }

  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.setFont("helvetica", "bold");
  doc.text("Inventory Valuation by Category", margin, cursorY);
  cursorY += 3;

  const sortedCategories = [...categoryBreakdown]
    .map((d) => ({ ...d, categoryName: formatCategory(d.categoryName) }))
    .sort((a, b) => b.totalValue - a.totalValue);
  const barChartH = Math.max(chartTargetH, sortedCategories.length * 6.5 + 18);
  const barRect: ChartRect = { x: margin, y: cursorY, w: fullChartW, h: barChartH };
  drawHorizontalBarChart(doc, sortedCategories, barRect);
  cursorY = barRect.y + barRect.h + 10;

  const drawSeparator = () => {
    doc.setDrawColor(180);
    doc.setLineWidth(0.3);
    doc.line(margin, cursorY, pageW - margin, cursorY);
    cursorY += 8;
  };

  // Separator after charts
  drawSeparator();

  // ═══════════════════════════════════════════════════════════
  // 3. Operational Tables — stacked via autoTable
  // ═══════════════════════════════════════════════════════════

  // Guard: if not enough room for first table header (~15mm), new page
  if (cursorY + 15 > pageH - margin) {
    doc.addPage();
    cursorY = margin + 2;
  }

  // 3a. No Stock Products
  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.setFont("helvetica", "bold");
  doc.text(`No Stock Products (${outOfStockProducts.length})`, margin, cursorY);
  cursorY += 5;

  cursorY = renderProductTable(
    doc,
    "No Stock",
    outOfStockProducts,
    cursorY,
    pageW,
    margin,
  );
  cursorY += 6;

  drawSeparator();

  // 3b. Reorder Needed
  if (cursorY + 15 > pageH - margin) {
    doc.addPage();
    cursorY = margin + 2;
  }

  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.setFont("helvetica", "bold");
  doc.text(`Reorder Needed (${report.lowStockProducts.length})`, margin, cursorY);
  cursorY += 5;

  cursorY = renderProductTable(
    doc,
    "Reorder Needed",
    report.lowStockProducts,
    cursorY,
    pageW,
    margin,
    { header: "Threshold", dataKey: "lowLevelThreshold" },
  );
  cursorY += 6;

  drawSeparator();

  // 3c. Overstock Products
  if (cursorY + 15 > pageH - margin) {
    doc.addPage();
    cursorY = margin + 2;
  }

  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.setFont("helvetica", "bold");
  doc.text(`Overstock Products (${report.overstockProducts.length})`, margin, cursorY);
  cursorY += 5;

  cursorY = renderProductTable(
    doc,
    "Overstock",
    report.overstockProducts,
    cursorY,
    pageW,
    margin,
    { header: "Threshold", dataKey: "overstockedThreshold" },
  );
  cursorY += 6;

  drawSeparator();

  // 3d. Top Selling Products
  if (cursorY + 15 > pageH - margin) {
    doc.addPage();
    cursorY = margin + 2;
  }

  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.setFont("helvetica", "bold");
  doc.text(`Top Selling Products (${report.topSellingProducts.length})`, margin, cursorY);
  cursorY += 5;

  cursorY = renderTopSellingTable(
    doc,
    report.topSellingProducts,
    cursorY,
    pageW,
    margin,
  );

  // Save
  doc.save("inventory_analytics_report.pdf");
}

export { generateInventoryPdf };
