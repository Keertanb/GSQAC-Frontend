import React, { useMemo, useState, useCallback } from "react";
import { geoPath, geoMercator } from "d3-geo";
import gujaratDistricts from "../data/gujaratDistricts.json";
import {
  buildDistrictMapStats,
  getCompletionColor,
  getCompletionTone,
  getDistrictStroke,
  MAP_LEGEND_STOPS,
  matchDistrictKey,
} from "../utils/gujaratDistrictUtils";

const MAP_WIDTH = 480;
const MAP_HEIGHT = 560;
const MAP_INSET = 18;

function getFeatureKey(feature) {
  const names = [feature?.properties?.name, feature?.properties?.varname]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","));

  for (const name of names) {
    const key = matchDistrictKey(name.trim());
    if (key) return key;
  }

  return matchDistrictKey(feature?.properties?.name);
}

function formatDistrictName(name) {
  return (name || "")
    .replace("Banas Kantha", "Banaskantha")
    .replace("Sabar Kantha", "Sabarkantha")
    .replace("Panch Mahals", "Panchmahal")
    .replace("The Dangs", "Dang")
    .replace("Ahmadabad", "Ahmedabad")
    .replace("Mahesana", "Mehsana")
    .replace("Kachchh", "Kutch");
}

export function GujaratDistrictMap({
  districts = [],
  districtBreakdown = [],
  selectedDistrictId = "",
  onDistrictSelect,
  onClearSelection,
}) {
  const [hoveredKey, setHoveredKey] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const statsByKey = useMemo(
    () => buildDistrictMapStats(districtBreakdown, districts),
    [districtBreakdown, districts],
  );

  const selectedKey = useMemo(() => {
    if (!selectedDistrictId) return null;
    const fromStats = Object.entries(statsByKey).find(
      ([, stats]) => String(stats.districtId) === String(selectedDistrictId),
    );
    if (fromStats) return fromStats[0];

    const district = districts.find(
      (item) => String(item.value) === String(selectedDistrictId),
    );
    return district ? matchDistrictKey(district.name) : null;
  }, [selectedDistrictId, statsByKey, districts]);

  const mapRegions = useMemo(() => {
    const projection = geoMercator().fitExtent(
      [
        [MAP_INSET, MAP_INSET],
        [MAP_WIDTH - MAP_INSET, MAP_HEIGHT - MAP_INSET],
      ],
      gujaratDistricts,
    );
    const generator = geoPath(projection);

    return gujaratDistricts.features.map((feature) => {
      const key = getFeatureKey(feature);
      const centroid = generator.centroid(feature);

      return {
        key,
        feature,
        path: generator(feature) || "",
        x: centroid[0],
        y: centroid[1],
        stats: statsByKey[key] || {
          districtId: null,
          districtName: feature.properties?.name,
          allocated: 0,
          completed: 0,
          pending: 0,
          verifiers: 0,
          completionRate: 0,
          hasData: false,
        },
      };
    });
  }, [statsByKey]);

  const handleRegionClick = useCallback(
    (region) => {
      const districtId = region.stats.districtId;
      if (!districtId) {
        const matched = districts.find(
          (item) => matchDistrictKey(item.name) === region.key,
        );
        if (matched) {
          onDistrictSelect?.(String(matched.value));
        }
        return;
      }
      onDistrictSelect?.(String(districtId));
    },
    [districts, onDistrictSelect],
  );

  const activeKey = hoveredKey || selectedKey;
  const activeRegion = mapRegions.find((region) => region.key === activeKey);

  return (
    <div className="ado-map-section">
      <div className="ado-map-header">
        <div className="ado-map-header-text">
          <p className="ado-section-eyebrow">Geographic view</p>
          <h2 className="ado-section-title">Gujarat district map</h2>
          <p className="ado-map-subtitle">
            {selectedDistrictId
              ? "Explore another district or return to statewide view"
              : "District colors show verification completion — click to drill down"}
          </p>
        </div>
        <div className="ado-map-header-actions">
          <span className="ado-map-chip">
            {districtBreakdown?.length || 0} districts tracked
          </span>
          {selectedDistrictId ? (
            <button
              type="button"
              className="ado-map-back-btn"
              onClick={() => onClearSelection?.()}
            >
              ← Statewide view
            </button>
          ) : null}
        </div>
      </div>

      <div className="ado-map-layout">
        <div className="ado-map-canvas-wrap">
          <svg
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            className="ado-map-svg"
            role="img"
            aria-label="Interactive map of Gujarat districts"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="adoMapOcean" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#bfdbfe" />
                <stop offset="40%" stopColor="#dbeafe" />
                <stop offset="100%" stopColor="#f0f9ff" />
              </linearGradient>
              <linearGradient id="adoMapLegendGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="25%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="75%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <filter id="adoMapDistrictGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1e40af" floodOpacity="0.35" />
              </filter>
              <filter id="adoMapSoftShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.12" />
              </filter>
            </defs>

            <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#adoMapOcean)" rx="14" />

            <g filter="url(#adoMapSoftShadow)">
              {mapRegions.map((region) => {
                if (!region.path) return null;

                const isSelected = selectedKey === region.key;
                const isHovered = hoveredKey === region.key;
                const fill = getCompletionColor(
                  region.stats.completionRate,
                  region.stats.hasData,
                );
                const stroke = getDistrictStroke(
                  isSelected,
                  isHovered,
                  region.stats.hasData,
                );

                return (
                  <path
                    key={region.key || region.feature.properties?.name}
                    d={region.path}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isSelected ? 2.2 : isHovered ? 1.6 : 1}
                    strokeLinejoin="round"
                    opacity={
                      selectedKey && !isSelected && !isHovered ? 0.62 : 1
                    }
                    className={`ado-map-region ${isHovered ? "ado-map-region--hover" : ""} ${
                      isSelected ? "ado-map-region--selected" : ""
                    }`}
                    filter={isSelected ? "url(#adoMapDistrictGlow)" : undefined}
                    onMouseEnter={(event) => {
                      setHoveredKey(region.key);
                      setTooltip({
                        name: formatDistrictName(
                          region.stats.districtName || region.feature.properties?.name,
                        ),
                        rate: region.stats.completionRate,
                        tone: getCompletionTone(
                          region.stats.completionRate,
                          region.stats.hasData,
                        ),
                        allocated: region.stats.allocated,
                        completed: region.stats.completed,
                        pending: region.stats.pending,
                        x: event.clientX,
                        y: event.clientY,
                      });
                    }}
                    onMouseMove={(event) => {
                      setTooltip((prev) =>
                        prev ? { ...prev, x: event.clientX, y: event.clientY } : prev,
                      );
                    }}
                    onMouseLeave={() => {
                      setHoveredKey(null);
                      setTooltip(null);
                    }}
                    onClick={() => handleRegionClick(region)}
                  />
                );
              })}
            </g>

            {(hoveredKey || selectedKey) && activeRegion?.path ? (
              <text
                x={activeRegion.x}
                y={activeRegion.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="ado-map-label ado-map-label--active"
                pointerEvents="none"
              >
                {formatDistrictName(
                  activeRegion.stats.districtName || activeRegion.feature.properties?.name,
                )}
              </text>
            ) : null}
          </svg>

          <div className="ado-map-legend-bar" aria-hidden>
            <span>Low</span>
            <div className="ado-map-legend-bar-track">
              <div className="ado-map-legend-bar-fill" />
            </div>
            <span>High</span>
          </div>

          {tooltip ? (
            <div
              className={`ado-map-tooltip ado-map-tooltip--${tooltip.tone}`}
              style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
            >
              <p className="ado-map-tooltip-title">{tooltip.name}</p>
              <p className="ado-map-tooltip-rate">
                <span>Verification</span>
                <strong>{tooltip.rate}%</strong>
              </p>
              <div className="ado-map-tooltip-grid">
                <span>Allocated <strong>{tooltip.allocated}</strong></span>
                <span>Done <strong>{tooltip.completed}</strong></span>
                <span>Pending <strong>{tooltip.pending}</strong></span>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="ado-map-side">
          <div className="ado-map-legend">
            <h3>Verification completion</h3>
            <div className="ado-map-legend-scale">
              <div className="ado-map-legend-gradient" />
              <div className="ado-map-legend-scale-labels">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            <ul>
              {MAP_LEGEND_STOPS.map((item) => (
                <li key={item.label}>
                  <span style={{ background: item.color }} />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          {activeRegion ? (
            <div className="ado-map-focus-card">
              <div className="ado-map-focus-top">
                <p className="ado-map-focus-label">
                  {selectedDistrictId ? "Selected district" : "Preview"}
                </p>
                <span
                  className={`ado-map-rate-pill ado-map-rate-pill--${getCompletionTone(
                    activeRegion.stats.completionRate,
                    activeRegion.stats.hasData,
                  )}`}
                >
                  {activeRegion.stats.hasData
                    ? `${activeRegion.stats.completionRate}%`
                    : "No data"}
                </span>
              </div>
              <h3>
                {formatDistrictName(
                  activeRegion.stats.districtName || activeRegion.feature.properties?.name,
                )}
              </h3>
              <div className="ado-map-focus-progress">
                <div
                  className="ado-map-focus-progress-fill"
                  style={{
                    width: `${Math.min(100, activeRegion.stats.completionRate)}%`,
                    background: getCompletionColor(
                      activeRegion.stats.completionRate,
                      activeRegion.stats.hasData,
                    ),
                  }}
                />
              </div>
              <div className="ado-map-focus-stats">
                <div>
                  <span>{activeRegion.stats.allocated}</span>
                  <small>Allocated</small>
                </div>
                <div>
                  <span>{activeRegion.stats.completed}</span>
                  <small>Completed</small>
                </div>
                <div>
                  <span>{activeRegion.stats.pending}</span>
                  <small>Pending</small>
                </div>
                <div>
                  <span>{activeRegion.stats.verifiers}</span>
                  <small>Verifiers</small>
                </div>
              </div>
              {!selectedDistrictId ? (
                <button
                  type="button"
                  className="ado-map-drill-btn"
                  onClick={() => handleRegionClick(activeRegion)}
                >
                  View district analytics
                </button>
              ) : null}
            </div>
          ) : (
            <div className="ado-map-focus-card ado-map-focus-card--empty">
              <div className="ado-map-empty-icon" aria-hidden>🗺️</div>
              <p>Hover or tap a district to preview verification metrics.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
