import React from "react";
import AppTable from "../../../../components/AppTable/AppTable";

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
    refetch,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    handleItemsPerPageChange,
    search,
    handleSearchChange,
  } = c;

  return (
    <div className="parent-feedback-container">
      <div className="pf-header">
        <div>
          <h1 className="pf-title">Parent Feedback</h1>
          <p className="pf-subtitle">
            Feedback and grievances submitted from the public portal
          </p>
        </div>
        <div className="pf-search-wrap">
          <input
            type="search"
            className="pf-search-input"
            placeholder="Search by name, school, mobile, or feedback..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
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
              id: "mobileNumber",
              label: "Mobile",
              render: (row) => row.mobileNumber || "—",
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
              id: "feedbackText",
              label: "Feedback",
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
          emptyTitle="No feedback yet"
          emptySubtitle="Submitted parent feedback will appear here"
        />
      </div>
    </div>
  );
}
