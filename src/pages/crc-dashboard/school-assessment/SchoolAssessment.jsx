import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
} from "@mui/material";
import {
  Search,
  Assignment,
} from "@mui/icons-material";
import { useGetSchoolListQuery } from "../../../services/adminService";
import useAuthStore from "../../../store/useAuthStore";
import { colors } from "../../../constants/colors";
import AppTable from "../../../components/AppTable/AppTable";

const SchoolAssessment = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1); // AppTable uses 1-based pagination
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { userName } = useAuthStore();

  // Fetch schools using clusterId (loggedInUsername)
  // API uses 0-based pagination, so convert from 1-based (AppTable) to 0-based (API)
  const {
    data: schoolsData,
    isLoading,
    isError,
  } = useGetSchoolListQuery(
    {
      clusterId: userName || undefined,
      page: currentPage - 1, // Convert to 0-based for API
      limit: itemsPerPage,
    },
    !!userName
  );

  // Get schools from API response - API returns data.rows
  const schools = schoolsData?.data?.rows || [];
  const totalCount = schoolsData?.data?.total || 0;

  // Filter schools based on search query (client-side filtering)
  const filteredSchools = useMemo(() => {
    if (!searchQuery) return schools;
    const query = searchQuery.toLowerCase();
    return schools.filter((school) => {
      return (
        school.schoolName?.toLowerCase().includes(query) ||
        school.schoolId?.toLowerCase().includes(query) ||
        school.districtName?.toLowerCase().includes(query) ||
        school.blockName?.toLowerCase().includes(query) ||
        school.clusterName?.toLowerCase().includes(query) ||
        school.villageName?.toLowerCase().includes(query)
      );
    });
  }, [schools, searchQuery]);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleStartAssessment = (school) => {
    // Navigate to assessment screen with school info
    // Use schoolId from API response
    const schoolId = school.schoolId;
    navigate(`/crc-dashboard/school-assessment/${schoolId}`, {
      state: { school },
    });
  };

  // Define table columns
  const columns = [
    {
      id: "schoolId",
      label: "School ID",
      render: (school) => (
        <span style={{ fontWeight: 600, color: colors.text.primary }}>
          {school.schoolId || "-"}
        </span>
      ),
    },
    {
      id: "schoolName",
      label: "School Name",
      render: (school) => (
        <span style={{ color: colors.text.primary }}>
          {school.schoolName || "-"}
        </span>
      ),
    },
    {
      id: "districtName",
      label: "District",
      render: (school) => school.districtName || "-",
    },
    {
      id: "blockName",
      label: "Block",
      render: (school) => school.blockName || "-",
    },
    {
      id: "clusterName",
      label: "Cluster",
      render: (school) => school.clusterName || "-",
    },
    {
      id: "villageName",
      label: "Village",
      render: (school) => school.villageName || "-",
    },
  ];

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
              bgcolor: colors.primary.blue,
              "&:hover": {
                bgcolor: colors.primary.dark,
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
};

export default SchoolAssessment;

