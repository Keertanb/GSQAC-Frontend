import React from "react";
import AppButton from "../../../../components/AppButton/AppButton";

export function DistrictNodalOfficersHeaderSection({
  onExport,
  onAdd,
}) {
  return (
    <div className="header-content">
        <div>
          <h1 className="header-title">District Nodal Officers</h1>
          <p className="header-subtitle">
            Manage district nodal officers and their details
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <AppButton
            variant="plain"
            size="icon"
            iconOnly
            onClick={onExport}
            title="Export to Excel"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
          />
          <AppButton
            variant="blue"
            size="sm"
            onClick={onAdd}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            }
          >
            Add Nodal Officer
          </AppButton>
        </div>
      </div>
  );
}
