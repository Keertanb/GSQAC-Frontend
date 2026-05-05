import React from "react";
import { Box, Typography, TextField, InputAdornment, Button } from "@mui/material";
import { Search, Assignment } from "@mui/icons-material";
import AppTable from "../../../../components/AppTable/AppTable";
import { colors } from "../../../../constants/colors";
import "../SchoolAssessment.css";

export function SchoolAssessmentPageView({ c }) {
  const { navigate, searchQuery, setSearchQuery, currentPage, setCurrentPage, itemsPerPage, setItemsPerPage, userName, schoolsData, isLoading, isError, schools, totalCount, summary, filteredSchools, totalSchools, completedSchools, pendingSchools, handleStartAssessment, columns } = c;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: colors.text.primary,
            mb: 1,
          }}
        >
          School Assessment
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select a school to start or continue assessment
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ mb: 4 }}>
        <div className="school-assessment-stats-grid">
          <div className="school-assessment-stat-card school-assessment-stat-card-blue">
            <div>
              <p className="school-assessment-stat-label school-assessment-stat-label-blue">
                Total Schools
              </p>
              <p className="school-assessment-stat-value school-assessment-stat-value-blue">
                {totalSchools}
              </p>
            </div>
            <div className="school-assessment-stat-icon school-assessment-stat-icon-blue">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>

          <div className="school-assessment-stat-card school-assessment-stat-card-green">
            <div>
              <p className="school-assessment-stat-label school-assessment-stat-label-green">
                Completed
              </p>
              <p className="school-assessment-stat-value school-assessment-stat-value-green">
                {completedSchools}
              </p>
            </div>
            <div className="school-assessment-stat-icon school-assessment-stat-icon-green">
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

          <div className="school-assessment-stat-card school-assessment-stat-card-orange">
            <div>
              <p className="school-assessment-stat-label school-assessment-stat-label-orange">
                Pending Assessment
              </p>
              <p className="school-assessment-stat-value school-assessment-stat-value-orange">
                {pendingSchools}
              </p>
            </div>
            <div className="school-assessment-stat-icon school-assessment-stat-icon-orange">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search by school name, ID, district, block, cluster, or village..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{
            bgcolor: "white",
            borderRadius: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
        />
      </Box>

      {/* Schools Table */}
      <AppTable
        columns={columns}
        data={filteredSchools}
        rowKey="schoolId"
        loading={isLoading}
        isError={isError}
        renderActions={(school) => (
          <Button
            variant="contained"
            size="small"
            startIcon={<Assignment />}
            onClick={() => handleStartAssessment(school)}
            sx={{
              bgcolor: "#2563eb",
              "&:hover": {
                bgcolor: "#1d4ed8",
              },
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
              px: 2,
              py: 0.75,
            }}
          >
            Start Assessment
          </Button>
        )}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={(page) => {
          setCurrentPage(page);
        }}
        onItemsPerPageChange={(newItemsPerPage) => {
          setItemsPerPage(newItemsPerPage);
          setCurrentPage(1); // Reset to first page when items per page changes
        }}
        totalCount={searchQuery ? filteredSchools.length : totalCount}
        serverSidePagination={!searchQuery} // Use server-side pagination when no search query
        emptyTitle="No schools found"
        emptySubtitle={
          searchQuery
            ? "Try adjusting your search query"
            : "No schools have been allocated to you"
        }
      />
    </Box>
  );
}
