import React from "react";
import { GujaratSatelliteMap } from "../GujaratSatelliteMap";

export function GeographyTab({ c }) {
  const {
    districts,
    statewideDistrictBreakdown,
    blockBreakdown,
    districtId,
    blockId,
    schoolId,
    handleDistrictSelect,
    handleBlockSelect,
    handleSchoolSelect,
    handleClearDistrict,
    handleClearBlock,
  } = c;

  return (
    <div className="ado-tab-panel-inner">
      <GujaratSatelliteMap
        districts={districts}
        districtBreakdown={statewideDistrictBreakdown}
        blockBreakdown={blockBreakdown}
        selectedDistrictId={districtId}
        selectedBlockId={blockId}
        selectedSchoolId={schoolId}
        onDistrictSelect={handleDistrictSelect}
        onBlockSelect={handleBlockSelect}
        onSchoolSelect={handleSchoolSelect}
        onClearSelection={handleClearDistrict}
        onClearBlock={handleClearBlock}
      />
    </div>
  );
}
