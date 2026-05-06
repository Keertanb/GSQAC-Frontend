import React from "react";
import AppTable from "../../../../components/AppTable/AppTable";

const emptyIcon = (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

export function DistrictNodalOfficersTableSection({
  isLoading,
  isError,
  filteredOfficers,
  columns,
  renderActions,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
  totalCount,
  searchQuery,
}) {
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="error-container">
        <p className="error-message">
          Failed to load district nodal officers. Please try again.
        </p>
      </div>
    );
  }

  if (filteredOfficers.length === 0) {
    return (
      <div className="empty-container">
        <div className="empty-icon-container">{emptyIcon}</div>
        <p className="empty-title">No district nodal officers found</p>
        <p className="empty-subtitle">
          {searchQuery
            ? "Try adjusting your search query"
            : "Click 'Add Nodal Officer' to get started"}
        </p>
      </div>
    );
  }

  return (
    <AppTable
      columns={columns}
      data={filteredOfficers}
      rowKey="userId"
      loading={isLoading}
      isError={isError}
      renderActions={renderActions}
      itemsPerPage={itemsPerPage}
      currentPage={currentPage + 1}
      onPageChange={(page) => onPageChange(page - 1)}
      onItemsPerPageChange={onItemsPerPageChange}
      totalCount={totalCount}
      serverSidePagination={true}
      emptyTitle="No district nodal officers found"
      emptySubtitle={
        searchQuery
          ? "Try adjusting your search query"
          : "Click 'Add Nodal Officer' to get started"
      }
      emptyIcon={emptyIcon}
    />
  );
}
