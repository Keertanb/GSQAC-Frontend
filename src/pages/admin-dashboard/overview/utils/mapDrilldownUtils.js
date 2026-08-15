import { Delaunay } from "d3-delaunay";
import {
  geoBounds,
  geoCentroid,
  geoContains,
  geoMercator,
  geoPath,
} from "d3-geo";
import polygonClipping from "polygon-clipping";
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

export function getBlockBounds(block) {
  if (!block) return null;
  return [
    [block.x, block.y],
    [block.x + block.width, block.y + block.height],
  ];
}

/**
 * Scale + translate so a block cell fills the map viewport (zoom mode).
 */
export function computeBlockZoomTransform(
  block,
  viewportWidth,
  viewportHeight,
  inset = 18,
  maxScale = 10,
) {
  if (!block?.width || !block?.height) {
    return { scale: 1, tx: 0, ty: 0 };
  }

  const padding = 28;
  const availableWidth = viewportWidth - padding * 2;
  const availableHeight = viewportHeight - padding * 2;
  const scale = Math.min(
    availableWidth / block.width,
    availableHeight / block.height,
    maxScale,
  );

  const blockCenterX = block.x + block.width / 2;
  const blockCenterY = block.y + block.height / 2;
  const viewportCenterX = viewportWidth / 2;
  const viewportCenterY = viewportHeight / 2;

  return {
    scale,
    tx: viewportCenterX - blockCenterX * scale,
    ty: viewportCenterY - blockCenterY * scale,
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
      cx: innerX + col * (cellWidth + gap) + cellWidth / 2,
      cy: innerY + row * (cellHeight + gap) + cellHeight / 2,
    };
  });
}

const SCHOOL_STATUS_LABELS = {
  submitted: "Completed",
  completed: "Completed",
  inprogress: "Started",
  started: "Started",
  notstarted: "Pending",
  pending: "Pending",
};

const SCHOOL_STATUS_COLORS = {
  completed: "#059669",
  submitted: "#059669",
  started: "#3b82f6",
  inprogress: "#3b82f6",
  pending: "#f59e0b",
  notstarted: "#f59e0b",
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
  if (key === "completed" || key === "submitted") return "excellent";
  if (key === "inprogress" || key === "started") return "good";
  if (key === "pending" || key === "notstarted") return "moderate";
  return "none";
}

export function formatSchoolActivityDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export function buildSchoolStats(school) {
  const rawStatus = school?.selfAssessmentStatus || "Not Started";
  const status =
    SCHOOL_STATUS_LABELS[normalizeSchoolStatus(rawStatus)] || rawStatus;

  return {
    schoolId: school?.schoolId,
    schoolName: school?.schoolName || "School",
    status,
    managementName: school?.schoolManagementName || school?.managementName || "",
    categoryName: school?.schoolCategoryName || school?.schoolCategory || "",
    lowerClass: school?.lowerClass,
    upperClass: school?.upperClass,
    districtName: school?.districtName || "",
    blockName: school?.blockName || "",
    formsCompleted: Number(school?.selfAssessmentsCompleted) || 0,
    formsTotal: Number(school?.selfAssessmentsTotal) || 0,
    lastUpdated: formatSchoolActivityDate(school?.selfAssessmentLastUpdated),
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
  { label: "Started", color: "#3b82f6" },
  { label: "Pending", color: "#f59e0b" },
];

const NORMALIZED_BOUNDS = [
  [0, 0],
  [1, 1],
];

function normalizedToLatLng(x, y, geoFeature) {
  const [[minLng, minLat], [maxLng, maxLat]] = geoBounds(geoFeature);
  const lat = maxLat - y * (maxLat - minLat);
  const lng = minLng + x * (maxLng - minLng);
  return [lat, lng];
}

function ensureInside(feature, lng, lat) {
  if (geoContains(feature, [lng, lat])) {
    return [lng, lat];
  }

  const centroid = geoCentroid(feature);
  for (let step = 0.05; step <= 1; step += 0.05) {
    const nextLng = centroid[0] + (lng - centroid[0]) * (1 - step);
    const nextLat = centroid[1] + (lat - centroid[1]) * (1 - step);
    if (geoContains(feature, [nextLng, nextLat])) {
      return [nextLng, nextLat];
    }
  }

  return centroid;
}

function getDistrictClipGeometry(geoFeature) {
  const geometry = geoFeature?.geometry;
  if (!geometry) return null;

  if (geometry.type === "Polygon") {
    return [geometry.coordinates];
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates;
  }

  return null;
}

function pickLargestClipRing(clipped) {
  let largest = null;

  clipped.forEach((polygon) => {
    const ring = polygon?.[0];
    if (!ring || ring.length < 3) return;
    if (!largest || ring.length > largest.length) {
      largest = ring;
    }
  });

  return largest;
}

function ringToLatLngBounds(ring) {
  const lats = ring.map((point) => point[0]);
  const lngs = ring.map((point) => point[1]);
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ];
}

const BLOCK_PROJECT_SIZE = 720;

/**
 * Voronoi tessellation clipped to the district polygon — blocks fill the real district shape.
 */
function layoutGeoBlockRectangles(items, geoFeature, padding = 0.04, gap = 0.006) {
  const cells = layoutTreemapCells(items, NORMALIZED_BOUNDS, padding, gap);

  return cells.map((cell) => {
    const nw = normalizedToLatLng(cell.x, cell.y, geoFeature);
    const se = normalizedToLatLng(cell.x + cell.width, cell.y + cell.height, geoFeature);
    const south = Math.min(nw[0], se[0]);
    const north = Math.max(nw[0], se[0]);
    const west = Math.min(nw[1], se[1]);
    const east = Math.max(nw[1], se[1]);
    const polygon = [
      [south, west],
      [south, east],
      [north, east],
      [north, west],
    ];

    return {
      ...cell,
      polygon,
      latLngBounds: [
        [south, west],
        [north, east],
      ],
      center: [(south + north) / 2, (west + east) / 2],
    };
  });
}

export function layoutGeoBlockPolygons(items, geoFeature, padding = 0.06, gap = 0.01) {
  if (!items.length || !geoFeature) return [];

  const districtClipGeom = getDistrictClipGeometry(geoFeature);
  if (!districtClipGeom) {
    return layoutGeoBlockRectangles(items, geoFeature, padding, gap);
  }

  const projection = geoMercator().fitExtent(
    [
      [24, 24],
      [BLOCK_PROJECT_SIZE - 24, BLOCK_PROJECT_SIZE - 24],
    ],
    geoFeature,
  );
  const path = geoPath(projection);
  const [[x0, y0], [x1, y1]] = path.bounds(geoFeature);

  const treemapCells = layoutTreemapCells(items, NORMALIZED_BOUNDS, padding, gap);
  const seeds = treemapCells.map((cell) => {
    const centerX = cell.x + cell.width / 2;
    const centerY = cell.y + cell.height / 2;
    let [lat, lng] = normalizedToLatLng(centerX, centerY, geoFeature);
    [lng, lat] = ensureInside(geoFeature, lng, lat);
    const projected = projection([lng, lat]);

    return {
      ...cell,
      lng,
      lat,
      x: projected?.[0] ?? 0,
      y: projected?.[1] ?? 0,
    };
  });

  if (seeds.length === 1) {
    const outerRing = districtClipGeom[0]?.[0] || [];
    const ring = outerRing.map(([lng, lat]) => [lat, lng]);
    const latLngBounds = ringToLatLngBounds(ring);

    return [
      {
        ...seeds[0],
        polygon: ring,
        latLngBounds,
        center: [
          (latLngBounds[0][0] + latLngBounds[1][0]) / 2,
          (latLngBounds[0][1] + latLngBounds[1][1]) / 2,
        ],
      },
    ];
  }

  const delaunay = Delaunay.from(seeds.map((seed) => [seed.x, seed.y]));
  const voronoi = delaunay.voronoi([x0, y0, x1, y1]);

  return seeds
    .map((seed, index) => {
      const cellPolygon = voronoi.cellPolygon(index);
      if (!cellPolygon || cellPolygon.length < 3) return null;

      const voronoiRingLngLat = cellPolygon
        .map(([x, y]) => projection.invert([x, y]))
        .filter(Boolean);

      if (voronoiRingLngLat.length < 3) return null;

      const closedVoronoiRing = [...voronoiRingLngLat, voronoiRingLngLat[0]];
      let clipped;

      try {
        clipped = polygonClipping.intersection(districtClipGeom, [
          closedVoronoiRing,
        ]);
      } catch {
        return null;
      }

      const clippedRing = pickLargestClipRing(clipped);
      if (!clippedRing) return null;

      const ring = clippedRing.map(([lng, lat]) => [lat, lng]);
      if (ring.length < 3) return null;

      const latLngBounds = ringToLatLngBounds(ring);

      return {
        ...seed,
        polygon: ring,
        latLngBounds,
        center: [(latLngBounds[0][0] + latLngBounds[1][0]) / 2, (latLngBounds[0][1] + latLngBounds[1][1]) / 2],
      };
    })
    .filter(Boolean);
}

export function layoutGeoBlockCells(items, geoFeature, padding = 0.04, gap = 0.006) {
  return layoutGeoBlockPolygons(items, geoFeature, padding, gap);
}

export function layoutGeoSchoolMarkers(items, blockCell, padding = 0.08, gap = 0.015) {
  if (!items.length || !blockCell?.latLngBounds) return [];

  const [[south, west], [north, east]] = blockCell.latLngBounds;
  const polygon = blockCell.polygon || null;

  const markers = layoutSchoolMarkers(
    items,
    NORMALIZED_BOUNDS,
    padding,
    gap,
  );

  const pointInsideBlock = (lat, lng) => {
    if (!polygon || polygon.length < 3) return true;
    const feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [polygon.map(([plat, plng]) => [plng, plat])],
      },
    };
    return geoContains(feature, [lng, lat]);
  };

  return markers
    .map((marker) => {
      const normX = marker.cx ?? marker.x + marker.width / 2;
      const normY = marker.cy ?? marker.y + marker.height / 2;
      let lat = north - normY * (north - south);
      let lng = west + normX * (east - west);

      if (!pointInsideBlock(lat, lng) && blockCell.center) {
        lat = blockCell.center[0];
        lng = blockCell.center[1];
      }

      return {
        ...marker,
        latLng: [lat, lng],
      };
    })
    .filter((marker) => pointInsideBlock(marker.latLng[0], marker.latLng[1]));
}

export function getFeatureLatLngBounds(geoFeature) {
  if (!geoFeature) return null;
  const [[minLng, minLat], [maxLng, maxLat]] = geoBounds(geoFeature);
  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

export function getGujaratFitBounds(geoJson) {
  const features = geoJson?.features || [];
  if (!features.length) {
    return [
      [20.1, 68.2],
      [24.7, 74.4],
    ];
  }

  let minLat = Infinity;
  let minLng = Infinity;
  let maxLat = -Infinity;
  let maxLng = -Infinity;

  features.forEach((feature) => {
    const [[lng0, lat0], [lng1, lat1]] = geoBounds(feature);
    minLat = Math.min(minLat, lat0);
    minLng = Math.min(minLng, lng0);
    maxLat = Math.max(maxLat, lat1);
    maxLng = Math.max(maxLng, lng1);
  });

  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}
