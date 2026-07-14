import { matchDistrictKey, getCompletionColor, getCompletionTone } from "./gujaratDistrictUtils";

/**
 * Build a map of districtKey → self-assessment stats for the map.
 * Mirrors buildDistrictMapStats but for self-assessment data.
 *
 * @param {Array} ssamSummaryList  - Array of { districtId, districtName, submitted, pending, notStarted, total, submissionRate }
 * @param {Array} districts        - Master districts list from /admin/districts
 * @returns {Object} statsByKey
 */
export function buildSelfAssessmentDistrictStats(ssamSummaryList = [], districts = []) {
  const statsByKey = {};

  (ssamSummaryList || []).forEach((item) => {
    const key = matchDistrictKey(item.districtName);
    if (!key) return;

    const submitted = item.submitted ?? 0;
    const pending = item.pending ?? 0;
    const notStarted = item.notStarted ?? 0;
    const total = item.total ?? submitted + pending + notStarted;
    const rate = total > 0 ? Math.round((submitted / total) * 100) : 0;

    statsByKey[key] = {
      districtId: item.districtId,
      districtName: item.districtName,
      submitted,
      pending,
      notStarted,
      total,
      submissionRate: item.submissionRate ?? rate,
      hasData: total > 0,
    };
  });

  // Fill in districts that have no SSAM data so they appear as "No data" on the map
  districts.forEach((district) => {
    const key = matchDistrictKey(district.name);
    if (!key || statsByKey[key]) return;

    statsByKey[key] = {
      districtId: district.value,
      districtName: district.name,
      submitted: 0,
      pending: 0,
      notStarted: 0,
      total: 0,
      submissionRate: 0,
      hasData: false,
    };
  });

  return statsByKey;
}

/**
 * Build a block-level stats map for self-assessment mode.
 * Each item in blockBreakdown from the SSAM API has:
 *   { blockId, blockName, submitted, pending, notStarted }
 *
 * @param {Array} blockBreakdown
 * @returns {Object} statsByBlockId
 */
export function buildSelfAssessmentBlockStats(blockBreakdown = []) {
  const statsByBlockId = {};

  (blockBreakdown || []).forEach((block) => {
    const submitted = block.submitted ?? 0;
    const pending = block.pending ?? 0;
    const notStarted = block.notStarted ?? 0;
    const total = block.total ?? submitted + pending + notStarted;
    const rate = total > 0 ? Math.round((submitted / total) * 100) : 0;

    statsByBlockId[String(block.blockId)] = {
      blockId: block.blockId,
      blockName: block.blockName,
      submitted,
      pending,
      notStarted,
      total,
      submissionRate: rate,
      hasData: total > 0,
      fill: getCompletionColor(rate, total > 0),
      tone: getCompletionTone(rate, total > 0),
    };
  });

  return statsByBlockId;
}

/**
 * Get fill color for a self-assessment stat object.
 * Reuses the same completion color scale as verification mode.
 */
export function getSelfAssessmentColor(submissionRate, hasData) {
  return getCompletionColor(submissionRate, hasData);
}

/**
 * Get tone string for a self-assessment stat object.
 */
export function getSelfAssessmentTone(submissionRate, hasData) {
  return getCompletionTone(submissionRate, hasData);
}
