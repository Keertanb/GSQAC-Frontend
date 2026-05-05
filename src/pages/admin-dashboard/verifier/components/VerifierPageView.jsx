import React from "react";
import AppTable from "../../../../components/AppTable/AppTable";
import AppButton from "../../../../components/AppButton/AppButton";

export function VerifierPageView({ c }) {
  const {
    isModalOpen,
    editingVerifier,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    formData,
    setFormData,
    isLoading,
    isError,
    districts,
    upsertMutation,
    filteredVerifiers,
    totalCount,
    columns,
    renderActions,
    totalVerifierCount,
    activeVerifierCount,
    inactiveVerifierCount,
    handleExportToExcel,
    handleOpenModal,
    handleCloseModal,
    handleSubmit,
    handleInputChange,
  } = c;

  return (
    <div className="verifier-container">
      {/* Header Section */}
      <div className="verifier-header-section">
        <div className="verifier-header-content">
          <div>
            <h1 className="verifier-header-title">Verifier Management</h1>
            <p className="verifier-header-subtitle">
              Manage verifiers and their assignments
            </p>
          </div>
          <div className="verifier-header-actions">
            <AppButton
              variant="plain"
              size="icon"
              iconOnly
              onClick={handleExportToExcel}
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
              onClick={handleOpenModal}
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
              Add Verifier
            </AppButton>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="verifier-stats-grid">
          <div className="verifier-stat-card verifier-stat-card-blue">
            <div>
              <p className="verifier-stat-label verifier-stat-label-blue">
                Total Verifiers
              </p>
              <p className="verifier-stat-value verifier-stat-value-blue">
                {totalVerifierCount}
              </p>
            </div>
            <div className="verifier-stat-icon verifier-stat-icon-blue">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
          </div>

          <div className="verifier-stat-card verifier-stat-card-green">
            <div>
              <p className="verifier-stat-label verifier-stat-label-green">
                Active Verifiers
              </p>
              <p className="verifier-stat-value verifier-stat-value-green">
                {activeVerifierCount}
              </p>
            </div>
            <div className="verifier-stat-icon verifier-stat-icon-green">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          <div className="verifier-stat-card verifier-stat-card-orange">
            <div>
              <p className="verifier-stat-label verifier-stat-label-orange">
                Inactive Verifiers
              </p>
              <p className="verifier-stat-value verifier-stat-value-orange">
                {inactiveVerifierCount}
              </p>
            </div>
            <div className="verifier-stat-icon verifier-stat-icon-orange">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="verifier-search-container">
          <svg
            className="verifier-search-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by name or mobile number..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0); // Reset to first page when search changes
            }}
            className="verifier-search-input"
          />
        </div>
      </div>

      {/* Verifiers List */}
      {isLoading ? (
        <div className="verifier-loading-container">
          <div className="verifier-loading-spinner"></div>
        </div>
      ) : isError ? (
        <div className="verifier-error-container">
          <p className="verifier-error-message">
            Failed to load verifiers. Please try again.
          </p>
        </div>
      ) : filteredVerifiers.length === 0 ? (
        <div className="verifier-empty-container">
          <div className="verifier-empty-icon-container">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <p className="verifier-empty-title">No verifiers found</p>
          <p className="verifier-empty-subtitle">
            {searchQuery
              ? "Try adjusting your search query"
              : "Click 'Add Verifier' to get started"}
          </p>
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={filteredVerifiers}
          rowKey="userId"
          loading={isLoading}
          isError={isError}
          renderActions={renderActions}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage + 1}
          onPageChange={(page) => setCurrentPage(page - 1)}
          onItemsPerPageChange={(newSize) => {
            setItemsPerPage(newSize);
            setCurrentPage(0);
          }}
          totalCount={totalCount}
          serverSidePagination={true}
          emptyTitle="No verifiers found"
          emptySubtitle={
            searchQuery
              ? "Try adjusting your search query"
              : "Click 'Add Verifier' to get started"
          }
          emptyIcon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          }
        />
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="verifier-modal-overlay">
          <div className="verifier-modal-content">
            <div className="verifier-modal-header">
              <h2 className="verifier-modal-title">
                {editingVerifier ? "Edit Verifier" : "Add Verifier"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="verifier-modal-close-button"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="verifier-modal-form">
              <div className="verifier-form-group">
                <label className="verifier-form-label">
                  User Name{" "}
                  <span className="verifier-form-label-required">*</span>
                </label>
                <input
                  type="text"
                  name="userName"
                  value={formData.userName}
                  onChange={handleInputChange}
                  required
                  className="verifier-form-input"
                  placeholder="Enter user name"
                />
              </div>

              <div className="verifier-form-group">
                <label className="verifier-form-label">
                  Mobile Number{" "}
                  <span className="verifier-form-label-required">*</span>
                </label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  required
                  className="verifier-form-input"
                  placeholder="Enter mobile number"
                />
              </div>

              <div className="verifier-form-group">
                <div className="verifier-form-label-container">
                  <label className="verifier-form-label">
                    Districts{" "}
                    <span className="verifier-form-label-required">*</span>
                  </label>
                  {formData.districts?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          districts: [],
                        }));
                      }}
                      className="verifier-clear-districts-button"
                      title="Clear all districts"
                    >
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                {districts.length === 0 ? (
                  <div className="verifier-form-loading">
                    Loading districts...
                  </div>
                ) : (
                  <div className="district-multiselect-container">
                    <div className="district-multiselect">
                      {districts.map((district) => {
                        const isSelected = formData.districts?.includes(
                          Number(district.value)
                        );
                        return (
                          <label
                            key={district.value}
                            className={`district-checkbox-label ${
                              isSelected ? "district-checkbox-selected" : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                const districtValueNum = Number(district.value);
                                const currentDistricts =
                                  formData.districts || [];
                                const isSelected =
                                  currentDistricts.includes(districtValueNum);

                                if (isSelected) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    districts: currentDistricts.filter(
                                      (id) => id !== districtValueNum
                                    ),
                                  }));
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    districts: [
                                      ...currentDistricts,
                                      districtValueNum,
                                    ],
                                  }));
                                }
                              }}
                              className="district-checkbox"
                            />
                            <span className="district-checkbox-text">
                              {district.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {formData.districts?.length > 0 && (
                      <div className="selected-districts-info">
                        {formData.districts.length} district
                        {formData.districts.length > 1 ? "s" : ""} selected
                      </div>
                    )}
                    {formData.districts?.length === 0 && (
                      <div className="verifier-form-error">
                        At least one district must be selected
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="verifier-form-group">
                <label className="verifier-form-label">Status</label>
                <select
                  name="isActive"
                  value={formData.isActive}
                  onChange={handleInputChange}
                  className="verifier-form-select"
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>

              <div className="verifier-modal-actions">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="verifier-modal-button verifier-modal-button-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={upsertMutation.isPending}
                  className="verifier-modal-button verifier-modal-button-submit"
                >
                  {upsertMutation.isPending
                    ? "Saving..."
                    : editingVerifier
                    ? "Update"
                    : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
