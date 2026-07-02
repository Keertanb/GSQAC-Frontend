import { getCompletionColor, getCompletionTone, pct } from "./gujaratDistrictUtils";

export function getBlockCompletionRate(block) {
  const total = block?.total ?? 0;
  const completed = block?.completed ?? 0;
  return pct(completed, total);
}

export function buildBlockStats(block) {
  const total = block?.total ?? 0;
  const completed = block?.completed ?? 0;
  const rate = getBlockCompletionRate(block);
  const hasData = total > 0;

  return {
    blockId: block?.blockId,
    blockName: block?.blockName || "Block",
    total,
    weight: Math.max(1, total),
    completed,
    inProgress: block?.inProgress ?? 0,
    pending: block?.pending ?? 0,
    notAllocated: block?.notAllocated ?? 0,
    completionRate: rate,
    hasData,
    fill: getCompletionColor(rate, hasData),
    tone: getCompletionTone(rate, hasData),
  };
}

export function mergeBlockBreakdown(blockBreakdown = [], masterBlocks = []) {
  const statsById = new Map(
    blockBreakdown.map((block) => [String(block.blockId), block]),
  );

  if (masterBlocks.length > 0) {
    return masterBlocks.map((block) => {
      const blockId = block.value ?? block.blockId;
      const existing = statsById.get(String(blockId));
      if (existing) return existing;

      return {
        blockId,
        blockName: block.name || block.blockName || `Block ${blockId}`,
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        notAllocated: 0,
      };
    });
  }

  return blockBreakdown;
}

function getBoundsSize(bounds) {
  const [[x0, y0], [x1, y1]] = bounds;
  return {
    x: x0,
    y: y0,
    width: Math.max(0, x1 - x0),
    height: Math.max(0, y1 - y0),
  };
}

/**
 * Weighted row treemap — larger blocks get more area inside the district shape.
 */
export function layoutTreemapCells(items, bounds, padding = 10, gap = 4) {
  if (!items.length || !bounds) return [];

  const area = getBoundsSize(bounds);
  const innerX = area.x + padding;
  const innerY = area.y + padding;
  const innerWidth = Math.max(0, area.width - padding * 2);
  const innerHeight = Math.max(0, area.height - padding * 2);

  if (innerWidth <= 0 || innerHeight <= 0) return [];

  const nodes = items
    .map((item) => ({
      ...item,
      weight: Math.max(1, item.weight ?? item.total ?? 1),
    }))
    .sort((a, b) => b.weight - a.weight);

  const totalWeight = nodes.reduce((sum, node) => sum + node.weight, 0);
  const rowCount = Math.max(1, Math.round(Math.sqrt(nodes.length * (innerHeight / innerWidth))));
  const rows = Array.from({ length: rowCount }, () => []);
  const rowWeights = Array.from({ length: rowCount }, () => 0);

  nodes.forEach((node, index) => {
    const rowIndex = index % rowCount;
    rows[rowIndex].push(node);
    rowWeights[rowIndex] += node.weight;
  });

  const cells = [];
  let cursorY = innerY;

  rows.forEach((row, rowIndex) => {
    if (!row.length) return;

    const rowWeight = rowWeights[rowIndex];
    const rowHeight = (innerHeight * rowWeight) / totalWeight - (rowIndex < rowCount - 1 ? gap : 0);
    let cursorX = innerX;

    row.forEach((node, nodeIndex) => {
      const nodeWidth =
        (innerWidth * node.weight) / rowWeight - (nodeIndex < row.length - 1 ? gap : 0);

      cells.push({
        ...node,
        x: cursorX,
        y: cursorY,
        width: Math.max(4, nodeWidth),
        height: Math.max(4, rowHeight),
      });

      cursorX += nodeWidth + gap;
    });

    cursorY += rowHeight + gap;
  });

  return cells;
}

export function layoutSchoolMarkers(items, bounds, padding = 14, gap = 3) {
  if (!items.length || !bounds) return [];

  const area = getBoundsSize(bounds);
  const innerX = area.x + padding;
  const innerY = area.y + padding;
  const innerWidth = Math.max(0, area.width - padding * 2);
  const innerHeight = Math.max(0, area.height - padding * 2);

  if (innerWidth <= 0 || innerHeight <= 0) return [];

  const count = items.length;
  const aspect = innerWidth / innerHeight || 1;
  const cols = Math.max(1, Math.ceil(Math.sqrt(count * aspect)));
  const rows = Math.ceil(count / cols);
  const cellWidth = (innerWidth - gap * (cols - 1)) / cols;
  const cellHeight = (innerHeight - gap * (rows - 1)) / rows;

  return items.map((item, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    return {
      ...item,
      x: innerX + col * (cellWidth + gap),
      y: innerY + row * (cellHeight + gap),
      width: Math.max(0, cellWidth),
      height: Math.max(0, cellHeight),
    };
  });
}

const SCHOOL_STATUS_COLORS = {
  completed: "#059669",
  inprogress: "#3b82f6",
  pending: "#f59e0b",
  notallocated: "#94a3b8",
  allocated: "#6366f1",
};

export function normalizeSchoolStatus(status) {
  return (status || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function getSchoolStatusColor(status) {
  const key = normalizeSchoolStatus(status);
  return SCHOOL_STATUS_COLORS[key] || "#cbd5e1";
}

export function getSchoolStatusTone(status) {
  const key = normalizeSchoolStatus(status);
  if (key === "completed") return "excellent";
  if (key === "inprogress" || key === "allocated") return "good";
  if (key === "pending") return "moderate";
  if (key === "notallocated") return "none";
  return "none";
}

export function buildSchoolStats(school) {
  const status =
    school?.overallStatus ||
    school?.status ||
    school?.allocationStatus ||
    "Pending";

  return {
    schoolId: school?.schoolId,
    schoolName: school?.schoolName || "School",
    status,
    verifierUserName: school?.verifierUserName || school?.verifierName || "",
    fill: getSchoolStatusColor(status),
    tone: getSchoolStatusTone(status),
  };
}

export function truncateMapLabel(label, maxLength = 14) {
  const value = (label || "").trim();
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

export function splitMapLabel(label, maxLineLength = 12) {
  const value = (label || "").trim();
  if (value.length <= maxLineLength) return [value];

  const words = value.split(/\s+/);
  const lines = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxLineLength) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word.length > maxLineLength ? truncateMapLabel(word, maxLineLength) : word;
    }
  });

  if (current) lines.push(current);
  return lines.slice(0, 2);
}

export const SCHOOL_LEGEND_STOPS = [
  { label: "Completed", color: "#059669" },
  { label: "In progress", color: "#3b82f6" },
  { label: "Pending", color: "#f59e0b" },
  { label: "Not allocated", color: "#94a3b8" },
];
