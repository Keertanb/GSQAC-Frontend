import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
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
import {
  buildBlockStats,
  buildSchoolStats,
  computeBlockZoomTransform,
  getBlockBounds,
  layoutSchoolMarkers,
  layoutTreemapCells,
  mergeBlockBreakdown,
  SCHOOL_LEGEND_STOPS,
  splitMapLabel,
  truncateMapLabel,
} from "../utils/mapDrilldownUtils";
import {
  useGetDistrictWiseBlocksQuery,
  useGetSchoolAssessmentStatusListQuery,
  useGetSchoolListQuery,
} from "../../../../services/adminService";

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

function getMapSubtitle(mapLevel, districtName, blockName) {
  if (mapLevel === "schools") {
    return `Zoomed into ${blockName || "block"} — each dot is a school`;
  }
  if (mapLevel === "blocks") {
    return `Blocks in ${districtName || "district"} — click a block to zoom in`;
  }
  return "District colors show verification completion — click a district to drill down";
}

export function GujaratDistrictMap({
  districts = [],
  districtBreakdown = [],
  blockBreakdown = [],
  selectedDistrictId = "",
  onDistrictSelect,
  onClearSelection,
}) {
  const [hoveredDistrictKey, setHoveredDistrictKey] = useState(null);
  const [hoveredBlockId, setHoveredBlockId] = useState(null);
  const [hoveredSchoolId, setHoveredSchoolId] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [mapLevel, setMapLevel] = useState("state");
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const prevDistrictIdRef = useRef(selectedDistrictId);

  const { data: masterBlocksData } = useGetDistrictWiseBlocksQuery(
    selectedDistrictId ? Number(selectedDistrictId) : undefined,
  );
  const masterBlocks = masterBlocksData?.data || [];

  const mergedBlocks = useMemo(
    () => mergeBlockBreakdown(blockBreakdown, masterBlocks),
    [blockBreakdown, masterBlocks],
  );

  const { data: schoolsListData, isLoading: isLoadingSchoolList } =
    useGetSchoolListQuery(
      {
        blockId: selectedBlockId ? Number(selectedBlockId) : undefined,
        page: 0,
        limit: 500,
      },
      mapLevel === "schools" && !!selectedBlockId,
    );

  const { data: schoolsAssessmentData, isLoading: isLoadingAssessment } =
    useGetSchoolAssessmentStatusListQuery(
      {
        blockId: selectedBlockId ? Number(selectedBlockId) : undefined,
        page: 0,
        limit: 500,
      },
      mapLevel === "schools" &&
        !!selectedBlockId &&
        !isLoadingSchoolList &&
        !(schoolsListData?.data?.rows?.length > 0),
    );

  const schools = useMemo(() => {
    const fromList = schoolsListData?.data?.rows || [];
    if (fromList.length > 0) return fromList;
    return schoolsAssessmentData?.data?.rows || [];
  }, [schoolsListData, schoolsAssessmentData]);

  const isLoadingSchools = isLoadingSchoolList || isLoadingAssessment;

  useEffect(() => {
    if (String(prevDistrictIdRef.current) === String(selectedDistrictId)) {
      return;
    }

    prevDistrictIdRef.current = selectedDistrictId;

    if (!selectedDistrictId) {
      setMapLevel("state");
      setSelectedBlockId("");
      return;
    }

    setSelectedBlockId("");
    setMapLevel((current) => {
      if (current === "state" || current === "schools") return "blocks";
      return current;
    });
  }, [selectedDistrictId]);

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

  const mapModel = useMemo(() => {
    const projection = geoMercator().fitExtent(
      [
        [MAP_INSET, MAP_INSET],
        [MAP_WIDTH - MAP_INSET, MAP_HEIGHT - MAP_INSET],
      ],
      gujaratDistricts,
    );
    const generator = geoPath(projection);

    const regions = gujaratDistricts.features.map((feature) => {
      const key = getFeatureKey(feature);
      const centroid = generator.centroid(feature);

      return {
        key,
        feature,
        path: generator(feature) || "",
        bounds: generator.bounds(feature),
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

    const selectedRegion =
      regions.find((region) => region.key === selectedKey) || null;

    const blockItems = mergedBlocks.map((block) => buildBlockStats(block));

    const blockCells = selectedRegion
      ? layoutTreemapCells(blockItems, selectedRegion.bounds, 12, 5)
      : [];

    const schoolItems = schools.map((school) => buildSchoolStats(school));

    const selectedBlockCell = blockCells.find(
      (cell) => String(cell.blockId) === String(selectedBlockId),
    );

    const blockBounds = getBlockBounds(selectedBlockCell);
    const schoolCells =
      mapLevel === "schools" && blockBounds
        ? layoutSchoolMarkers(schoolItems, blockBounds, 8, 2)
        : [];

    const zoomTransform =
      mapLevel === "schools" && selectedBlockCell
        ? computeBlockZoomTransform(
            selectedBlockCell,
            MAP_WIDTH,
            MAP_HEIGHT,
            MAP_INSET,
          )
        : null;

    return {
      regions,
      selectedRegion,
      blockCells,
      schoolCells,
      selectedBlockCell,
      blockBounds,
      zoomTransform,
      generator,
    };
  }, [statsByKey, mergedBlocks, schools, selectedKey, selectedBlockId, mapLevel]);

  const selectedDistrictName = useMemo(() => {
    if (!selectedDistrictId) return "";
    const district = districts.find(
      (item) => String(item.value) === String(selectedDistrictId),
    );
    return formatDistrictName(
      district?.name || mapModel.selectedRegion?.stats?.districtName,
    );
  }, [selectedDistrictId, districts, mapModel.selectedRegion]);

  const selectedBlockName = useMemo(() => {
    const block = mergedBlocks.find(
      (item) => String(item.blockId) === String(selectedBlockId),
    );
    return block?.blockName || "";
  }, [mergedBlocks, selectedBlockId]);

  const handleDistrictClick = useCallback(
    (region) => {
      let nextDistrictId = region.stats.districtId;

      if (!nextDistrictId) {
        const matched = districts.find(
          (item) => matchDistrictKey(item.name) === region.key,
        );
        if (!matched) return;
        nextDistrictId = matched.value;
      }

      const districtValue = String(nextDistrictId);
      prevDistrictIdRef.current = districtValue;
      onDistrictSelect?.(districtValue);
      setMapLevel("blocks");
      setSelectedBlockId("");
    },
    [districts, onDistrictSelect],
  );

  const handleBlockClick = useCallback((block) => {
    if (selectedDistrictId) {
      prevDistrictIdRef.current = selectedDistrictId;
    }
    setSelectedBlockId(String(block.blockId));
    setMapLevel("schools");
    setTooltip(null);
    setHoveredBlockId(null);
  }, [selectedDistrictId]);

  const handleBack = useCallback(() => {
    if (mapLevel === "schools") {
      setMapLevel("blocks");
      setSelectedBlockId("");
      setTooltip(null);
      return;
    }

    if (mapLevel === "blocks") {
      setMapLevel("state");
      setSelectedBlockId("");
      onClearSelection?.();
    }
  }, [mapLevel, onClearSelection]);

  const activeDistrictKey =
    mapLevel === "state" ? hoveredDistrictKey || selectedKey : selectedKey;
  const activeDistrictRegion = mapModel.regions.find(
    (region) => region.key === activeDistrictKey,
  );

  const activeBlock =
    mapModel.blockCells.find(
      (block) => String(block.blockId) === String(hoveredBlockId || selectedBlockId),
    ) || null;

  const activeSchool =
    mapModel.schoolCells.find(
      (school) => String(school.schoolId) === String(hoveredSchoolId),
    ) || null;

  const showStateDistricts = mapLevel === "state";
  const showBlockDrill = mapLevel === "blocks" && mapModel.selectedRegion;
  const showSchoolDrill = mapLevel === "schools" && mapModel.selectedRegion;

  const breadcrumb = [
    { label: "Gujarat", active: mapLevel === "state" },
    selectedDistrictName
      ? { label: selectedDistrictName, active: mapLevel === "blocks" }
      : null,
    selectedBlockName
      ? { label: selectedBlockName, active: mapLevel === "schools" }
      : null,
  ].filter(Boolean);

  const clipId = selectedKey
    ? `ado-map-district-clip-${selectedKey}`
    : "ado-map-district-clip";

  const zoomTransformString = mapModel.zoomTransform
    ? `translate(${mapModel.zoomTransform.tx} ${mapModel.zoomTransform.ty}) scale(${mapModel.zoomTransform.scale})`
    : undefined;

  return (
    <div className="ado-map-section">
      <div className="ado-map-header">
        <div className="ado-map-header-text">
          <p className="ado-section-eyebrow">Geographic view</p>
          <h2 className="ado-section-title">Gujarat district map</h2>
          <p className="ado-map-subtitle">
            {getMapSubtitle(mapLevel, selectedDistrictName, selectedBlockName)}
          </p>
          {breadcrumb.length > 1 ? (
            <nav className="ado-map-breadcrumb" aria-label="Map drill-down">
              {breadcrumb.map((item, index) => (
                <React.Fragment key={item.label}>
                  {index > 0 ? <span className="ado-map-breadcrumb-sep">/</span> : null}
                  <span
                    className={`ado-map-breadcrumb-item${
                      item.active ? " ado-map-breadcrumb-item--active" : ""
                    }`}
                  >
                    {item.label}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          ) : null}
        </div>
        <div className="ado-map-header-actions">
          <span className="ado-map-chip">
            {mapLevel === "schools"
              ? `${schools.length} schools`
              : mapLevel === "blocks"
                ? `${mergedBlocks.length} blocks`
                : `${districtBreakdown?.length || 0} districts tracked`}
          </span>
          {mapLevel !== "state" ? (
            <button type="button" className="ado-map-back-btn" onClick={handleBack}>
              {mapLevel === "schools" ? "← Back to blocks" : "← Statewide view"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="ado-map-layout">
        <div className={`ado-map-canvas-wrap${showSchoolDrill ? " ado-map-canvas-wrap--zoomed" : ""}`}>
          <svg
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            className="ado-map-svg"
            role="img"
            aria-label="Interactive map of Gujarat districts, blocks, and schools"
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
              <filter id="adoMapBlockShadow" x="-15%" y="-15%" width="130%" height="130%">
                <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0f172a" floodOpacity="0.18" />
              </filter>
              {mapModel.selectedRegion?.path ? (
                <clipPath id={clipId}>
                  <path d={mapModel.selectedRegion.path} />
                </clipPath>
              ) : null}
            </defs>

            <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#adoMapOcean)" rx="14" />

            <g filter="url(#adoMapSoftShadow)">
              {mapModel.regions.map((region) => {
                if (!region.path) return null;

                const isSelected = selectedKey === region.key;
                const isHovered = hoveredDistrictKey === region.key;
                const fill = getCompletionColor(
                  region.stats.completionRate,
                  region.stats.hasData,
                );
                const stroke = getDistrictStroke(
                  isSelected,
                  isHovered,
                  region.stats.hasData,
                );
                const dimmed = showSchoolDrill
                  ? isSelected
                    ? 0.35
                    : 0.1
                  : !showStateDistricts && !isSelected
                    ? 0.18
                    : showStateDistricts && selectedKey && !isSelected && !isHovered
                      ? 0.62
                      : 1;

                return (
                  <path
                    key={region.key || region.feature.properties?.name}
                    d={region.path}
                    fill={showStateDistricts ? fill : "#e2e8f0"}
                    stroke={showStateDistricts ? stroke : isSelected ? "#1e3a8a" : "#cbd5e1"}
                    strokeWidth={isSelected ? 2.4 : isHovered ? 1.6 : 1}
                    strokeLinejoin="round"
                    opacity={dimmed}
                    className={`ado-map-region ${isHovered ? "ado-map-region--hover" : ""} ${
                      isSelected ? "ado-map-region--selected" : ""
                    }`}
                    filter={isSelected ? "url(#adoMapDistrictGlow)" : undefined}
                    onMouseEnter={
                      showStateDistricts
                        ? (event) => {
                            setHoveredDistrictKey(region.key);
                            setTooltip({
                              type: "district",
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
                          }
                        : undefined
                    }
                    onMouseMove={
                      showStateDistricts
                        ? (event) => {
                            setTooltip((prev) =>
                              prev ? { ...prev, x: event.clientX, y: event.clientY } : prev,
                            );
                          }
                        : undefined
                    }
                    onMouseLeave={
                      showStateDistricts
                        ? () => {
                            setHoveredDistrictKey(null);
                            setTooltip(null);
                          }
                        : undefined
                    }
                    onClick={showStateDistricts ? () => handleDistrictClick(region) : undefined}
                    style={{ cursor: showStateDistricts ? "pointer" : "default" }}
                  />
                );
              })}
            </g>

            {showBlockDrill ? (
              <g clipPath={`url(#${clipId})`}>
                <path
                  d={mapModel.selectedRegion.path}
                  fill="#f8fbff"
                  stroke="none"
                  pointerEvents="none"
                />
                {mapModel.blockCells.map((block) => {
                  const isHovered = String(block.blockId) === String(hoveredBlockId);
                  const labelLines = splitMapLabel(
                    block.blockName,
                    block.width > 72 ? 16 : block.width > 48 ? 12 : 8,
                  );
                  const showLabel = block.width > 28 && block.height > 20;
                  const showRate = block.width > 40 && block.height > 32;

                  return (
                    <g key={block.blockId} filter="url(#adoMapBlockShadow)">
                      <rect
                        x={block.x}
                        y={block.y}
                        width={block.width}
                        height={block.height}
                        rx={5}
                        fill={block.fill}
                        stroke={isHovered ? "#1e3a8a" : "rgba(255,255,255,0.95)"}
                        strokeWidth={isHovered ? 2.2 : 1.2}
                        className={`ado-map-block-cell ${isHovered ? "ado-map-block-cell--hover" : ""}`}
                        onMouseEnter={(event) => {
                          setHoveredBlockId(String(block.blockId));
                          setTooltip({
                            type: "block",
                            name: block.blockName,
                            rate: block.completionRate,
                            tone: block.tone,
                            total: block.total,
                            completed: block.completed,
                            pending: block.pending,
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
                          setHoveredBlockId(null);
                          setTooltip(null);
                        }}
                        onClick={() => handleBlockClick(block)}
                      />
                      {showLabel ? (
                        <text
                          x={block.x + block.width / 2}
                          y={block.y + block.height / 2 - (showRate ? 5 : 0)}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="ado-map-block-label"
                          pointerEvents="none"
                        >
                          {labelLines.map((line, lineIndex) => (
                            <tspan
                              key={`${block.blockId}-${lineIndex}`}
                              x={block.x + block.width / 2}
                              dy={lineIndex === 0 ? 0 : 11}
                            >
                              {line}
                            </tspan>
                          ))}
                        </text>
                      ) : null}
                      {showRate ? (
                        <text
                          x={block.x + block.width / 2}
                          y={block.y + block.height / 2 + (showLabel ? 12 : 0)}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="ado-map-block-rate"
                          pointerEvents="none"
                        >
                          {block.hasData ? `${block.completionRate}%` : "—"}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
              </g>
            ) : null}

            {showSchoolDrill && mapModel.selectedBlockCell ? (
              <g
                className="ado-map-zoom-layer"
                transform={zoomTransformString}
              >
                <g clipPath={`url(#${clipId})`}>
                  <path
                    d={mapModel.selectedRegion.path}
                    fill="#eef4ff"
                    stroke="#93c5fd"
                    strokeWidth={1.2}
                    pointerEvents="none"
                  />

                  {mapModel.blockCells.map((block) => {
                    const isSelected =
                      String(block.blockId) === String(selectedBlockId);
                    if (!isSelected) {
                      return (
                        <rect
                          key={`ghost-${block.blockId}`}
                          x={block.x}
                          y={block.y}
                          width={block.width}
                          height={block.height}
                          rx={4}
                          fill="#e2e8f0"
                          opacity={0.35}
                          stroke="#ffffff"
                          strokeWidth={0.8}
                          pointerEvents="none"
                        />
                      );
                    }

                    return (
                      <g key={`zoom-block-${block.blockId}`}>
                        <rect
                          x={block.x}
                          y={block.y}
                          width={block.width}
                          height={block.height}
                          rx={8}
                          fill={block.fill}
                          opacity={0.28}
                          stroke="#1e3a8a"
                          strokeWidth={2.5}
                          pointerEvents="none"
                        />
                        <rect
                          x={block.x + 2}
                          y={block.y + 2}
                          width={Math.max(0, block.width - 4)}
                          height={Math.max(0, block.height - 4)}
                          rx={6}
                          fill="#ffffff"
                          opacity={0.92}
                          stroke="#bfdbfe"
                          strokeWidth={1}
                          pointerEvents="none"
                        />
                      </g>
                    );
                  })}
                </g>

                <g>
                  {isLoadingSchools ? (
                    <text
                      x={
                        mapModel.selectedBlockCell.x +
                        mapModel.selectedBlockCell.width / 2
                      }
                      y={
                        mapModel.selectedBlockCell.y +
                        mapModel.selectedBlockCell.height / 2
                      }
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="ado-map-loading-label"
                    >
                      Loading schools…
                    </text>
                  ) : mapModel.schoolCells.length > 0 ? (
                    mapModel.schoolCells.map((school) => {
                      const radius = Math.max(
                        1.8,
                        Math.min(
                          3.2,
                          Math.min(school.width || 4, school.height || 4) / 3,
                        ),
                      );
                      const cx = school.cx ?? school.x + school.width / 2;
                      const cy = school.cy ?? school.y + school.height / 2;
                      const isHovered =
                        String(school.schoolId) === String(hoveredSchoolId);

                      return (
                        <circle
                          key={school.schoolId}
                          cx={cx}
                          cy={cy}
                          r={isHovered ? radius + 1 : radius}
                          fill={school.fill}
                          stroke={isHovered ? "#0f172a" : "#ffffff"}
                          strokeWidth={isHovered ? 1.2 : 0.7}
                          className="ado-map-school-dot"
                          onMouseEnter={(event) => {
                            setHoveredSchoolId(String(school.schoolId));
                            setTooltip({
                              type: "school",
                              name: school.schoolName,
                              status: school.status,
                              tone: school.tone,
                              verifier: school.verifierUserName,
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
                            setHoveredSchoolId(null);
                            setTooltip(null);
                          }}
                        />
                      );
                    })
                  ) : (
                    <text
                      x={
                        mapModel.selectedBlockCell.x +
                        mapModel.selectedBlockCell.width / 2
                      }
                      y={
                        mapModel.selectedBlockCell.y +
                        mapModel.selectedBlockCell.height / 2
                      }
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="ado-map-loading-label"
                    >
                      No schools in this block
                    </text>
                  )}
                </g>

                <text
                  x={
                    mapModel.selectedBlockCell.x +
                    mapModel.selectedBlockCell.width / 2
                  }
                  y={mapModel.selectedBlockCell.y - 6}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="ado-map-label ado-map-label--active"
                  pointerEvents="none"
                >
                  {truncateMapLabel(selectedBlockName, 28)}
                </text>
              </g>
            ) : null}

            {(showStateDistricts && (hoveredDistrictKey || selectedKey) && activeDistrictRegion?.path) ||
            (showBlockDrill && activeBlock) ? (
              <text
                x={
                  showBlockDrill
                    ? activeBlock.x + activeBlock.width / 2
                    : activeDistrictRegion.x
                }
                y={
                  showBlockDrill
                    ? activeBlock.y - 8
                    : activeDistrictRegion.y
                }
                textAnchor="middle"
                dominantBaseline="middle"
                className="ado-map-label ado-map-label--active"
                pointerEvents="none"
              >
                {showBlockDrill
                  ? truncateMapLabel(activeBlock.blockName, 20)
                  : formatDistrictName(
                      activeDistrictRegion.stats.districtName ||
                        activeDistrictRegion.feature.properties?.name,
                    )}
              </text>
            ) : null}
          </svg>

          <div className="ado-map-legend-bar" aria-hidden>
            <span>{mapLevel === "schools" ? "Status" : "Low"}</span>
            <div className="ado-map-legend-bar-track">
              <div
                className={`ado-map-legend-bar-fill${
                  mapLevel === "schools" ? " ado-map-legend-bar-fill--schools" : ""
                }`}
              />
            </div>
            <span>{mapLevel === "schools" ? "Mix" : "High"}</span>
          </div>

          {tooltip ? (
            <div
              className={`ado-map-tooltip ado-map-tooltip--${tooltip.tone}`}
              style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
            >
              <p className="ado-map-tooltip-title">{tooltip.name}</p>
              {tooltip.type === "district" ? (
                <>
                  <p className="ado-map-tooltip-rate">
                    <span>Verification</span>
                    <strong>{tooltip.rate}%</strong>
                  </p>
                  <div className="ado-map-tooltip-grid">
                    <span>Allocated <strong>{tooltip.allocated}</strong></span>
                    <span>Done <strong>{tooltip.completed}</strong></span>
                    <span>Pending <strong>{tooltip.pending}</strong></span>
                  </div>
                </>
              ) : null}
              {tooltip.type === "block" ? (
                <>
                  <p className="ado-map-tooltip-rate">
                    <span>Completion</span>
                    <strong>{tooltip.rate}%</strong>
                  </p>
                  <div className="ado-map-tooltip-grid">
                    <span>Total <strong>{tooltip.total}</strong></span>
                    <span>Done <strong>{tooltip.completed}</strong></span>
                    <span>Pending <strong>{tooltip.pending}</strong></span>
                  </div>
                </>
              ) : null}
              {tooltip.type === "school" ? (
                <>
                  <p className="ado-map-tooltip-rate">
                    <span>Assessment</span>
                    <strong>{tooltip.status}</strong>
                  </p>
                  {tooltip.verifier ? (
                    <p className="ado-map-tooltip-verifier">
                      Verifier: <strong>{tooltip.verifier}</strong>
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>
          ) : null}

          {mapLevel === "schools" ? (
            <div className="ado-map-school-panel">
              <div className="ado-map-school-panel-header">
                <h4>Schools in {selectedBlockName || "block"}</h4>
                <span>{isLoadingSchools ? "Loading…" : `${schools.length} schools`}</span>
              </div>
              <div className="ado-map-school-list">
                {isLoadingSchools ? (
                  <p className="ado-map-school-list-empty">Loading schools…</p>
                ) : schools.length > 0 ? (
                  schools.map((school) => {
                    const stats = buildSchoolStats(school);
                    const isActive = String(school.schoolId) === String(hoveredSchoolId);
                    return (
                      <button
                        key={school.schoolId}
                        type="button"
                        className={`ado-map-school-row${isActive ? " ado-map-school-row--active" : ""}`}
                        onMouseEnter={() => setHoveredSchoolId(String(school.schoolId))}
                        onMouseLeave={() => setHoveredSchoolId(null)}
                      >
                        <span
                          className="ado-map-school-row-dot"
                          style={{ background: stats.fill }}
                        />
                        <span className="ado-map-school-row-body">
                          <strong>{school.schoolName}</strong>
                          <small>{school.schoolId}</small>
                        </span>
                        <span className={`ado-map-school-row-status ado-map-rate-pill ado-map-rate-pill--${stats.tone}`}>
                          {stats.status}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p className="ado-map-school-list-empty">No schools found for this block.</p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="ado-map-side">
          <div className="ado-map-legend">
            <h3>
              {mapLevel === "schools"
                ? "School assessment status"
                : "Verification completion"}
            </h3>
            {mapLevel === "schools" ? (
              <ul>
                {SCHOOL_LEGEND_STOPS.map((item) => (
                  <li key={item.label}>
                    <span style={{ background: item.color }} />
                    {item.label}
                  </li>
                ))}
              </ul>
            ) : (
              <>
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
              </>
            )}
          </div>

          {mapLevel === "schools" && activeSchool ? (
            <div className="ado-map-focus-card">
              <div className="ado-map-focus-top">
                <p className="ado-map-focus-label">Selected school</p>
                <span className={`ado-map-rate-pill ado-map-rate-pill--${activeSchool.tone}`}>
                  {activeSchool.status}
                </span>
              </div>
              <h3>{activeSchool.schoolName}</h3>
              <p className="ado-map-focus-meta">{activeSchool.schoolId}</p>
              {activeSchool.verifierUserName ? (
                <p className="ado-map-focus-meta">
                  Verifier: {activeSchool.verifierUserName}
                </p>
              ) : null}
            </div>
          ) : mapLevel === "blocks" && activeBlock ? (
            <div className="ado-map-focus-card">
              <div className="ado-map-focus-top">
                <p className="ado-map-focus-label">Selected block</p>
                <span className={`ado-map-rate-pill ado-map-rate-pill--${activeBlock.tone}`}>
                  {activeBlock.hasData ? `${activeBlock.completionRate}%` : "No data"}
                </span>
              </div>
              <h3>{activeBlock.blockName}</h3>
              <div className="ado-map-focus-progress">
                <div
                  className="ado-map-focus-progress-fill"
                  style={{
                    width: `${Math.min(100, activeBlock.completionRate)}%`,
                    background: activeBlock.fill,
                  }}
                />
              </div>
              <div className="ado-map-focus-stats">
                <div>
                  <span>{activeBlock.total}</span>
                  <small>Total</small>
                </div>
                <div>
                  <span>{activeBlock.completed}</span>
                  <small>Completed</small>
                </div>
                <div>
                  <span>{activeBlock.pending}</span>
                  <small>Pending</small>
                </div>
                <div>
                  <span>{activeBlock.notAllocated}</span>
                  <small>Unalloc.</small>
                </div>
              </div>
              <button
                type="button"
                className="ado-map-drill-btn"
                onClick={() => handleBlockClick(activeBlock)}
              >
                View schools (zoom)
              </button>
            </div>
          ) : activeDistrictRegion ? (
            <div className="ado-map-focus-card">
              <div className="ado-map-focus-top">
                <p className="ado-map-focus-label">
                  {mapLevel === "blocks" ? "District view" : selectedDistrictId ? "Selected district" : "Preview"}
                </p>
                <span
                  className={`ado-map-rate-pill ado-map-rate-pill--${getCompletionTone(
                    activeDistrictRegion.stats.completionRate,
                    activeDistrictRegion.stats.hasData,
                  )}`}
                >
                  {activeDistrictRegion.stats.hasData
                    ? `${activeDistrictRegion.stats.completionRate}%`
                    : "No data"}
                </span>
              </div>
              <h3>
                {formatDistrictName(
                  activeDistrictRegion.stats.districtName ||
                    activeDistrictRegion.feature.properties?.name,
                )}
              </h3>
              <div className="ado-map-focus-progress">
                <div
                  className="ado-map-focus-progress-fill"
                  style={{
                    width: `${Math.min(100, activeDistrictRegion.stats.completionRate)}%`,
                    background: getCompletionColor(
                      activeDistrictRegion.stats.completionRate,
                      activeDistrictRegion.stats.hasData,
                    ),
                  }}
                />
              </div>
              <div className="ado-map-focus-stats">
                <div>
                  <span>{activeDistrictRegion.stats.allocated}</span>
                  <small>Allocated</small>
                </div>
                <div>
                  <span>{activeDistrictRegion.stats.completed}</span>
                  <small>Completed</small>
                </div>
                <div>
                  <span>{activeDistrictRegion.stats.pending}</span>
                  <small>Pending</small>
                </div>
                <div>
                  <span>{activeDistrictRegion.stats.verifiers}</span>
                  <small>Verifiers</small>
                </div>
              </div>
              {mapLevel === "state" ? (
                <button
                  type="button"
                  className="ado-map-drill-btn"
                  onClick={() => handleDistrictClick(activeDistrictRegion)}
                >
                  View blocks in district
                </button>
              ) : null}
            </div>
          ) : (
            <div className="ado-map-focus-card ado-map-focus-card--empty">
              <div className="ado-map-empty-icon" aria-hidden>🗺️</div>
              <p>
                {mapLevel === "schools"
                  ? "Hover a school dot to preview assessment status."
                  : mapLevel === "blocks"
                    ? "Hover or click a block to drill down to schools."
                    : "Hover or tap a district to preview verification metrics."}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
