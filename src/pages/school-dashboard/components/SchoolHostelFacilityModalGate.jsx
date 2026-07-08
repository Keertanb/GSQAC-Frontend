import React from "react";
import { HostelFacilityModal } from "../self-assessment/components/HostelFacilityModal";
import { useSchoolHostelFacilityGate } from "../hooks/useSchoolHostelFacilityGate";

/**
 * Renders the one-time hostel facility modal for school users after login.
 * Mount once per school dashboard page (or layout).
 */
export function SchoolHostelFacilityModalGate() {
  const {
    showHostelFacilityModal,
    handleConfirmHostelFacility,
    isSavingHostelFacility,
  } = useSchoolHostelFacilityGate();

  return (
    <HostelFacilityModal
      open={showHostelFacilityModal}
      onConfirm={handleConfirmHostelFacility}
      isLoading={isSavingHostelFacility}
    />
  );
}
