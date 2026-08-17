import { useState } from "react";
import ExcelJS from "exceljs/dist/exceljs.bare.min.js";
import { enqueueSnackbar } from "notistack";
import axiosInstance from "../../../../config/axios";

let _cache = null;
let _cacheAt = 0;
const CACHE_TTL = 5 * 60 * 1000;
let _prefetchPromise = null;

function isCacheValid() {
  return _cache !== null && Date.now() - _cacheAt < CACHE_TTL;
}

async function fetchDashboard() {
  const res = await axiosInstance.get("/admin/dashboard", {
    params: {},
    timeout: 30000,
  });
  return res.data?.data || {};
}

async function fetchAllDistricts() {
  try {
    const res = await axiosInstance.get("/master/all-districts", {
      timeout: 15000,
    });
    return res.data?.data || [];
  } catch (err) {
    console.warn("[Export] master districts failed:", err?.message);
    return [];
  }
}

async function fetchSchoolsForDistrict(districtId) {
  const PAGE_SIZE = 5000;
  const allRows = [];
  try {
    let page = 0;
    while (true) {
      const res = await axiosInstance.get("/admin/school-self-assessment-monitor", {
        params: {
          districtId: Number(districtId),
          page,
          limit: PAGE_SIZE,
        },
        timeout: 60000,
      });
      const payload = res.data?.data || {};
      const rows = payload.rows || [];
      allRows.push(...rows);
      const total = Number(payload.total ?? allRows.length);
      if (rows.length < PAGE_SIZE || allRows.length >= total) break;
      page += 1;
    }
    return allRows;
  } catch (err) {
    console.error(
      `[Export] Schools for district ${districtId}:`,
      err?.response?.data || err?.message,
    );
    return allRows;
  }
}

async function fetchAllSchoolsBatched(districtIds, BATCH = 5, onProgress) {
  const allSchools = [];
  for (let i = 0; i < districtIds.length; i += BATCH) {
    const batch = districtIds.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(fetchSchoolsForDistrict));
    results.forEach((rows) => allSchools.push(...rows));
    onProgress?.(Math.min(i + BATCH, districtIds.length), districtIds.length);
  }
  return allSchools;
}

async function prefetchExportData(onProgress) {
  if (isCacheValid()) return _cache;
  if (_prefetchPromise) return _prefetchPromise;

  _prefetchPromise = (async () => {
    try {
      onProgress?.({ phase: "dashboard" });
      const [dashboard, masterDistricts] = await Promise.all([
        fetchDashboard(),
        fetchAllDistricts(),
      ]);

      const districtMap = {};
      masterDistricts.forEach((d) => {
        const id = String(d.value ?? d.districtId ?? "");
        if (!id) return;
        districtMap[id] = {
          districtId: id,
          districtName: d.name ?? d.districtName ?? "",
          totalSchools: 0,
          completedSchools: 0,
          startedSchools: 0,
          notStartedSchools: 0,
          completedVerification: 0,
          pendingVerification: 0,
        };
      });
      (dashboard.districtBreakdown || []).forEach((d) => {
        const id = String(d.districtId ?? "");
        if (!id) return;
        districtMap[id] = {
          ...districtMap[id],
          districtId: id,
          districtName:
            d.districtName ?? districtMap[id]?.districtName ?? "",
          totalSchools: d.totalSchools ?? d.total ?? 0,
          completedSchools: d.completedSchools ?? d.completedVerification ?? 0,
          startedSchools: d.startedSchools ?? d.pendingVerification ?? 0,
          notStartedSchools: d.notStartedSchools ?? 0,
          completedVerification: d.completedVerification ?? d.completedSchools ?? 0,
          pendingVerification: d.pendingVerification ?? d.startedSchools ?? 0,
        };
      });

      const allDistrictEntries = Object.values(districtMap);
      const districtIds = allDistrictEntries
        .map((d) => d.districtId)
        .filter(Boolean);

      onProgress?.({ phase: "schools", done: 0, total: districtIds.length });

      const allSchools = await fetchAllSchoolsBatched(
        districtIds,
        5,
        (done, total) => onProgress?.({ phase: "schools", done, total }),
      );

      const result = {
        allDistrictEntries,
        allSchools,
        blockBreakdown: dashboard.blockBreakdown || [],
      };
      _cache = result;
      _cacheAt = Date.now();
      return result;
    } finally {
      _prefetchPromise = null;
    }
  })();

  return _prefetchPromise;
}

const SHEET_CONFIGS = {
  District: {
    tabColor: "818CF8",
    titleBg: "E0E7FF",
    headerBg: "C7D2FE",
    headerTxt: "312E81",
    altRowBg: "F5F3FF",
  },
  Block: {
    tabColor: "60A5FA",
    titleBg: "DBEAFE",
    headerBg: "BFDBFE",
    headerTxt: "1E3A8A",
    altRowBg: "F0F7FF",
  },
  Cluster: {
    tabColor: "34D399",
    titleBg: "D1FAE5",
    headerBg: "A7F3D0",
    headerTxt: "064E3B",
    altRowBg: "F0FDF8",
  },
  School: {
    tabColor: "4ADE80",
    titleBg: "DCFCE7",
    headerBg: "BBF7D0",
    headerTxt: "14532D",
    altRowBg: "F7FEF9",
  },
};

const COLUMN_LABELS = {
  districtId: "District ID",
  districtName: "District Name",
  blockId: "Block ID",
  blockName: "Block Name",
  clusterId: "Cluster ID",
  clusterName: "Cluster Name",
  schoolId: "School ID",
  schoolName: "School Name",
  total_schools: "Total Schools",
  schools_started: "Started",
  schools_pending: "Pending",
  schools_completed: "Completed",
  schools_not_started: "Not Started",
};

const COLUMN_WIDTHS = {
  districtId: 13,
  districtName: 26,
  blockId: 13,
  blockName: 24,
  clusterId: 15,
  clusterName: 30,
  schoolId: 15,
  schoolName: 34,
  total_schools: 15,
  schools_started: 13,
  schools_pending: 13,
  schools_completed: 15,
  schools_not_started: 15,
};

const NUMERIC_KEYS = new Set([
  "total_schools",
  "schools_started",
  "schools_pending",
  "schools_completed",
  "schools_not_started",
]);

function classifyStatus(school) {
  const flag = school.selfAssessmentIsSubmitted;
  if (flag === 1 || flag === "1") {
    return {
      isCompleted: true,
      isInProgress: false,
      isPending: false,
      isNotStarted: false,
    };
  }
  // 0 = In Progress. Do not use Number(flag): Number(null) === 0.
  if (flag === 0 || flag === "0") {
    return {
      isCompleted: false,
      isInProgress: true,
      isPending: true,
      isNotStarted: false,
    };
  }

  const raw = String(
    school.selfAssessmentStatus ??
      school.status ??
      school.assessmentStatus ??
      school.submissionStatus ??
      school.overallStatus ??
      "",
  )
    .toLowerCase()
    .trim();
  const isCompleted =
    raw === "submitted" || raw === "completed" || raw === "complete";
  const isInProgress =
    raw === "in_progress" || raw === "in progress" || raw === "started";
  const isPending = raw === "pending";
  const isNotStarted = !isCompleted && !isInProgress && !isPending;
  return { isCompleted, isInProgress, isPending, isNotStarted };
}

function buildSheet(workbook, sheetName, rows, headers) {
  const { tabColor, titleBg, headerBg, headerTxt, altRowBg } =
    SHEET_CONFIGS[sheetName] || SHEET_CONFIGS.District;
  const colCount = headers.length;
  const HAIR = { style: "hair", color: { argb: "FFE2E8F0" } };
  const THIN = (argb) => ({ style: "thin", color: { argb } });

  const ws = workbook.addWorksheet(sheetName, {
    properties: { tabColor: { argb: `FF${tabColor}` } },
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printTitlesRow: "1:2",
    },
  });

  ws.columns = headers.map((h) => ({ key: h, width: COLUMN_WIDTHS[h] || 16 }));

  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  ws.addRow([]);
  ws.mergeCells(1, 1, 1, colCount);
  const tc = ws.getCell("A1");
  tc.value = `GSQAC Dashboard Report  ·  ${sheetName}-Level Data  ·  Generated: ${dateStr}`;
  tc.font = {
    name: "Calibri",
    bold: true,
    size: 13,
    color: { argb: `FF${headerTxt}` },
  };
  tc.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: `FF${titleBg}` },
  };
  tc.alignment = { horizontal: "center", vertical: "middle" };
  tc.border = { bottom: THIN(`FF${tabColor}`) };
  ws.getRow(1).height = 32;

  const hr = ws.addRow(headers.map((h) => COLUMN_LABELS[h] || h));
  hr.height = 20;
  hr.eachCell((cell) => {
    cell.font = {
      name: "Calibri",
      bold: true,
      size: 10,
      color: { argb: `FF${headerTxt}` },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${headerBg}` },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: HAIR,
      left: HAIR,
      bottom: THIN(`FF${tabColor}`),
      right: HAIR,
    };
  });

  rows.forEach((rowData, idx) => {
    const row = ws.addRow(headers.map((h) => rowData[h] ?? ""));
    row.height = 16;
    const bg = idx % 2 === 1 ? `FF${altRowBg}` : "FFFFFFFF";
    row.eachCell((cell, ci) => {
      const key = headers[ci - 1];
      const isNum = NUMERIC_KEYS.has(key);
      cell.font = { name: "Calibri", size: 10, color: { argb: "FF1E293B" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      cell.border = { top: HAIR, left: HAIR, bottom: HAIR, right: HAIR };
      cell.alignment = {
        horizontal: isNum ? "right" : "left",
        vertical: "middle",
        indent: isNum ? 0 : 1,
      };
      if (isNum && typeof cell.value === "number") cell.numFmt = "#,##0";
    });
  });

  if (rows.length > 0) {
    const totals = headers.map((h, i) =>
      NUMERIC_KEYS.has(h)
        ? rows.reduce((s, r) => s + (Number(r[h]) || 0), 0)
        : i === 0
          ? "GRAND TOTAL"
          : "",
    );
    const tr = ws.addRow(totals);
    tr.height = 20;
    tr.eachCell((cell, ci) => {
      const key = headers[ci - 1];
      const isNum = NUMERIC_KEYS.has(key);
      cell.font = {
        name: "Calibri",
        bold: true,
        size: 10,
        color: { argb: `FF${headerTxt}` },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: `FF${titleBg}` },
      };
      cell.border = {
        top: THIN(`FF${tabColor}`),
        left: HAIR,
        bottom: THIN(`FF${tabColor}`),
        right: HAIR,
      };
      cell.alignment = {
        horizontal: isNum ? "right" : "left",
        vertical: "middle",
      };
      if (isNum && typeof cell.value === "number") cell.numFmt = "#,##0";
    });
  }

  ws.views = [{ state: "frozen", ySplit: 2, xSplit: 0, activeCell: "A3" }];
  ws.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: 2, column: colCount },
  };
}

function emptyCounts() {
  return {
    total_schools: 0,
    schools_started: 0,
    schools_pending: 0,
    schools_completed: 0,
    schools_not_started: 0,
  };
}

function tallySchool(entry, school) {
  entry.total_schools += 1;
  const { isCompleted, isInProgress, isPending, isNotStarted } =
    classifyStatus(school);
  if (isCompleted) {
    entry.schools_completed += 1;
    entry.schools_started += 1;
  } else if (isInProgress) {
    entry.schools_started += 1;
    entry.schools_pending += 1;
  } else if (isPending) {
    entry.schools_pending += 1;
    entry.schools_started += 1;
  } else if (isNotStarted) {
    entry.schools_not_started += 1;
  }
}

function aggregateByKey(allSchools, keyFn, initFn) {
  const map = {};
  allSchools.forEach((s) => {
    const key = keyFn(s);
    if (!key) return;
    if (!map[key]) map[key] = initFn(s);
    tallySchool(map[key], s);
  });
  return Object.values(map);
}

function districtRowsFromSchools(allSchools, fallbackDistricts) {
  const fromSchools = aggregateByKey(
    allSchools,
    (s) => String(s.districtId ?? s.district_id ?? ""),
    (s) => ({
      districtId: s.districtId ?? s.district_id ?? "",
      districtName: s.districtName ?? s.district_name ?? "",
      ...emptyCounts(),
    }),
  );

  if (fromSchools.length) {
    return fromSchools.sort((a, b) =>
      (a.districtName ?? "").localeCompare(b.districtName ?? ""),
    );
  }

  return (fallbackDistricts || [])
    .sort((a, b) => (a.districtName ?? "").localeCompare(b.districtName ?? ""))
    .map((d) => {
      const completed = d.completedSchools ?? d.completedVerification ?? 0;
      const started = d.startedSchools ?? d.pendingVerification ?? 0;
      const total = d.totalSchools ?? 0;
      return {
        districtId: d.districtId,
        districtName: d.districtName,
        total_schools: total,
        schools_started: completed + started,
        schools_pending: started,
        schools_completed: completed,
        schools_not_started: Math.max(
          0,
          total - (completed + started) || d.notStartedSchools || 0,
        ),
      };
    });
}

export function useExportDashboard() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");

  const exportToXlsx = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(isCacheValid() ? "Building workbook…" : "Fetching data…");

    try {
      const { allDistrictEntries, allSchools, blockBreakdown } =
        await prefetchExportData((info) => {
          if (info.phase === "dashboard") {
            setExportProgress("Fetching districts…");
          }
          if (info.phase === "schools") {
            setExportProgress(
              info.done === 0
                ? "Fetching school data…"
                : `Schools: ${info.done}/${info.total} districts…`,
            );
          }
        });

      setExportProgress("Building workbook…");

      const districtRows = districtRowsFromSchools(
        allSchools,
        allDistrictEntries,
      );

      const blockRowsFromSchools = aggregateByKey(
        allSchools,
        (s) => {
          const did = s.districtId ?? s.district_id ?? "";
          const bid = s.blockId ?? s.block_id ?? s.talukaId ?? s.taluka_id ?? "";
          return did && bid ? `${did}_${bid}` : "";
        },
        (s) => ({
          districtId: s.districtId ?? s.district_id ?? "",
          districtName: s.districtName ?? s.district_name ?? "",
          blockId: s.blockId ?? s.block_id ?? s.talukaId ?? s.taluka_id ?? "",
          blockName:
            s.blockName ?? s.block_name ?? s.talukaName ?? s.taluka ?? "",
          ...emptyCounts(),
        }),
      );

      const blockRows = (
        blockRowsFromSchools.length
          ? blockRowsFromSchools
          : (blockBreakdown || []).map((b) => {
              const completed = b.completed ?? b.completedVerification ?? 0;
              const inProgress = b.inProgress ?? b.started ?? 0;
              const pending = b.pending ?? b.notStarted ?? 0;
              const total = b.totalSchools ?? b.total ?? 0;
              return {
                districtId: b.districtId ?? "",
                districtName: b.districtName ?? "",
                blockId: b.blockId ?? "",
                blockName: b.blockName ?? "",
                total_schools: total,
                schools_started: completed + inProgress,
                schools_pending: inProgress + pending,
                schools_completed: completed,
                schools_not_started: Math.max(
                  0,
                  total - (completed + inProgress),
                ),
              };
            })
      ).sort(
        (a, b) =>
          (a.districtName ?? "").localeCompare(b.districtName ?? "") ||
          (a.blockName ?? "").localeCompare(b.blockName ?? ""),
      );

      const clusterRows = aggregateByKey(
        allSchools,
        (s) => {
          const cid = s.clusterId ?? s.cluster_id ?? s.clusterCode ?? "";
          const bid = s.blockId ?? s.block_id ?? s.talukaId ?? s.taluka_id ?? "";
          const did = s.districtId ?? s.district_id ?? "";
          return cid ? `${did}_${bid}_${cid}` : "";
        },
        (s) => ({
          districtId: s.districtId ?? s.district_id ?? "",
          districtName: s.districtName ?? s.district_name ?? "",
          blockId: s.blockId ?? s.block_id ?? s.talukaId ?? s.taluka_id ?? "",
          blockName:
            s.blockName ?? s.block_name ?? s.talukaName ?? s.taluka ?? "",
          clusterId: s.clusterId ?? s.cluster_id ?? s.clusterCode ?? "",
          clusterName:
            s.clusterName ?? s.cluster_name ?? s.clusterNameEn ?? "",
          ...emptyCounts(),
        }),
      ).sort(
        (a, b) =>
          (a.districtName ?? "").localeCompare(b.districtName ?? "") ||
          (a.blockName ?? "").localeCompare(b.blockName ?? "") ||
          (a.clusterName ?? "").localeCompare(b.clusterName ?? ""),
      );

      const schoolRows = allSchools
        .map((s) => {
          const { isCompleted, isInProgress, isPending, isNotStarted } =
            classifyStatus(s);
          return {
            districtId: s.districtId ?? s.district_id ?? "",
            districtName: s.districtName ?? s.district_name ?? "",
            blockId: s.blockId ?? s.block_id ?? s.talukaId ?? s.taluka_id ?? "",
            blockName:
              s.blockName ?? s.block_name ?? s.talukaName ?? s.taluka ?? "",
            clusterId: s.clusterId ?? s.cluster_id ?? s.clusterCode ?? "",
            clusterName:
              s.clusterName ?? s.cluster_name ?? s.clusterNameEn ?? "",
            schoolId: s.schoolId ?? s.school_id ?? s.udiseCode ?? "",
            schoolName:
              s.schoolName ?? s.school_name ?? s.schoolNameEn ?? "",
            total_schools: 1,
            schools_started:
              isCompleted || isInProgress || isPending ? 1 : 0,
            schools_pending: isPending || isInProgress ? 1 : 0,
            schools_completed: isCompleted ? 1 : 0,
            schools_not_started: isNotStarted ? 1 : 0,
          };
        })
        .sort(
          (a, b) =>
            (a.districtName ?? "").localeCompare(b.districtName ?? "") ||
            (a.blockName ?? "").localeCompare(b.blockName ?? "") ||
            (a.clusterName ?? "").localeCompare(b.clusterName ?? "") ||
            (a.schoolName ?? "").localeCompare(b.schoolName ?? ""),
        );

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "GSQAC Admin";
      workbook.company = "GSQAC";
      workbook.created = new Date();
      workbook.modified = new Date();

      buildSheet(workbook, "District", districtRows, [
        "districtId",
        "districtName",
        "total_schools",
        "schools_started",
        "schools_pending",
        "schools_completed",
        "schools_not_started",
      ]);
      buildSheet(workbook, "Block", blockRows, [
        "districtId",
        "districtName",
        "blockId",
        "blockName",
        "total_schools",
        "schools_started",
        "schools_pending",
        "schools_completed",
        "schools_not_started",
      ]);
      buildSheet(workbook, "Cluster", clusterRows, [
        "districtId",
        "districtName",
        "blockId",
        "blockName",
        "clusterId",
        "clusterName",
        "total_schools",
        "schools_started",
        "schools_pending",
        "schools_completed",
        "schools_not_started",
      ]);
      buildSheet(workbook, "School", schoolRows, [
        "districtId",
        "districtName",
        "blockId",
        "blockName",
        "clusterId",
        "clusterName",
        "schoolId",
        "schoolName",
        "total_schools",
        "schools_started",
        "schools_pending",
        "schools_completed",
        "schools_not_started",
      ]);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GSQAC_Dashboard_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "[useExportDashboard] Export failed:",
        err?.response?.data || err?.message,
        err,
      );
      enqueueSnackbar(
        err?.response?.data?.message ||
          err?.message ||
          "Export failed. Please try again.",
        { variant: "error" },
      );
    } finally {
      setIsExporting(false);
      setExportProgress("");
    }
  };

  return { exportToXlsx, isExporting, exportProgress };
}
