import React from "react";
import "./AppTable.css";

/**
 * AppTable Component - Reusable table component with pagination and actions
 *
 * @param {Object} props
 * @param {Array} props.columns - Array of column definitions { id, label, render }
 * @param {Array} props.data - Array of data objects
 * @param {string|Function} props.rowKey - Key to use as unique identifier for rows
 * @param {boolean} props.loading - Show loading state
 * @param {boolean} props.isError - Show error state
 * @param {Function} props.renderActions - Function to render actions column (row) => JSX
 * @param {number} props.itemsPerPage - Number of items per page (default: 10)
 * @param {number} props.currentPage - Current page number (default: 1)
 * @param {Function} props.onPageChange - Handler for page change (page) => void
 * @param {Function} props.onItemsPerPageChange - Handler for items per page change (itemsPerPage) => void (optional)
 * @param {number} props.totalCount - Total count for server-side pagination (optional)
 * @param {boolean} props.serverSidePagination - Use server-side pagination (default: false)
 * @param {string} props.emptyTitle - Title for empty state
 * @param {string} props.emptySubtitle - Subtitle for empty state
 * @param {JSX.Element} props.emptyIcon - Custom icon for empty state
 * @param {string} props.tableClassName - Additional class name for table
 * @param {string} props.containerClassName - Additional class name for container
 */
const AppTable = ({
  columns = [],
  data = [],
  rowKey = "id",
  loading = false,
  isError = false,
  renderActions,
  itemsPerPage = 10,
  currentPage = 1,
  onPageChange,
  onItemsPerPageChange,
  totalCount,
  serverSidePagination = false,
  emptyTitle = "No records found",
  emptySubtitle = "No data available",
  emptyIcon,
  tableClassName = "",
  containerClassName = "",
}) => {
  // Calculate pagination
  const totalItems =
    serverSidePagination && totalCount !== undefined ? totalCount : data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = serverSidePagination
    ? data
    : data.slice(startIndex, endIndex);

  // Get row key value
  const getRowKey = (row, index) => {
    if (typeof rowKey === "function") {
      return rowKey(row, index);
    }
    return row[rowKey] || index;
  };

  // Default empty icon
  const defaultEmptyIcon = (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );

  if (loading) {
    return (
      <div className="app-table-loading-container">
        <div className="app-table-loading-spinner"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="app-table-error-container">
        <p className="app-table-error-message">
          Failed to load data. Please try again.
        </p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="app-table-empty-container">
        <div className="app-table-empty-icon-container">
          {emptyIcon || defaultEmptyIcon}
        </div>
        <p className="app-table-empty-title">{emptyTitle}</p>
        <p className="app-table-empty-subtitle">{emptySubtitle}</p>
      </div>
    );
  }

  return (
    <div className={`app-table-container ${containerClassName}`}>
      <div className="app-table-wrapper">
        <table className={`app-table ${tableClassName}`}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={`app-table-header ${column.headerClassName || ""}`}
                  style={column.headerStyle}
                >
                  {column.label}
                </th>
              ))}
              {renderActions && (
                <th className="app-table-header app-table-actions-header">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => (
              <tr
                key={getRowKey(row, startIndex + index)}
                className="app-table-row"
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={`app-table-cell ${column.cellClassName || ""}`}
                    style={column.cellStyle}
                  >
                    {column.render
                      ? column.render(row, startIndex + index)
                      : row[column.id] || "-"}
                  </td>
                ))}
                {renderActions && (
                  <td className="app-table-cell app-table-actions-cell">
                    <div className="app-table-actions">
                      {renderActions(row, startIndex + index)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(totalPages > 1 || onItemsPerPageChange) && onPageChange && (
        <div className="app-table-pagination-container">
          {onItemsPerPageChange && (
            <div className="app-table-pagination-rows-per-page">
              <label className="app-table-pagination-rows-label">
                Rows per page:
              </label>
              <select
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                className="app-table-pagination-rows-select"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>
          )}
          {totalPages > 1 && (
            <div className="app-table-pagination-info">
              Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of{" "}
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </div>
          )}
          {totalPages > 1 && (
            <div className="app-table-pagination-controls">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="app-table-pagination-button app-table-pagination-prev"
              >
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  className="app-table-pagination-icon"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Previous
              </button>

              <div className="app-table-pagination-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => onPageChange(page)}
                          className={`app-table-pagination-number ${
                            currentPage === page
                              ? "app-table-pagination-active"
                              : ""
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span
                          key={page}
                          className="app-table-pagination-ellipsis"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  }
                )}
              </div>

              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="app-table-pagination-button app-table-pagination-next"
              >
                Next
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  className="app-table-pagination-icon"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppTable;
