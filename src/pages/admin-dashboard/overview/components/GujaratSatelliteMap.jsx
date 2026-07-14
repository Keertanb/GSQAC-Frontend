import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { MapContainer, TileLayer, GeoJSON, Polygon, CircleMarker, useMap } from "react-leaflet";
import gujaratDistricts from "../data/gujaratDistricts.json";
import {
  buildDistrictMapStats,
  getCompletionColor,
  getCompletionTone,
  MAP_LEGEND_STOPS,
  matchDistrictKey,
} from "../utils/gujaratDistrictUtils";
import {
  buildBlockStats,
  buildSchoolStats,
  getFeatureLatLngBounds,
  getGujaratFitBounds,
  layoutGeoBlockCells,
  layoutGeoSchoolMarkers,
  mergeBlockBreakdown,
  SCHOOL_LEGEND_STOPS,
} from "../utils/mapDrilldownUtils";
import {
  buildSelfAssessmentDistrictStats,
  buildSelfAssessmentBlockStats,
  getSelfAssessmentColor,
  getSelfAssessmentTone,
} from "../utils/selfAssessmentMapUtils";
import {
  useGetDistrictWiseBlocksQuery,
  useGetSchoolAssessmentStatusListQuery,
  useGetSchoolListQuery,
} from "../../../../services/adminService";
import "leaflet/dist/leaflet.css";

const SATELLITE_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const LABEL_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
const GUJARAT_BOUNDS = getGujaratFitBounds(gujaratDistricts);

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
    return `Satellite zoom — schools in ${blockName || "block"}`;
  }
  if (mapLevel === "blocks") {
    return `Satellite view — blocks in ${districtName || "district"}`;
  }
  return "Gujarat satellite map — click a district to drill down";
}

function MapViewController({ fitBounds, mapLevel }) {
  const map = useMap();

  useEffect(() => {
    if (fitBounds) {
      map.fitBounds(fitBounds, {
        padding: [36, 36],
        maxZoom: mapLevel === "schools" ? 15 : mapLevel === "blocks" ? 12 : 10,
        animate: true,
        duration: 0.65,
      });
      return;
    }

    if (mapLevel === "state") {
      map.fitBounds(GUJARAT_BOUNDS, {
        padding: [24, 24],
        maxZoom: 8,
        animate: true,
        duration: 0.65,
      });
    }
  }, [fitBounds, mapLevel, map]);

  return null;
}

export function GujaratSatelliteMap({
  districts = [],
  districtBreakdown = [],
  blockBreakdown = [],
  selectedDistrictId = "",
  selectedBlockId: selectedBlockIdProp = "",
  selectedSchoolId: selectedSchoolIdProp = "",
  onDistrictSelect,
  onBlockSelect,
  onSchoolSelect,
  onClearSelection,
  onClearBlock,
  // Map mode: "verification" | "self-assessment"
  mode = "verification",
  onModeChange,
  // Self-assessment data
  selfAssessmentDistrictData = [],
  selfAssessmentBlockData = [],
  selfAssessmentSummary = null,
  selfAssessmentSchools = [],
  isFetchingSelfAssessment = false,
}) {
  const [hoveredDistrictKey, setHoveredDistrictKey] = useState(null);
  const [hoveredBlockId, setHoveredBlockId] = useState(null);
  const [hoveredSchoolId, setHoveredSchoolId] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [mapLevel, setMapLevel] = useState("state");
  const prevDistrictIdRef = useRef(selectedDistrictId);
  const prevBlockIdRef = useRef(selectedBlockIdProp);

  const selectedBlockId = selectedBlockIdProp;
  const selectedSchoolId = selectedSchoolIdProp;

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
    prevBlockIdRef.current = "";

    if (!selectedDistrictId) {
      setMapLevel("state");
      return;
    }

    setMapLevel((current) => {
      if (current === "state") return "blocks";
      return current;
    });
  }, [selectedDistrictId]);

  useEffect(() => {
    if (String(prevBlockIdRef.current) === String(selectedBlockId)) {
      return;
    }

    prevBlockIdRef.current = selectedBlockId;

    if (!selectedDistrictId) {
      setMapLevel("state");
      return;
    }

    if (selectedBlockId) {
      setMapLevel("schools");
      return;
    }

    setMapLevel("blocks");
  }, [selectedBlockId, selectedDistrictId]);

  useEffect(() => {
    if (selectedSchoolId) {
      setHoveredSchoolId(String(selectedSchoolId));
    }
  }, [selectedSchoolId]);

  const statsByKey = useMemo(
    () => buildDistrictMapStats(districtBreakdown, districts),
    [districtBreakdown, districts],
  );

  // Self-assessment district stats map (key → stats)
  const ssamStatsByKey = useMemo(
    () => buildSelfAssessmentDistrictStats(selfAssessmentDistrictData, districts),
    [selfAssessmentDistrictData, districts],
  );

  // Self-assessment block stats map (blockId → stats)
  const ssamBlockStatsById = useMemo(
    () => buildSelfAssessmentBlockStats(selfAssessmentBlockData),
    [selfAssessmentBlockData],
  );

  const selectedSsamBlockStats = useMemo(() => {
    return selectedBlockId ? ssamBlockStatsById[selectedBlockId] || null : null;
  }, [ssamBlockStatsById, selectedBlockId]);

  const ssamSchoolsForSelectedBlock = useMemo(() => {
    if (!selectedBlockId || !selfAssessmentSchools) return [];
    return selfAssessmentSchools.filter((s) => String(s.blockId) === String(selectedBlockId));
  }, [selfAssessmentSchools, selectedBlockId]);

  const currentSsamStats = useMemo(() => {
    return mapLevel === "schools" ? selectedSsamBlockStats : selfAssessmentSummary;
  }, [mapLevel, selectedSsamBlockStats, selfAssessmentSummary]);

  const ssamPieData = useMemo(() => {
    if (!currentSsamStats) return [];
    return [
      { name: "In Progress", value: currentSsamStats.pending || 0, color: "#3b82f6" },
      { name: "Not Started", value: currentSsamStats.notStarted || 0, color: "#94a3b8" },
      { name: "Submitted", value: currentSsamStats.submitted || 0, color: "#10b981" },
    ];
  }, [currentSsamStats]);

  const ssamBarData = useMemo(() => {
    if (mapLevel === "schools") {
      if (!selectedSsamBlockStats) return [];
      return [{
        name: selectedSsamBlockStats.blockName,
        "In Progress": selectedSsamBlockStats.pending || 0,
        "Not Started": selectedSsamBlockStats.notStarted || 0,
        "Submitted": selectedSsamBlockStats.submitted || 0,
      }];
    }
    return selfAssessmentBlockData.map((b) => ({
      name: b.blockName,
      "In Progress": b.pending || 0,
      "Not Started": b.notStarted || 0,
      "Submitted": b.submitted || 0,
    }));
  }, [mapLevel, selectedSsamBlockStats, selfAssessmentBlockData]);

  const districtFeatures = useMemo(
    () =>
      gujaratDistricts.features.map((feature) => {
        const key = getFeatureKey(feature);
        return {
          key,
          feature,
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
          latLngBounds: getFeatureLatLngBounds(feature),
        };
      }),
    [statsByKey],
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

  const selectedDistrictFeature = useMemo(
    () => districtFeatures.find((item) => item.key === selectedKey) || null,
    [districtFeatures, selectedKey],
  );

  const blockCells = useMemo(() => {
    if (!selectedDistrictFeature?.feature) return [];
    const blockItems = mergedBlocks.map((block) => buildBlockStats(block));
    return layoutGeoBlockCells(blockItems, selectedDistrictFeature.feature);
  }, [mergedBlocks, selectedDistrictFeature]);

  const selectedBlockCell = useMemo(
    () =>
      blockCells.find(
        (cell) => String(cell.blockId) === String(selectedBlockId),
      ) || null,
    [blockCells, selectedBlockId],
  );

  const schoolMarkers = useMemo(() => {
    if (mapLevel !== "schools" || !selectedBlockCell) return [];
    const schoolItems = schools.map((school) => buildSchoolStats(school));
    return layoutGeoSchoolMarkers(schoolItems, selectedBlockCell);
  }, [schools, selectedBlockCell, mapLevel]);

  const fitBounds = useMemo(() => {
    if (mapLevel === "schools" && selectedBlockCell?.latLngBounds) {
      return selectedBlockCell.latLngBounds;
    }
    if (mapLevel === "blocks" && selectedDistrictFeature?.latLngBounds) {
      return selectedDistrictFeature.latLngBounds;
    }
    return null;
  }, [mapLevel, selectedBlockCell, selectedDistrictFeature]);

  const selectedDistrictName = useMemo(() => {
    if (!selectedDistrictId) return "";
    const district = districts.find(
      (item) => String(item.value) === String(selectedDistrictId),
    );
    return formatDistrictName(
      district?.name || selectedDistrictFeature?.stats?.districtName,
    );
  }, [selectedDistrictId, districts, selectedDistrictFeature]);

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
      prevBlockIdRef.current = "";
      onDistrictSelect?.(districtValue);
      setMapLevel("blocks");
    },
    [districts, onDistrictSelect],
  );

  const handleBlockClick = useCallback(
    (block) => {
      if (selectedDistrictId) {
        prevDistrictIdRef.current = selectedDistrictId;
      }
      prevBlockIdRef.current = String(block.blockId);
      onBlockSelect?.(String(block.blockId));
      setMapLevel("schools");
      setTooltip(null);
      setHoveredBlockId(null);
    },
    [selectedDistrictId, onBlockSelect],
  );

  const handleBack = useCallback(() => {
    if (mapLevel === "schools") {
      onClearBlock?.();
      setMapLevel("blocks");
      setTooltip(null);
      return;
    }

    if (mapLevel === "blocks") {
      setMapLevel("state");
      onClearSelection?.();
    }
  }, [mapLevel, onClearBlock, onClearSelection]);

  const districtStyle = useCallback(
    (feature) => {
      const key = getFeatureKey(feature);
      const isSelected = selectedKey === key;
      const isHovered = hoveredDistrictKey === key;

      if (mapLevel === "state") {
        if (mode === "self-assessment") {
          const ssamStats = ssamStatsByKey[key] || { submissionRate: 0, hasData: false };
          const fill = getSelfAssessmentColor(ssamStats.submissionRate, ssamStats.hasData);
          return {
            color: isSelected || isHovered ? "#1e3a8a" : "#ffffff",
            weight: isSelected ? 2.5 : isHovered ? 2 : 1.2,
            fillColor: fill,
            fillOpacity: isHovered ? 0.82 : 0.68,
          };
        }

        const stats = statsByKey[key] || { completionRate: 0, hasData: false };
        const fill = getCompletionColor(stats.completionRate, stats.hasData);
        return {
          color: isSelected || isHovered ? "#1e3a8a" : "#ffffff",
          weight: isSelected ? 2.5 : isHovered ? 2 : 1.2,
          fillColor: fill,
          fillOpacity: isHovered ? 0.82 : 0.68,
        };
      }

      return {
        color: isSelected ? "#2563eb" : "#94a3b8",
        weight: isSelected ? 3 : 1,
        fillColor: isSelected ? "#3b82f6" : "#cbd5e1",
        fillOpacity: isSelected ? 0.14 : 0.05,
        dashArray: isSelected ? undefined : "4 4",
      };
    },
    [statsByKey, ssamStatsByKey, selectedKey, hoveredDistrictKey, mapLevel, mode],
  );

  const onEachDistrict = useCallback(
    (feature, layer) => {
      const key = getFeatureKey(feature);
      const region = districtFeatures.find((item) => item.key === key);
      if (!region) return;

      layer.on({
        click: () => {
          if (mapLevel === "state") {
            handleDistrictClick(region);
          }
        },
        mouseover: (event) => {
          if (mapLevel !== "state") return;
          setHoveredDistrictKey(key);
          event.target.setStyle({
            weight: 2.2,
            fillOpacity: 0.86,
          });

          if (mode === "self-assessment") {
            const ssamStats = ssamStatsByKey[key] || { submissionRate: 0, hasData: false, submitted: 0, pending: 0, notStarted: 0 };
            setTooltip({
              type: "district-ssam",
              name: formatDistrictName(
                ssamStats.districtName || region.stats.districtName || feature.properties?.name,
              ),
              rate: ssamStats.submissionRate,
              tone: getSelfAssessmentTone(ssamStats.submissionRate, ssamStats.hasData),
              submitted: ssamStats.submitted,
              pending: ssamStats.pending,
              notStarted: ssamStats.notStarted,
              x: event.originalEvent.clientX,
              y: event.originalEvent.clientY,
            });
          } else {
            setTooltip({
              type: "district",
              name: formatDistrictName(
                region.stats.districtName || feature.properties?.name,
              ),
              rate: region.stats.completionRate,
              tone: getCompletionTone(
                region.stats.completionRate,
                region.stats.hasData,
              ),
              allocated: region.stats.allocated,
              completed: region.stats.completed,
              pending: region.stats.pending,
              x: event.originalEvent.clientX,
              y: event.originalEvent.clientY,
            });
          }
        },
        mouseout: () => {
          if (mapLevel !== "state") return;
          setHoveredDistrictKey(null);
          setTooltip(null);
        },
      });
    },
    [districtFeatures, handleDistrictClick, mapLevel, mode, ssamStatsByKey],
  );

  const previewDistrict =
    districtFeatures.find(
      (item) => item.key === (hoveredDistrictKey || selectedKey),
    ) || selectedDistrictFeature;

  // Self-assessment stats for the currently hovered/selected district
  const previewSsamDistrictStats = useMemo(() => {
    const key = hoveredDistrictKey || selectedKey;
    if (!key) return null;
    return ssamStatsByKey[key] || null;
  }, [hoveredDistrictKey, selectedKey, ssamStatsByKey]);

  // Self-assessment stats for the currently hovered/selected block
  const ssamActiveBlockStats = useMemo(() => {
    const blockId = hoveredBlockId || selectedBlockId;
    if (!blockId) return null;
    return ssamBlockStatsById[String(blockId)] || null;
  }, [hoveredBlockId, selectedBlockId, ssamBlockStatsById]);

  const activeBlock =
    blockCells.find(
      (block) => String(block.blockId) === String(hoveredBlockId || selectedBlockId),
    ) || null;

  const activeSchool =
    schoolMarkers.find(
      (school) =>
        String(school.schoolId) === String(hoveredSchoolId || selectedSchoolId),
    ) || null;

  const breadcrumb = [
    { 
      label: "Gujarat", 
      active: mapLevel === "state",
      onClick: () => {
        if (mapLevel !== "state") {
          onClearSelection?.();
        }
      }
    },
    selectedDistrictName
      ? { 
          label: selectedDistrictName, 
          active: mapLevel === "blocks",
          onClick: () => {
            if (mapLevel !== "blocks") {
              onClearBlock?.();
            }
          }
        }
      : null,
    selectedBlockName
      ? { 
          label: selectedBlockName, 
          active: mapLevel === "schools",
          onClick: undefined
        }
      : null,
  ].filter(Boolean);

  return (
    <div className="ado-map-section ado-map-section--satellite">
      <div className="ado-map-header">
        <div className="ado-map-header-text">
          <p className="ado-section-eyebrow">Geographic view</p>
          <h2 className="ado-section-title">Gujarat satellite map</h2>
          <p className="ado-map-subtitle">
            {getMapSubtitle(mapLevel, selectedDistrictName, selectedBlockName)}
          </p>
          {breadcrumb.length > 1 ? (
            <nav className="ado-map-breadcrumb" aria-label="Map drill-down">
              {breadcrumb.map((item, index) => (
                <React.Fragment key={item.label}>
                  {index > 0 ? (
                    <span className="ado-map-breadcrumb-sep">/</span>
                  ) : null}
                  <span
                    className={`ado-map-breadcrumb-item${
                      item.active ? " ado-map-breadcrumb-item--active" : ""
                    }`}
                    onClick={item.onClick}
                    style={item.onClick && !item.active ? { cursor: "pointer", textDecoration: "underline" } : {}}
                  >
                    {item.label}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          ) : null}
        </div>
        <div className="ado-map-header-actions">
          {/* Map data mode indicator */}
          <div className="ado-map-mode-tabs" aria-label="Map data mode">
            <div className="ado-map-mode-tab ado-map-mode-tab--active" style={{ cursor: "default" }}>
              {isFetchingSelfAssessment ? "⟳ " : "📋 "}Self-Assessment
            </div>
          </div>
          <span className="ado-map-chip ado-map-chip--satellite">Esri satellite</span>
          <span className="ado-map-chip">
            {mapLevel === "schools"
              ? `${schools.length} schools`
              : mapLevel === "blocks"
                ? `${mergedBlocks.length} blocks`
                : `${districtBreakdown?.length || 0} districts`}
          </span>
          {mapLevel !== "state" ? (
            <button type="button" className="ado-map-back-btn" onClick={handleBack}>
              {mapLevel === "schools" ? "← Back to blocks" : "← Statewide view"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="ado-map-layout">
        <div className="ado-map-canvas-wrap ado-map-canvas-wrap--satellite">
          <MapContainer
            className="ado-leaflet-map"
            bounds={GUJARAT_BOUNDS}
            scrollWheelZoom
            zoomControl
            attributionControl
          >
            <TileLayer
              url={SATELLITE_TILES}
              attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a>'
              maxZoom={19}
            />
            <TileLayer
              url={LABEL_TILES}
              attribution=""
              maxZoom={19}
              opacity={0.72}
              pane="overlayPane"
            />

            <GeoJSON
              key={`districts-${mapLevel}-${selectedKey || "none"}-${hoveredDistrictKey || ""}`}
              data={gujaratDistricts}
              style={districtStyle}
              onEachFeature={onEachDistrict}
            />

            {mapLevel !== "state" && selectedDistrictFeature ? (
              <GeoJSON
                key={`selected-district-outline-${selectedKey}`}
                data={selectedDistrictFeature.feature}
                style={{
                  color: "#2563eb",
                  weight: 3,
                  fillOpacity: 0.04,
                  fillColor: "#3b82f6",
                }}
                interactive={false}
              />
            ) : null}

            {mapLevel !== "state"
              ? blockCells.map((block) => {
                  const isSelected =
                    String(block.blockId) === String(selectedBlockId);
                  const isHovered =
                    String(block.blockId) === String(hoveredBlockId);
                  const hiddenInSchoolZoom =
                    mapLevel === "schools" && !isSelected;

                  if (!block.polygon?.length) return null;

                  // In self-assessment mode, use SSAM block colors
                  const ssamStats = ssamBlockStatsById[String(block.blockId)];
                  const blockFill =
                    mode === "self-assessment" && ssamStats
                      ? ssamStats.fill
                      : block.fill;

                  return (
                    <Polygon
                      key={block.blockId}
                      positions={block.polygon}
                      pathOptions={{
                        color: isSelected || isHovered ? "#1e3a8a" : "#ffffff",
                        weight: isSelected ? 3 : isHovered ? 2.2 : 1.4,
                        fillColor: hiddenInSchoolZoom ? "#94a3b8" : blockFill,
                        fillOpacity: hiddenInSchoolZoom
                          ? 0.12
                          : mapLevel === "schools" && isSelected
                            ? 0.2
                            : 0.72,
                      }}
                      eventHandlers={{
                        click: () => {
                          if (!hiddenInSchoolZoom) {
                            handleBlockClick(block);
                          }
                        },
                        mouseover: (event) => {
                          if (hiddenInSchoolZoom) return;
                          setHoveredBlockId(String(block.blockId));
                          if (mode === "self-assessment" && ssamStats) {
                            setTooltip({
                              type: "block-ssam",
                              name: block.blockName,
                              rate: ssamStats.submissionRate,
                              tone: ssamStats.tone,
                              submitted: ssamStats.submitted,
                              pending: ssamStats.pending,
                              notStarted: ssamStats.notStarted,
                              total: ssamStats.total,
                              x: event.originalEvent.clientX,
                              y: event.originalEvent.clientY,
                            });
                          } else {
                            setTooltip({
                              type: "block",
                              name: block.blockName,
                              rate: block.completionRate,
                              tone: block.tone,
                              total: block.total,
                              completed: block.completed,
                              pending: block.pending,
                              x: event.originalEvent.clientX,
                              y: event.originalEvent.clientY,
                            });
                          }
                        },
                        mouseout: () => {
                          if (hiddenInSchoolZoom) return;
                          setHoveredBlockId(null);
                          setTooltip(null);
                        },
                      }}
                    />
                  );
                })
              : null}

            {mapLevel === "schools" && !isLoadingSchools
              ? schoolMarkers.map((school) => {
                  const isHovered =
                    String(school.schoolId) === String(hoveredSchoolId);
                  const isSelected =
                    String(school.schoolId) === String(selectedSchoolId);
                  return (
                    <CircleMarker
                      key={school.schoolId}
                      center={school.latLng}
                      radius={isSelected ? 8 : isHovered ? 7 : 5}
                      pathOptions={{
                        color: isSelected || isHovered ? "#0f172a" : "#ffffff",
                        weight: isSelected ? 2.5 : isHovered ? 2 : 1.2,
                        fillColor: school.fill,
                        fillOpacity: 0.95,
                      }}
                      eventHandlers={{
                        click: () => onSchoolSelect?.(String(school.schoolId)),
                        mouseover: (event) => {
                          setHoveredSchoolId(String(school.schoolId));
                          setTooltip({
                            type: "school",
                            name: school.schoolName,
                            status: school.status,
                            tone: school.tone,
                            verifier: school.verifierUserName,
                            x: event.originalEvent.clientX,
                            y: event.originalEvent.clientY,
                          });
                        },
                        mouseout: () => {
                          if (String(selectedSchoolId) !== String(school.schoolId)) {
                            setHoveredSchoolId(null);
                          }
                          setTooltip(null);
                        },
                      }}
                    />
                  );
                })
              : null}

            <MapViewController fitBounds={fitBounds} mapLevel={mapLevel} />
          </MapContainer>

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
                    <span>
                      Allocated <strong>{tooltip.allocated}</strong>
                    </span>
                    <span>
                      Done <strong>{tooltip.completed}</strong>
                    </span>
                    <span>
                      Pending <strong>{tooltip.pending}</strong>
                    </span>
                  </div>
                </>
              ) : null}
              {tooltip.type === "district-ssam" ? (
                <>
                  <p className="ado-map-tooltip-rate">
                    <span>Self-Assessment</span>
                    <strong>{tooltip.rate}%</strong>
                  </p>
                  <div className="ado-map-tooltip-grid">
                    <span>
                      Submitted <strong>{tooltip.submitted}</strong>
                    </span>
                    <span>
                      In Progress <strong>{tooltip.pending}</strong>
                    </span>
                    <span>
                      Not Started <strong>{tooltip.notStarted}</strong>
                    </span>
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
                    <span>
                      Total <strong>{tooltip.total}</strong>
                    </span>
                    <span>
                      Done <strong>{tooltip.completed}</strong>
                    </span>
                    <span>
                      Pending <strong>{tooltip.pending}</strong>
                    </span>
                  </div>
                </>
              ) : null}
              {tooltip.type === "block-ssam" ? (
                <>
                  <p className="ado-map-tooltip-rate">
                    <span>Submitted</span>
                    <strong>{tooltip.rate}%</strong>
                  </p>
                  <div className="ado-map-tooltip-grid">
                    <span>
                      Submitted <strong>{tooltip.submitted}</strong>
                    </span>
                    <span>
                      In Progress <strong>{tooltip.pending}</strong>
                    </span>
                    <span>
                      Not Started <strong>{tooltip.notStarted}</strong>
                    </span>
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
                <span>
                  {isLoadingSchools ? "Loading…" : `${schools.length} schools`}
                </span>
              </div>
              <div className="ado-map-school-list">
                {isLoadingSchools ? (
                  <p className="ado-map-school-list-empty">Loading schools…</p>
                ) : schools.length > 0 ? (
                  schools.map((school) => {
                    const stats = buildSchoolStats(school);
                    const isActive =
                      String(school.schoolId) === String(hoveredSchoolId) ||
                      String(school.schoolId) === String(selectedSchoolId);
                    return (
                      <button
                        key={school.schoolId}
                        type="button"
                        className={`ado-map-school-row${
                          isActive ? " ado-map-school-row--active" : ""
                        }`}
                        onClick={() => onSchoolSelect?.(String(school.schoolId))}
                        onMouseEnter={() =>
                          setHoveredSchoolId(String(school.schoolId))
                        }
                        onMouseLeave={() => {
                          if (String(selectedSchoolId) !== String(school.schoolId)) {
                            setHoveredSchoolId(null);
                          }
                        }}
                      >
                        <span
                          className="ado-map-school-row-dot"
                          style={{ background: stats.fill }}
                        />
                        <span className="ado-map-school-row-body">
                          <strong>{school.schoolName}</strong>
                          <small>{school.schoolId}</small>
                        </span>
                        <span
                          className={`ado-map-school-row-status ado-map-rate-pill ado-map-rate-pill--${stats.tone}`}
                        >
                          {stats.status}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p className="ado-map-school-list-empty">
                    No schools found for this block.
                  </p>
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
                : mode === "self-assessment"
                  ? "Self-Assessment Submission"
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

          {/* ── SELF-ASSESSMENT MODE PANELS ── */}
          {mode === "self-assessment" && currentSsamStats && currentSsamStats.total > 0 ? (
            <div className="ado-ssam-panel ado-ssam-panel--full">
              <div className="ado-ssam-panel-header">
                <p className="ado-map-focus-label">Self-Assessment Progress</p>
                <span className={`ado-map-rate-pill ado-map-rate-pill--${mapLevel === "schools" ? selectedSsamBlockStats?.tone : getSelfAssessmentTone(selfAssessmentSummary?.submissionRate, true)}`}>
                  {mapLevel === "schools" ? selectedSsamBlockStats?.submissionRate : selfAssessmentSummary?.submissionRate}%
                </span>
              </div>
              <h3 className="ado-ssam-panel-district">
                {mapLevel === "schools" ? (selectedBlockName || selectedSsamBlockStats?.blockName) : formatDistrictName(selfAssessmentDistrictData[0]?.districtName || previewDistrict?.stats?.districtName || previewDistrict?.feature?.properties?.name)}
              </h3>
              
              <div className="ado-ssam-stats-grid">
                <div className="ado-ssam-stat-card">
                  <div className="ado-ssam-stat-icon ado-ssam-stat-icon--indigo">🏫</div>
                  <div className="ado-ssam-stat-content">
                    <span className="ado-ssam-stat-value">{currentSsamStats.total}</span>
                    <span className="ado-ssam-stat-label">Total schools</span>
                  </div>
                </div>
                <div className="ado-ssam-stat-card">
                  <div className="ado-ssam-stat-icon ado-ssam-stat-icon--green">✓</div>
                  <div className="ado-ssam-stat-content">
                    <span className="ado-ssam-stat-value">{currentSsamStats.submitted}</span>
                    <span className="ado-ssam-stat-label">Submitted</span>
                  </div>
                </div>
                <div className="ado-ssam-stat-card">
                  <div className="ado-ssam-stat-icon ado-ssam-stat-icon--blue">⏳</div>
                  <div className="ado-ssam-stat-content">
                    <span className="ado-ssam-stat-value">{currentSsamStats.pending}</span>
                    <span className="ado-ssam-stat-label">In progress</span>
                  </div>
                </div>
                <div className="ado-ssam-stat-card">
                  <div className="ado-ssam-stat-icon ado-ssam-stat-icon--slate">○</div>
                  <div className="ado-ssam-stat-content">
                    <span className="ado-ssam-stat-value">{currentSsamStats.notStarted}</span>
                    <span className="ado-ssam-stat-label">Not started</span>
                  </div>
                </div>
                <div className="ado-ssam-stat-card">
                  <div className="ado-ssam-stat-icon ado-ssam-stat-icon--amber">⚡</div>
                  <div className="ado-ssam-stat-content">
                    <span className="ado-ssam-stat-value">{currentSsamStats.recentlyActive || 0}</span>
                    <span className="ado-ssam-stat-label">Active (7d)</span>
                  </div>
                </div>
              </div>

              <div className="ado-ssam-chart-box">
                <h4 className="ado-ssam-chart-title">Status distribution</h4>
                <div style={{ width: "100%", height: 180 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={ssamPieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={3}
                      >
                        {ssamPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="square" wrapperStyle={{ fontSize: '10px' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="ado-ssam-chart-box">
                <h4 className="ado-ssam-chart-title">Block-wise progress</h4>
                <div style={{ width: "100%", height: 180 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={ssamBarData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} tickMargin={5} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="square" wrapperStyle={{ fontSize: '10px' }}/>
                      <Bar dataKey="In Progress" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="Not Started" stackId="a" fill="#94a3b8" />
                      <Bar dataKey="Submitted" stackId="a" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Keep the school-wise list if we are in block level */}
              {mapLevel === "schools" && ssamSchoolsForSelectedBlock.length > 0 && (
                <>
                  <p className="ado-ssam-blocks-title" style={{ marginTop: 8 }}>School-wise status</p>
                  <div className="ado-ssam-blocks-list">
                    {ssamSchoolsForSelectedBlock.map((school) => {
                      const statusClass = 
                        school.status === "Submitted" ? "ado-ssam-block-rate--excellent" :
                        school.status === "In Progress" ? "ado-ssam-block-rate--moderate" :
                        "ado-ssam-block-rate--none";

                      const isHovered = String(school.schoolId) === String(hoveredSchoolId);
                      const isSelected = String(school.schoolId) === String(selectedSchoolId);
                      return (
                        <div
                          key={school.schoolId}
                          className={`ado-ssam-block-row${isHovered || isSelected ? " ado-ssam-block-row--active" : ""}`}
                          onMouseEnter={() => setHoveredSchoolId(String(school.schoolId))}
                          onMouseLeave={() => setHoveredSchoolId(null)}
                          onClick={() => {
                            onSchoolSelect?.(String(school.schoolId));
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="ado-ssam-block-row-top">
                            <span className="ado-ssam-block-name" title={school.schoolName}>{school.schoolName}</span>
                          </div>
                          <div className="ado-ssam-block-row-counts" style={{ justifyContent: "space-between", marginTop: 2 }}>
                            <span>{school.udiseCode || school.schoolId}</span>
                            <span className={statusClass} style={{ fontSize: "0.65rem", fontWeight: 700 }}>
                              {school.status === "Submitted" ? "✓ Submitted" : school.status === "In Progress" ? "⏳ In Progress" : "○ Not Started"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ) : mode === "self-assessment" && isFetchingSelfAssessment ? (
            <div className="ado-map-focus-card ado-map-focus-card--empty">
              <div className="ado-map-empty-icon" aria-hidden>⏳</div>
              <p>Loading self-assessment data…</p>
            </div>
          ) : mode === "self-assessment" ? (
            <div className="ado-map-focus-card ado-map-focus-card--empty">
              <div className="ado-map-empty-icon" aria-hidden>📋</div>
              <p>
                {mapLevel === "state"
                  ? "Click a district to view its self-assessment progress."
                  : "No self-assessment data available."}
              </p>
            </div>
          ) : null}

          {/* ── VERIFICATION MODE PANELS (and school-level in any mode) ── */}
          {mapLevel === "schools" && activeSchool ? (
            <div className="ado-map-focus-card">
              <div className="ado-map-focus-top">
                <p className="ado-map-focus-label">Selected school</p>
                <span
                  className={`ado-map-rate-pill ado-map-rate-pill--${activeSchool.tone}`}
                >
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
          ) : mode === "verification" && mapLevel === "blocks" && activeBlock ? (
            <div className="ado-map-focus-card">
              <div className="ado-map-focus-top">
                <p className="ado-map-focus-label">Selected block</p>
                <span
                  className={`ado-map-rate-pill ado-map-rate-pill--${activeBlock.tone}`}
                >
                  {activeBlock.hasData
                    ? `${activeBlock.completionRate}%`
                    : "No data"}
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
                Zoom to schools
              </button>
            </div>
          ) : mode === "verification" && previewDistrict ? (
            <div className="ado-map-focus-card">
              <div className="ado-map-focus-top">
                <p className="ado-map-focus-label">
                  {mapLevel === "blocks"
                    ? "District view"
                    : selectedDistrictId
                      ? "Selected district"
                      : "Preview"}
                </p>
                <span
                  className={`ado-map-rate-pill ado-map-rate-pill--${getCompletionTone(
                    previewDistrict.stats.completionRate,
                    previewDistrict.stats.hasData,
                  )}`}
                >
                  {previewDistrict.stats.hasData
                    ? `${previewDistrict.stats.completionRate}%`
                    : "No data"}
                </span>
              </div>
              <h3>
                {formatDistrictName(
                  previewDistrict.stats.districtName ||
                    previewDistrict.feature.properties?.name,
                )}
              </h3>
              <div className="ado-map-focus-progress">
                <div
                  className="ado-map-focus-progress-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      previewDistrict.stats.completionRate,
                    )}%`,
                    background: getCompletionColor(
                      previewDistrict.stats.completionRate,
                      previewDistrict.stats.hasData,
                    ),
                  }}
                />
              </div>
              <div className="ado-map-focus-stats">
                <div>
                  <span>{previewDistrict.stats.allocated}</span>
                  <small>Allocated</small>
                </div>
                <div>
                  <span>{previewDistrict.stats.completed}</span>
                  <small>Completed</small>
                </div>
                <div>
                  <span>{previewDistrict.stats.pending}</span>
                  <small>Pending</small>
                </div>
                <div>
                  <span>{previewDistrict.stats.verifiers}</span>
                  <small>Verifiers</small>
                </div>
              </div>
              {mapLevel === "state" ? (
                <button
                  type="button"
                  className="ado-map-drill-btn"
                  onClick={() => handleDistrictClick(previewDistrict)}
                >
                  View blocks on map
                </button>
              ) : null}
            </div>
          ) : (
            <div className="ado-map-focus-card ado-map-focus-card--empty">
              <div className="ado-map-empty-icon" aria-hidden>
                🛰️
              </div>
              <p>
                {mapLevel === "schools"
                  ? "Hover a school dot to preview assessment status."
                  : mapLevel === "blocks"
                    ? "Click a block to zoom in and view schools."
                    : "Hover or click a district on the satellite map."}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
