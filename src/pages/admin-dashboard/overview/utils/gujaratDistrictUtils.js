const ALIASES = {
  ahmedabad: ["ahmedabad", "ahmadabad"],
  amreli: ["amreli"],
  anand: ["anand"],
  aravalli: ["aravalli"],
  banaskantha: ["banaskantha", "banaskantha"],
  bharuch: ["bharuch", "broach"],
  bhavnagar: ["bhavnagar"],
  botad: ["botad"],
  chhotaudepur: ["chhotaudepur", "chhotaudaipur", "chhotaudaipur"],
  dahod: ["dahod"],
  dang: ["dang", "thedangs"],
  devbhumidwarka: ["devbhumidwarka", "devbhoomidwarka", "dwarka"],
  gandhinagar: ["gandhinagar"],
  girsomnath: ["girsomnath", "girsomnath"],
  jamnagar: ["jamnagar"],
  junagadh: ["junagadh", "junagarh"],
  kheda: ["kheda"],
  kutch: ["kutch", "kachchh", "kachch"],
  mahisagar: ["mahisagar"],
  mehsana: ["mehsana", "mahesana"],
  morbi: ["morbi"],
  narmada: ["narmada"],
  navsari: ["navsari"],
  panchmahal: ["panchmahal", "panchmahals"],
  patan: ["patan"],
  porbandar: ["porbandar"],
  rajkot: ["rajkot"],
  sabarkantha: ["sabarkantha", "sabarakantha"],
  surat: ["surat"],
  surendranagar: ["surendranagar"],
  tapi: ["tapi"],
  vadodara: ["vadodara", "baroda"],
  valsad: ["valsad", "bulsar"],
};

export function normalizeDistrictName(name) {
  return (name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function matchDistrictKey(name) {
  const normalized = normalizeDistrictName(name);
  if (!normalized) return null;

  for (const [key, aliases] of Object.entries(ALIASES)) {
    if (normalized === key || aliases.includes(normalized)) {
      return key;
    }
  }

  return normalized;
}

export function findDistrictByName(districts, name) {
  const key = matchDistrictKey(name);
  if (!key) return null;

  return (
    districts.find((district) => {
      const districtKey = matchDistrictKey(district.name || district.districtName || district.label);
      return districtKey === key;
    }) || null
  );
}

const MAP_COLOR_STOPS = [
  { rate: 0, color: "#ef4444" },
  { rate: 25, color: "#f97316" },
  { rate: 50, color: "#eab308" },
  { rate: 75, color: "#22c55e" },
  { rate: 100, color: "#059669" },
];

const NO_DATA_COLOR = "#e2e8f0";
const NO_DATA_STROKE = "#94a3b8";

function hexToRgb(hex) {
  const value = parseInt(hex.replace("#", ""), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b]
    .map((channel) => Math.max(0, Math.min(255, channel)).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mixColors(from, to, amount) {
  const [r1, g1, b1] = hexToRgb(from);
  const [r2, g2, b2] = hexToRgb(to);
  return rgbToHex(
    r1 + (r2 - r1) * amount,
    g1 + (g2 - g1) * amount,
    b1 + (b2 - b1) * amount,
  );
}

export const MAP_LEGEND_STOPS = [
  { label: "80%+", color: "#059669" },
  { label: "60–79%", color: "#22c55e" },
  { label: "30–59%", color: "#eab308" },
  { label: "Below 30%", color: "#ef4444" },
  { label: "No data", color: NO_DATA_COLOR },
];

export function getCompletionColor(rate, hasData) {
  if (!hasData) return NO_DATA_COLOR;

  const value = Math.max(0, Math.min(100, Number(rate) || 0));

  for (let index = 1; index < MAP_COLOR_STOPS.length; index += 1) {
    const prev = MAP_COLOR_STOPS[index - 1];
    const next = MAP_COLOR_STOPS[index];
    if (value <= next.rate) {
      const span = next.rate - prev.rate || 1;
      const amount = (value - prev.rate) / span;
      return mixColors(prev.color, next.color, amount);
    }
  }

  return MAP_COLOR_STOPS[MAP_COLOR_STOPS.length - 1].color;
}

export function getCompletionTone(rate, hasData) {
  if (!hasData) return "none";
  if (rate >= 80) return "excellent";
  if (rate >= 60) return "good";
  if (rate >= 30) return "moderate";
  return "low";
}

export function getDistrictStroke(isSelected, isHovered, hasData) {
  if (isSelected) return "#1e3a8a";
  if (isHovered) return "#334155";
  return hasData ? "#ffffff" : NO_DATA_STROKE;
}

export function pct(num, den) {
  return den > 0 ? Math.round((num / den) * 100) : 0;
}

export function buildDistrictMapStats(districtBreakdown, districts) {
  const statsByKey = {};

  districtBreakdown.forEach((item) => {
    const key = matchDistrictKey(item.districtName);
    if (!key) return;

    const allocated = item.allocatedSchools ?? 0;
    const completed = item.completedVerification ?? 0;
    const pending = item.pendingVerification ?? 0;

    statsByKey[key] = {
      districtId: item.districtId,
      districtName: item.districtName,
      allocated,
      completed,
      pending,
      verifiers: item.activeVerifiers ?? 0,
      completionRate: pct(completed, completed + pending),
      hasData: allocated > 0 || completed > 0 || pending > 0,
    };
  });

  districts.forEach((district) => {
    const key = matchDistrictKey(district.name);
    if (!key || statsByKey[key]) return;

    statsByKey[key] = {
      districtId: district.value,
      districtName: district.name,
      allocated: 0,
      completed: 0,
      pending: 0,
      verifiers: 0,
      completionRate: 0,
      hasData: false,
    };
  });

  return statsByKey;
}
