import React from "react";
import AppTable from "../../../../components/AppTable/AppTable";
import AppButton from "../../../../components/AppButton/AppButton";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function FeedbackTextCell({ text }) {
  const preview = text?.length > 120 ? `${text.slice(0, 120)}…` : text;
  return (
    <div className="pf-feedback-cell" title={text}>
      {preview || "—"}
    </div>
  );
}

export function ParentFeedbackPageView({ c }) {
  const {
    rows,
    total,
    isLoading,
    isError,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    handleItemsPerPageChange,
    search,
    handleSearchChange,
    exporting,
    handleExportToExcel,
  } = c;

  return (
    <div className="parent-feedback-container">
      <div className="pf-header">
        <div>
          <h1 className="pf-title">રજૂઆત / ફીડબેક</h1>
          <p className="pf-subtitle">
            Public submissions with school, district, block and selected SQAAF criteria
          </p>
        </div>
        <div className="pf-header-actions">
          <div className="pf-search-wrap">
            <input
              type="search"
              className="pf-search-input"
              placeholder="Search by name, school, district, or details..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <AppButton
            variant="plain"
            size="icon"
            iconOnly
            onClick={handleExportToExcel}
            disabled={exporting || isLoading}
            title="Download all submissions to Excel"
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
        </div>
      </div>

      <div className="pf-table-panel">
        <AppTable
          columns={[
            {
              id: "createdAt",
              label: "Submitted",
              render: (row) => formatDate(row.createdAt),
            },
            {
              id: "submitterName",
              label: "Name",
              render: (row) => row.submitterName || "—",
            },
            {
              id: "school",
              label: "School",
              render: (row) => (
                <div className="pf-school-cell">
                  <strong>{row.schoolName || "—"}</strong>
                  {row.schoolId && <span>{row.schoolId}</span>}
                </div>
              ),
            },
            {
              id: "location",
              label: "District / Block",
              render: (row) => (
                <div className="pf-school-cell">
                  <strong>{row.districtName || "—"}</strong>
                  {row.blockName ? <span>{row.blockName}</span> : null}
                </div>
              ),
            },
            {
              id: "criteria",
              label: "Criteria",
              render: (row) => (
                <div className="pf-school-cell">
                  <strong>{row.questionText || "—"}</strong>
                  <span>
                    {[row.domainName, row.subdomainName].filter(Boolean).join(" · ") ||
                      row.sectionName ||
                      ""}
                  </span>
                </div>
              ),
            },
            {
              id: "feedbackText",
              label: "રજૂઆત / ફીડબેક",
              render: (row) => <FeedbackTextCell text={row.feedbackText} />,
            },
            {
              id: "feedbackSource",
              label: "Source",
              render: (row) => (
                <span className="pf-source-chip">{row.feedbackSource || "public"}</span>
              ),
            },
          ]}
          data={rows}
          rowKey="feedbackId"
          loading={isLoading}
          isError={isError}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage + 1}
          onPageChange={(page) => setCurrentPage(page - 1)}
          onItemsPerPageChange={handleItemsPerPageChange}
          totalCount={total}
          serverSidePagination
          emptyTitle="No submissions yet"
          emptySubtitle="Submitted representation / feedback will appear here"
        />
      </div>
    </div>
  );
}
