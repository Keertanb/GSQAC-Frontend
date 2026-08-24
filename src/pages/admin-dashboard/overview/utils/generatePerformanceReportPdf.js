import { jsPDF } from "jspdf";

/** Colors matching GSQAC Performance Report sample */
const C = {
  navy: [30, 58, 138],
  navyDeep: [15, 40, 100],
  teal: [13, 148, 136],
  orange: [217, 119, 6],
  purple: [91, 33, 182],
  text: [30, 41, 59],
  muted: [100, 116, 139],
  border: [203, 213, 225],
  white: [255, 255, 255],
  alt: [248, 250, 252],
  totalBg: [226, 232, 240],
  govtTint: [239, 246, 255],
  aidedTint: [240, 253, 250],
  privateTint: [255, 247, 237],
  primaryTint: [239, 246, 255],
  secondaryTint: [240, 253, 244],
  activeCell: [30, 58, 138],
};

function n(v) {
  return Number(v || 0).toLocaleString("en-IN");
}

function pct1(v) {
  return `${Number(v || 0).toFixed(1)}%`;
}

function pct2(v) {
  return `${Number(v || 0).toFixed(2)}%`;
}

function rate(num, den) {
  return den > 0 ? (num * 100) / den : 0;
}

function drawPageHeader(doc, pageW, { title, subtitle, metaLines }) {
  doc.setTextColor(...C.navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.text(title, 8, 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(...C.muted);
  doc.text(subtitle, 8, 15);

  doc.setFontSize(6.8);
  metaLines.forEach((line, i) => {
    doc.text(line, pageW - 8, 9 + i * 3.6, { align: "right" });
  });

  doc.setDrawColor(...C.navy);
  doc.setLineWidth(0.55);
  doc.line(8, 17.5, pageW - 8, 17.5);
  return 20;
}

function drawCards(doc, cards, y, pageW) {
  const margin = 8;
  const gap = 2.2;
  const cardW = (pageW - margin * 2 - gap * 3) / 4;
  const cardH = 16.5;

  cards.forEach((card, i) => {
    const x = margin + i * (cardW + gap);
    doc.setFillColor(...C.white);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, cardW, cardH, 1.2, 1.2, "FD");

    doc.setFillColor(...card.accent);
    doc.rect(x, y, cardW, 1.6, "F");

    doc.setTextColor(...C.muted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.8);
    doc.text(card.title, x + 2, y + 5);

    doc.setTextColor(...C.text);
    doc.setFontSize(11);
    doc.text(n(card.value), x + 2, y + 10.2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.4);
    doc.setTextColor(...C.muted);
    doc.text(card.sub, x + 2, y + 14.2, { maxWidth: cardW - 3.5 });
  });

  return y + cardH + 3.2;
}

function drawSectionBar(doc, text, y, pageW, opts = {}) {
  const h = opts.height || 5.2;
  doc.setFillColor(...(opts.bg || C.navy));
  doc.rect(8, y, pageW - 16, h, "F");
  doc.setTextColor(...C.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(opts.fontSize || 7);
  doc.text(text, 10, y + h * 0.68);
  return y + h + 0.8;
}

function drawSectionAccent(doc, text, y) {
  doc.setFillColor(...C.navy);
  doc.rect(8, y - 2.8, 1.2, 4, "F");
  doc.setTextColor(...C.navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(text, 11, y);
  return y + 2;
}

/**
 * Multi-level table with optional group header colors and per-column body tints.
 */
function drawMultiTable(doc, cfg) {
  const {
    startX,
    startY,
    colWidths,
    groupHeaders,
    subHeaders,
    rows,
    totalRow,
    colTints,
    activeColIndex,
    rowHeight = 3.35,
    groupH = 4.1,
    subH = 3.6,
    fontSize = 5.4,
  } = cfg;

  const tableW = colWidths.reduce((a, b) => a + b, 0);
  let y = startY;

  // Group header
  let x = startX;
  groupHeaders.forEach((g) => {
    const w = colWidths.slice(g.col, g.col + (g.span || 1)).reduce((a, b) => a + b, 0);
    doc.setFillColor(...(g.bg || C.navy));
    doc.rect(x, y, w, groupH, "F");
    if (g.label) {
      doc.setTextColor(...C.white);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(fontSize);
      doc.text(g.label, x + w / 2, y + 2.85, { align: "center" });
    }
    x += w;
  });
  y += groupH;

  // Sub header
  doc.setFillColor(226, 232, 240);
  doc.rect(startX, y, tableW, subH, "F");
  x = startX;
  doc.setTextColor(...C.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(fontSize - 0.3);
  subHeaders.forEach((label, i) => {
    if (label) {
      doc.text(String(label), x + colWidths[i] / 2, y + 2.5, { align: "center" });
    }
    x += colWidths[i];
  });
  y += subH;

  const paintRow = (cells, opts = {}) => {
    let cx = startX;
    cells.forEach((cell, i) => {
      let bg = opts.bg;
      if (!bg && colTints?.[i]) bg = colTints[i];
      if (!bg) bg = opts.alt ? C.alt : C.white;

      const isActive = activeColIndex === i && !opts.isTotal;
      if (isActive) bg = C.activeCell;
      if (opts.isTotal) {
        bg = i === activeColIndex ? C.navyDeep : C.totalBg;
      }

      doc.setFillColor(...bg);
      doc.rect(cx, y, colWidths[i], rowHeight, "F");
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.08);
      doc.rect(cx, y, colWidths[i], rowHeight);

      const val = String(cell ?? "");
      doc.setFont("helvetica", opts.bold || isActive ? "bold" : "normal");
      doc.setFontSize(fontSize - 0.2);
      if (isActive || (opts.isTotal && i === activeColIndex)) {
        doc.setTextColor(...C.white);
      } else {
        doc.setTextColor(...(opts.bold ? C.navyDeep : C.text));
      }

      if (i <= 1) {
        doc.text(val, cx + 0.6, y + 2.35, { maxWidth: colWidths[i] - 1 });
      } else {
        doc.text(val, cx + colWidths[i] - 0.55, y + 2.35, { align: "right" });
      }
      cx += colWidths[i];
    });
    y += rowHeight;
  };

  rows.forEach((row, idx) => paintRow(row, { alt: idx % 2 === 1 }));
  if (totalRow) paintRow(totalRow, { bg: C.totalBg, bold: true, isTotal: true });

  doc.setDrawColor(...C.navy);
  doc.setLineWidth(0.3);
  const totalH = groupH + subH + rows.length * rowHeight + (totalRow ? rowHeight : 0);
  doc.rect(startX, startY, tableW, totalH);

  return y;
}

function drawSimpleSummaryTable(doc, { startX, startY, colWidths, headers, rows, totalRow }) {
  const tableW = colWidths.reduce((a, b) => a + b, 0);
  const hH = 4.6;
  const rH = 4.0;
  let y = startY;

  doc.setFillColor(...C.navy);
  doc.rect(startX, y, tableW, hH, "F");
  let x = startX;
  doc.setTextColor(...C.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.8);
  headers.forEach((h, i) => {
    const align = i === 0 ? "left" : "center";
    const tx = i === 0 ? x + 1.2 : x + colWidths[i] / 2;
    doc.text(h, tx, y + 3.1, { align: i === 0 ? "left" : "center" });
    x += colWidths[i];
  });
  y += hH;

  const paint = (cells, opts = {}) => {
    doc.setFillColor(...(opts.bg || C.white));
    doc.rect(startX, y, tableW, rH, "F");
    let cx = startX;
    cells.forEach((cell, i) => {
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.1);
      doc.rect(cx, y, colWidths[i], rH);
      doc.setFont("helvetica", opts.bold ? "bold" : "normal");
      doc.setFontSize(5.8);
      doc.setTextColor(...C.text);
      const val = String(cell);
      if (i === 0) doc.text(val, cx + 1.2, y + 2.75);
      else {
        const isPct = String(val).includes("%");
        if (isPct) doc.setFont("helvetica", "bold");
        doc.text(val, cx + colWidths[i] - 1, y + 2.75, { align: "right" });
      }
      cx += colWidths[i];
    });
    y += rH;
  };

  rows.forEach((r, i) => paint(r, { bg: i % 2 ? C.alt : C.white }));
  if (totalRow) paint(totalRow, { bg: C.totalBg, bold: true });

  doc.setDrawColor(...C.navy);
  doc.setLineWidth(0.28);
  doc.rect(startX, startY, tableW, hH + (rows.length + (totalRow ? 1 : 0)) * rH);
  return y;
}

function drawVBarChart(doc, { x, y, w, h, title, bars }) {
  // Card frame
  doc.setFillColor(...C.white);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(x, y, w, h, 1, 1, "FD");

  // Title
  doc.setTextColor(...C.navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text(title, x + 2.5, y + 4.2);

  // Plot area — leave room for title, value labels, x labels, and y-axis
  const padL = 14;
  const padR = 4;
  const padT = 10; // below title for % labels
  const padB = 9; // for category labels
  const plotX = x + padL;
  const plotY = y + padT;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const maxScale = 100;

  // Y-axis grid + labels (0, 25, 50, 75, 100)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.2);
  doc.setTextColor(...C.muted);
  for (let tick = 0; tick <= 4; tick += 1) {
    const val = tick * 25;
    const ty = plotY + plotH - (val / maxScale) * plotH;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.15);
    doc.line(plotX, ty, plotX + plotW, ty);
    doc.text(String(val), plotX - 1.5, ty + 1.1, { align: "right" });
  }

  // Baseline
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(plotX, plotY + plotH, plotX + plotW, plotY + plotH);

  const gap = Math.max(3, plotW * 0.08);
  const barW = (plotW - gap * (bars.length - 1)) / bars.length;

  bars.forEach((b, i) => {
    const value = Math.max(0, Math.min(Number(b.value) || 0, maxScale));
    const bx = plotX + i * (barW + gap);
    const bh = Math.max(0.8, (value / maxScale) * plotH);
    const by = plotY + plotH - bh;

    // Solid bar (rect is more reliable than roundedRect for thin/tall bars in jsPDF)
    doc.setFillColor(...b.color);
    doc.rect(bx, by, barW, bh, "F");

    // Value label above bar (always inside reserved padT band)
    doc.setTextColor(...C.text);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.4);
    const labelY = Math.max(y + 7.2, by - 1.4);
    doc.text(pct2(value), bx + barW / 2, labelY, { align: "center" });

    // Category label under baseline
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5);
    doc.setTextColor(...C.muted);
    doc.text(b.label, bx + barW / 2, plotY + plotH + 4.2, { align: "center" });
  });
}

function drawHBarChart(doc, { x, y, w, h, title, items }) {
  doc.setFillColor(...C.white);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(x, y, w, h, 1, 1, "FD");

  doc.setTextColor(...C.navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text(title, x + 2.5, y + 4.2);

  const labelW = 32;
  const startY = y + 7;
  const endY = y + h - 6;
  const rowH = (endY - startY) / Math.max(items.length, 1);
  const barMaxW = w - labelW - 8;
  const maxScale = 100;
  const barH = Math.min(2.6, rowH * 0.55);

  // X-axis ticks at bottom
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4);
  doc.setTextColor(...C.muted);
  [0, 25, 50, 75, 100].forEach((tick) => {
    const tx = x + labelW + (tick / maxScale) * barMaxW;
    doc.text(String(tick), tx, y + h - 1.8, { align: "center" });
  });
  doc.setFontSize(4.2);
  doc.text("Active/Done %", x + labelW + barMaxW / 2, y + h - 0.2, { align: "center" });

  items.forEach((item, i) => {
    const ry = startY + i * rowH;
    const value = Math.max(0, Math.min(Number(item.value) || 0, maxScale));
    const bw = Math.max(1.5, (value / maxScale) * barMaxW);

    doc.setTextColor(...C.text);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(4.5);
    const name = String(item.label || "");
    doc.text(name.length > 16 ? `${name.slice(0, 15)}…` : name, x + 2.5, ry + barH);

    // Track
    doc.setFillColor(241, 245, 249);
    doc.rect(x + labelW, ry, barMaxW, barH, "F");

    // Bar
    doc.setFillColor(...C.teal);
    doc.rect(x + labelW, ry, bw, barH, "F");

    // % inside bar near the end
    doc.setTextColor(...C.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(4.3);
    const pctLabel = pct1(value);
    if (bw > 12) {
      doc.text(pctLabel, x + labelW + bw - 1.2, ry + barH * 0.72, { align: "right" });
    } else {
      doc.setTextColor(...C.text);
      doc.text(pctLabel, x + labelW + bw + 1.2, ry + barH * 0.72);
    }
  });
}


function drawFooter(doc, pageW, pageH, generatedDate, pageNo) {
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.2);
  doc.line(8, pageH - 6.5, pageW - 8, pageH - 6.5);
  doc.setTextColor(...C.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  doc.text(
    `GSQAC Performance Evaluation Report Generated: ${generatedDate}`,
    8,
    pageH - 3.2,
  );
  doc.text(`Page ${pageNo} of 2`, pageW - 8, pageH - 3.2, { align: "right" });
}

/**
 * Portrait A4 GSQAC Performance Report (2 pages) matching the official sample layout.
 */
export function generatePerformanceReportPdf(data) {
  const {
    districtCount,
    generatedDate,
    fileDate,
    mgmtBuckets,
    typeBuckets,
    totals,
    districtMgmtRows,
    districtTypeRows,
  } = data;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const mgmtActive = (m) => m.completed + m.started;

  // Ensure active fields
  Object.values(mgmtBuckets).forEach((m) => {
    m.active = mgmtActive(m);
  });
  Object.values(typeBuckets).forEach((t) => {
    t.active = t.completed + t.started;
  });

  // ═══════════════════════ PAGE 1 — MANAGEMENT ═══════════════════════
  let y = drawPageHeader(doc, pageW, {
    title: "GSQAC PERFORMANCE REPORT BY MANAGEMENT",
    subtitle:
      "Gujarat School Quality Assessment Cell | Government, Grant-in-Aid & Private Schools",
    metaLines: [
      `Districts: ${districtCount} | Total Schools: ${n(totals.total)}`,
      `Generated: ${generatedDate}`,
    ],
  });

  y = drawCards(
    doc,
    [
      {
        title: "GOVERNMENT SCHOOLS",
        value: mgmtBuckets.govt.total,
        sub: `Active/Done: ${n(mgmtBuckets.govt.active)} (${pct1(rate(mgmtBuckets.govt.active, mgmtBuckets.govt.total))}) | Pend: ${n(mgmtBuckets.govt.pending)}`,
        accent: C.navy,
      },
      {
        title: "GRANT-IN-AID SCHOOLS",
        value: mgmtBuckets.aided.total,
        sub: `Active/Done: ${n(mgmtBuckets.aided.active)} (${pct1(rate(mgmtBuckets.aided.active, mgmtBuckets.aided.total))}) | Pend: ${n(mgmtBuckets.aided.pending)}`,
        accent: C.teal,
      },
      {
        title: "PRIVATE SCHOOLS",
        value: mgmtBuckets.private.total,
        sub: `Active/Done: ${n(mgmtBuckets.private.active)} (${pct1(rate(mgmtBuckets.private.active, mgmtBuckets.private.total))}) | Pend: ${n(mgmtBuckets.private.pending)}`,
        accent: C.orange,
      },
      {
        title: "TOTAL INSTITUTIONS",
        value: totals.total,
        sub: `Active/Done: ${n(totals.active)} (${pct1(rate(totals.active, totals.total))}) | Pend: ${n(totals.pending)}`,
        accent: C.purple,
      },
    ],
    y,
    pageW,
  );

  y = drawSectionBar(doc, "STATEWIDE SUMMARY BY MANAGEMENT", y, pageW);

  const summaryCols = [42, 22, 20, 32, 20, 28, 22];
  y = drawSimpleSummaryTable(doc, {
    startX: 8,
    startY: y,
    colWidths: summaryCols,
    headers: [
      "Management Category",
      "Total Schools",
      "Completed",
      "In-Progress (Started)",
      "Pending",
      "Active / Done %",
      "Pending %",
    ],
    rows: ["govt", "aided", "private"].map((key) => {
      const m = mgmtBuckets[key];
      return [
        m.label,
        n(m.total),
        n(m.completed),
        n(m.started),
        n(m.pending),
        pct2(rate(m.active, m.total)),
        pct2(rate(m.pending, m.total)),
      ];
    }),
    totalRow: [
      "STATE TOTAL",
      n(totals.total),
      n(totals.completed),
      n(totals.started),
      n(totals.pending),
      pct2(rate(totals.active, totals.total)),
      pct2(rate(totals.pending, totals.total)),
    ],
  });

  y += 2.2;
  y = drawSectionBar(
    doc,
    "DISTRICT-WISE PERFORMANCE BY MANAGEMENT (RANKED BY ACTIVE/DONE % HIGH TO LOW)",
    y,
    pageW,
    { fontSize: 6.2 },
  );

  // Fit 14 columns on portrait width (~194mm)
  const mgmtCols = [9, 28, 11, 11, 10, 11, 11, 10, 11, 11, 10, 12, 14, 13];
  const mgmtTints = [
    null,
    null,
    C.govtTint,
    C.govtTint,
    C.govtTint,
    C.aidedTint,
    C.aidedTint,
    C.aidedTint,
    C.privateTint,
    C.privateTint,
    C.privateTint,
    null,
    null,
    null,
  ];

  // Reserve space so visual summary charts are never clipped
  const mgmtVisualReserve = 56;
  const mgmtTableHeaderH = 4.1 + 3.6;
  const mgmtRowsCount = districtMgmtRows.length + 1;
  const mgmtAvailH = Math.max(40, pageH - 8 - mgmtVisualReserve - y - mgmtTableHeaderH);
  const mgmtRowH = Math.min(3.35, Math.max(2.65, mgmtAvailH / mgmtRowsCount));

  y = drawMultiTable(doc, {
    startX: 8,
    startY: y,
    colWidths: mgmtCols,
    groupHeaders: [
      { col: 0, label: "Code", bg: C.navyDeep },
      { col: 1, label: "District Name", bg: C.navyDeep },
      { col: 2, span: 3, label: "Government", bg: C.navy },
      { col: 5, span: 3, label: "Grant-in-Aid", bg: C.teal },
      { col: 8, span: 3, label: "Private", bg: C.orange },
      { col: 11, label: "Total", bg: C.navyDeep },
      { col: 12, label: "Completed", bg: C.navyDeep },
      { col: 13, label: "Active%", bg: C.navyDeep },
    ],
    subHeaders: [
      "",
      "",
      "Total",
      "Active",
      "Pend",
      "Total",
      "Active",
      "Pend",
      "Total",
      "Active",
      "Pend",
      "",
      "",
      "",
    ],
    colTints: mgmtTints,
    activeColIndex: 13,
    rows: districtMgmtRows.map((d) => [
      d.districtId || "-",
      String(d.districtName || "").toUpperCase(),
      n(d.govt.total),
      n(d.govt.active),
      n(d.govt.pend),
      n(d.aided.total),
      n(d.aided.active),
      n(d.aided.pend),
      n(d.private.total),
      n(d.private.active),
      n(d.private.pend),
      n(d.total),
      n(d.completed),
      pct1(d.activePercent),
    ]),
    totalRow: [
      "-",
      "STATE TOTAL",
      n(mgmtBuckets.govt.total),
      n(mgmtBuckets.govt.active),
      n(mgmtBuckets.govt.pending),
      n(mgmtBuckets.aided.total),
      n(mgmtBuckets.aided.active),
      n(mgmtBuckets.aided.pending),
      n(mgmtBuckets.private.total),
      n(mgmtBuckets.private.active),
      n(mgmtBuckets.private.pending),
      n(totals.total),
      n(totals.completed),
      pct1(rate(totals.active, totals.total)),
    ],
    rowHeight: mgmtRowH,
    fontSize: 5.1,
  });

  y += 2;
  y = drawSectionAccent(doc, "VISUAL SUMMARY - MANAGEMENT", y);
  y += 1.5;

  const chartH = Math.min(40, Math.max(32, pageH - 22 - y));
  const chartGap = 3;
  const leftW = (pageW - 16 - chartGap) * 0.4;
  const rightW = (pageW - 16 - chartGap) * 0.6;

  drawVBarChart(doc, {
    x: 8,
    y,
    w: leftW,
    h: chartH,
    title: "Active/Done Rate by Management Category",
    bars: [
      {
        label: "Government",
        value: rate(mgmtBuckets.govt.active, mgmtBuckets.govt.total),
        color: C.navy,
      },
      {
        label: "Grant-in-Aid",
        value: rate(mgmtBuckets.aided.active, mgmtBuckets.aided.total),
        color: C.teal,
      },
      {
        label: "Private",
        value: rate(mgmtBuckets.private.active, mgmtBuckets.private.total),
        color: C.orange,
      },
    ],
  });

  drawHBarChart(doc, {
    x: 8 + leftW + chartGap,
    y,
    w: rightW,
    h: chartH,
    title: "Top 10 Districts by Overall Active/Done Rate",
    items: districtMgmtRows.slice(0, 10).map((d) => ({
      label: String(d.districtName || "").toUpperCase(),
      value: d.activePercent,
    })),
  });

  y += chartH + 2.5;
  const top = districtMgmtRows[0];
  const bottom = districtMgmtRows[districtMgmtRows.length - 1];
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(8, y, pageW - 16, 12, 1, 1, "F");
  doc.setTextColor(...C.text);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.6);
  const summaryText =
    `Highest Active/Done rate: ${String(top?.districtName || "-").toUpperCase()} (${pct1(top?.activePercent)}). ` +
    `Lowest Active/Done rate: ${String(bottom?.districtName || "-").toUpperCase()} (${pct1(bottom?.activePercent)}). ` +
    `Grant-in-Aid schools post the highest statewide Active/Done rate (${pct2(rate(mgmtBuckets.aided.active, mgmtBuckets.aided.total))}), ` +
    `followed closely by Government schools (${pct2(rate(mgmtBuckets.govt.active, mgmtBuckets.govt.total))}), ` +
    `while Private schools continue steady advancement at ${pct2(rate(mgmtBuckets.private.active, mgmtBuckets.private.total))}, ` +
    `highlighting robust momentum across institutions with ${n(totals.completed)} fully completed units statewide.`;
  const wrapped = doc.splitTextToSize(summaryText, pageW - 22);
  doc.text(wrapped.slice(0, 3), 10.5, y + 3.5);

  drawFooter(doc, pageW, pageH, generatedDate, 1);

  // ═══════════════════════ PAGE 2 — SCHOOL TYPE ═══════════════════════
  doc.addPage("a4", "portrait");

  y = drawPageHeader(doc, pageW, {
    title: "GSQAC PERFORMANCE REPORT BY SCHOOL TYPE",
    subtitle:
      "Gujarat School Quality Assessment Cell | Primary & Secondary Stages Breakdown",
    metaLines: [
      `Districts: ${districtCount} | Total Schools: ${n(totals.total)}`,
      `Primary: ${n(typeBuckets.primary.total)} | Secondary: ${n(typeBuckets.secondary.total)}`,
    ],
  });

  y = drawCards(
    doc,
    [
      {
        title: "PRIMARY SCHOOLS",
        value: typeBuckets.primary.total,
        sub: `Active/Done: ${n(typeBuckets.primary.active)} (${pct1(rate(typeBuckets.primary.active, typeBuckets.primary.total))}) | Pend: ${n(typeBuckets.primary.pending)}`,
        accent: C.navy,
      },
      {
        title: "SECONDARY SCHOOLS",
        value: typeBuckets.secondary.total,
        sub: `Active/Done: ${n(typeBuckets.secondary.active)} (${pct1(rate(typeBuckets.secondary.active, typeBuckets.secondary.total))}) | Pend: ${n(typeBuckets.secondary.pending)}`,
        accent: C.teal,
      },
      {
        title: "IN-PROGRESS UNITS",
        value: totals.started,
        sub: `Primary: ${n(typeBuckets.primary.started)} | Secondary: ${n(typeBuckets.secondary.started)}`,
        accent: C.orange,
      },
      {
        title: "COMPLETED UNITS",
        value: totals.completed,
        sub: `Primary: ${n(typeBuckets.primary.completed)} | Secondary: ${n(typeBuckets.secondary.completed)}`,
        accent: C.purple,
      },
    ],
    y,
    pageW,
  );

  y = drawSectionBar(doc, "STATEWIDE SUMMARY BY SCHOOL TYPE", y, pageW);

  y = drawSimpleSummaryTable(doc, {
    startX: 8,
    startY: y,
    colWidths: summaryCols,
    headers: [
      "School Category / Stage",
      "Total Schools",
      "Completed",
      "In-Progress (Started)",
      "Pending",
      "Active / Done %",
      "Pending %",
    ],
    rows: ["primary", "secondary"].map((key) => {
      const t = typeBuckets[key];
      return [
        t.label,
        n(t.total),
        n(t.completed),
        n(t.started),
        n(t.pending),
        pct2(rate(t.active, t.total)),
        pct2(rate(t.pending, t.total)),
      ];
    }),
    totalRow: [
      "STATE TOTAL",
      n(totals.total),
      n(totals.completed),
      n(totals.started),
      n(totals.pending),
      pct2(rate(totals.active, totals.total)),
      pct2(rate(totals.pending, totals.total)),
    ],
  });

  y += 2.2;
  y = drawSectionBar(
    doc,
    "DISTRICT-WISE PERFORMANCE BY SCHOOL TYPE (RANKED BY ACTIVE/DONE % HIGH TO LOW)",
    y,
    pageW,
    { fontSize: 6.2 },
  );

  const typeCols = [9, 30, 12, 11, 11, 11, 12, 11, 11, 11, 13, 14, 14];
  const typeTints = [
    null,
    null,
    C.primaryTint,
    C.primaryTint,
    C.primaryTint,
    C.primaryTint,
    C.secondaryTint,
    C.secondaryTint,
    C.secondaryTint,
    C.secondaryTint,
    null,
    null,
    null,
  ];

  const typeVisualReserve = 52;
  const typeTableHeaderH = 4.1 + 3.6;
  const typeRowsCount = districtTypeRows.length + 1;
  const typeAvailH = Math.max(40, pageH - 8 - typeVisualReserve - y - typeTableHeaderH);
  const typeRowH = Math.min(3.35, Math.max(2.65, typeAvailH / typeRowsCount));

  y = drawMultiTable(doc, {
    startX: 8,
    startY: y,
    colWidths: typeCols,
    groupHeaders: [
      { col: 0, label: "Code", bg: C.navyDeep },
      { col: 1, label: "District Name", bg: C.navyDeep },
      { col: 2, span: 4, label: "Primary Schools", bg: C.navy },
      { col: 6, span: 4, label: "Secondary Schools", bg: C.teal },
      { col: 10, label: "Total", bg: C.navyDeep },
      { col: 11, label: "Completed", bg: C.navyDeep },
      { col: 12, label: "Active%", bg: C.navyDeep },
    ],
    subHeaders: [
      "",
      "",
      "Total",
      "Comp",
      "Start",
      "Pend",
      "Total",
      "Comp",
      "Start",
      "Pend",
      "",
      "",
      "",
    ],
    colTints: typeTints,
    activeColIndex: 12,
    rows: districtTypeRows.map((d) => [
      d.districtId || "-",
      String(d.districtName || "").toUpperCase(),
      n(d.primary.total),
      n(d.primary.completed),
      n(d.primary.started),
      n(d.primary.pending),
      n(d.secondary.total),
      n(d.secondary.completed),
      n(d.secondary.started),
      n(d.secondary.pending),
      n(d.total),
      n(d.completed),
      pct1(d.activePercent),
    ]),
    totalRow: [
      "-",
      "STATE TOTAL",
      n(typeBuckets.primary.total),
      n(typeBuckets.primary.completed),
      n(typeBuckets.primary.started),
      n(typeBuckets.primary.pending),
      n(typeBuckets.secondary.total),
      n(typeBuckets.secondary.completed),
      n(typeBuckets.secondary.started),
      n(typeBuckets.secondary.pending),
      n(totals.total),
      n(totals.completed),
      pct1(rate(totals.active, totals.total)),
    ],
    rowHeight: typeRowH,
    fontSize: 5.1,
  });

  y += 2;
  y = drawSectionAccent(doc, "VISUAL SUMMARY - SCHOOL TYPE", y);
  y += 1.5;

  const typeChartH = Math.min(42, Math.max(34, pageH - 14 - y));
  const typeLeftW = (pageW - 16 - chartGap) * 0.4;
  const typeRightW = (pageW - 16 - chartGap) * 0.6;

  drawVBarChart(doc, {
    x: 8,
    y,
    w: typeLeftW,
    h: typeChartH,
    title: "Active/Done Rate by School Type",
    bars: [
      {
        label: "Primary",
        value: rate(typeBuckets.primary.active, typeBuckets.primary.total),
        color: C.navy,
      },
      {
        label: "Secondary",
        value: rate(typeBuckets.secondary.active, typeBuckets.secondary.total),
        color: C.teal,
      },
    ],
  });

  doc.setFillColor(239, 246, 255);
  doc.roundedRect(8 + typeLeftW + chartGap, y, typeRightW, typeChartH, 1, 1, "F");
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(8 + typeLeftW + chartGap, y, typeRightW, typeChartH, 1, 1);
  doc.setTextColor(...C.navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("Interpretation", 8 + typeLeftW + chartGap + 3, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.6);
  doc.setTextColor(...C.text);
  const typeNarrative =
    `Primary schools demonstrate a higher Active/Done rate (${pct2(rate(typeBuckets.primary.active, typeBuckets.primary.total))}) ` +
    `compared to Secondary schools (${pct2(rate(typeBuckets.secondary.active, typeBuckets.secondary.total))}). ` +
    `Statewide, primary assessments have progressed significantly with ${n(typeBuckets.primary.completed)} completed and ` +
    `over ${n(typeBuckets.primary.started)} started institutions, while secondary institutions continue strong acceleration ` +
    `with ${n(typeBuckets.secondary.completed)} completed units towards target completion milestones.`;
  const typeWrapped = doc.splitTextToSize(typeNarrative, typeRightW - 6);
  doc.text(typeWrapped, 8 + typeLeftW + chartGap + 3, y + 10);

  drawFooter(doc, pageW, pageH, generatedDate, 2);

  const filename = `GSQAC_Performance_Report_${fileDate}.pdf`;
  if (data.outputPath) {
    // Node / test path — write bytes directly
    const fs = data.fsModule;
    if (fs?.writeFileSync) {
      fs.writeFileSync(data.outputPath, Buffer.from(doc.output("arraybuffer")));
    }
  } else {
    doc.save(filename);
  }
  return doc;
}
