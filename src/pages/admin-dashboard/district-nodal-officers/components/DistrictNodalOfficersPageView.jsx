import React from "react";
import { DistrictNodalOfficersHeaderSection } from "./DistrictNodalOfficersHeaderSection";
import { DistrictNodalOfficersStatsSection } from "./DistrictNodalOfficersStatsSection";
import { DistrictNodalOfficersSearchBar } from "./DistrictNodalOfficersSearchBar";
import { DistrictNodalOfficersTableSection } from "./DistrictNodalOfficersTableSection";
import { DistrictNodalOfficerModal } from "./DistrictNodalOfficerModal";

export function DistrictNodalOfficersPageView({ c }) {
  const {
    isModalOpen,
    editingOfficer,
    searchQuery,
    currentPage,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
    isLoading,
    isError,
    filteredOfficers,
    columns,
    renderActions,
    totalCount,
    activeCount,
    inactiveCount,
    handleExportToExcel,
    handleOpenModal,
    handleCloseModal,
    handleFormSubmit,
    handleSearchChange,
    getInitialValues,
    validationSchema,
    districts,
    districtsLoading,
    upsertMutation,
  } = c;

  return (
    <div className="district-nodal-officers-container">
      <div className="header-section">
        <DistrictNodalOfficersHeaderSection
          onExport={handleExportToExcel}
          onAdd={handleOpenModal}
        />

        <DistrictNodalOfficersStatsSection
          totalCount={totalCount}
          activeCount={activeCount}
          inactiveCount={inactiveCount}
        />

        <DistrictNodalOfficersSearchBar
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <DistrictNodalOfficersTableSection
        isLoading={isLoading}
        isError={isError}
        filteredOfficers={filteredOfficers}
        columns={columns}
        renderActions={renderActions}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(newSize) => {
          setItemsPerPage(newSize);
          setCurrentPage(0);
        }}
        totalCount={totalCount}
        searchQuery={searchQuery}
      />

      <DistrictNodalOfficerModal
        open={isModalOpen}
        editingOfficer={editingOfficer}
        onClose={handleCloseModal}
        getInitialValues={getInitialValues}
        validationSchema={validationSchema}
        onSubmit={handleFormSubmit}
        districtsLoading={districtsLoading}
        districts={districts}
        upsertMutation={upsertMutation}
      />
    </div>
  );
}
