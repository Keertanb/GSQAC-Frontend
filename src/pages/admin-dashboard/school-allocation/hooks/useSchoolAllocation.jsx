import React, { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAllDistrictsQuery,
  useGetDistrictWiseBlocksQuery,
  useGetSchoolListQuery,
  useGetVerifiersByDistrictQuery,
  useSaveSchoolAllocationMutation,
} from "../../../../services/adminService";
import { exportToExcel } from "../../../../utils/exportToExcel";

const normalizeAllocationDate = (value) => {
  if (value == null || value === "") return "";
  const str = String(value);
  return str.includes("T") ? str.split("T")[0] : str.slice(0, 10);
};

export function useSchoolAllocation() {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    schoolId: "",
    schoolName: "",
    districtId: "",
    blockId: "",
    clusterId: "",
    villageId: "",
    status: "",
  });

  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Store assignments for each school: { schoolId: { id, verifierId, verifierCode, date, status } }
  const [schoolAssignments, setSchoolAssignments] = useState({});
  
  // Store original assignment values to detect changes
  // { schoolId: { verifierId, date } }
  const [originalAssignments, setOriginalAssignments] = useState({});

  // Mutation for saving school allocation
  const saveAllocationMutation = useSaveSchoolAllocationMutation({
    onSuccess: (data, payload) => {
      // Update the assignment with the returned id and status if available
      const returnedId = data?.data?.id || data?.data?.allocationId || data?.id;
      if (payload?.schoolId) {
        setSchoolAssignments((prev) => ({
          ...prev,
          [payload.schoolId]: {
            ...prev[payload.schoolId],
            id: returnedId || prev[payload.schoolId]?.id,
            status: payload.status || "Allocated",
            date: normalizeAllocationDate(payload.allocatedDate),
            verifierId: String(payload.userId),
          },
        }));
        
        // Update original assignment after successful save
        setOriginalAssignments((prev) => ({
          ...prev,
          [payload.schoolId]: {
            verifierId: String(payload.userId),
            date: normalizeAllocationDate(payload.allocatedDate),
          },
        }));

        queryClient.invalidateQueries({ queryKey: ["admin", "school-list"] });
      }
    },
  });

  // Fetch districts
  const { data: districtsData } = useGetAllDistrictsQuery();
  const districts = districtsData?.data || [];

  // Fetch blocks when district is selected
  const { data: blocksData } = useGetDistrictWiseBlocksQuery(
    filters.districtId
  );
  const blocks = blocksData?.data || [];

  // Fetch schools based on filters
  const { data: schoolsData, isLoading: isLoadingSchools } =
    useGetSchoolListQuery(
      {
        blockId: filters.blockId ? Number(filters.blockId) : undefined,
        clusterId: filters.clusterId || undefined,
        villageId: filters.villageId ? Number(filters.villageId) : undefined,
        status: filters.status || undefined,
        page: currentPage,
        limit: itemsPerPage,
      },
      true
    );

  const schools = schoolsData?.data?.rows || [];
  const totalSchools = schoolsData?.data?.total || 0;

  // Initialize school assignments from API data when schools are loaded
  useEffect(() => {
    if (schools.length === 0) return;

    const originalUpdates = {};

    setSchoolAssignments((prev) => {
      const updated = { ...prev };

      for (const school of schools) {
        const schoolId = school.schoolId;
        const existingAssignment = updated[schoolId];
        const isApiAllocated =
          school.status === "Allocated" &&
          school.userId &&
          school.allocatedDate;

        if (isApiAllocated) {
          const verifierId = String(school.userId);
          const date = normalizeAllocationDate(school.allocatedDate);
          const shouldUpdate =
            !existingAssignment ||
            String(existingAssignment.verifierId || "") !== verifierId ||
            normalizeAllocationDate(existingAssignment.date) !== date;

          if (shouldUpdate) {
            updated[schoolId] = {
              verifierId,
              date,
              status: "Allocated",
              id:
                school.id ||
                school.allocationId ||
                existingAssignment?.id ||
                null,
            };
          } else if (existingAssignment) {
            updated[schoolId] = {
              ...existingAssignment,
              status: "Allocated",
            };
          }

          originalUpdates[schoolId] = { verifierId, date };
          continue;
        }

        // Keep locally saved allocation when API row is still pending (e.g. after filter refetch)
        if (existingAssignment?.status === "Allocated") {
          originalUpdates[schoolId] = {
            verifierId: String(existingAssignment.verifierId || ""),
            date: normalizeAllocationDate(existingAssignment.date),
          };
          continue;
        }

        if (school.status === "Pending" || !school.status) {
          if (!existingAssignment) {
            updated[schoolId] = { status: "Pending" };
          } else if (!existingAssignment.status) {
            updated[schoolId] = {
              ...existingAssignment,
              status: "Pending",
            };
          }
          originalUpdates[schoolId] = { verifierId: "", date: "" };
        }
      }

      return updated;
    });

    setOriginalAssignments((prev) => ({ ...prev, ...originalUpdates }));
  }, [schools]);

  // Get district ID from selected district filter
  const selectedDistrictId = useMemo(() => {
    if (!filters.districtId) return null;
    const district = districts.find(
      (d) => String(d.value) === String(filters.districtId)
    );
    return district?.value || null;
  }, [filters.districtId, districts]);

  // Fetch verifiers by district
  const { data: verifiersData } =
    useGetVerifiersByDistrictQuery(selectedDistrictId);
  const verifiers = verifiersData?.data || [];

  // Filter schools based on client-side filters (schoolId, schoolName, status)
  const filteredSchools = useMemo(() => {
    return schools.filter((school) => {
      const matchesSchoolId =
        !filters.schoolId ||
        school.schoolId.toString().includes(filters.schoolId) ||
        school.schoolId.includes(filters.schoolId);
      const matchesSchoolName =
        !filters.schoolName ||
        school.schoolName
          .toLowerCase()
          .includes(filters.schoolName.toLowerCase());

      // Filter by status
      const assignment = schoolAssignments[school.schoolId] || {};
      const schoolStatus = assignment.status || school.status || "Pending";
      const matchesStatus = !filters.status || schoolStatus === filters.status;

      return matchesSchoolId && matchesSchoolName && matchesStatus;
    });
  }, [
    schools,
    filters.schoolId,
    filters.schoolName,
    filters.status,
    schoolAssignments,
  ]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [field]: value };
      // Reset dependent filters
      if (field === "districtId") {
        newFilters.blockId = "";
        newFilters.clusterId = "";
        newFilters.villageId = "";
      }
      if (field === "blockId") {
        newFilters.clusterId = "";
        newFilters.villageId = "";
      }
      // Reset to first page when filters change
      setCurrentPage(0);
      return newFilters;
    });
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(0); // Reset to first page when changing items per page
  };

  const handleAssignmentChange = (schoolId, field, value) => {
    setSchoolAssignments((prev) => ({
      ...prev,
      [schoolId]: {
        ...prev[schoolId],
        [field]: value,
      },
    }));
    
    // Clear original assignment when user makes changes (enables save button)
    setOriginalAssignments((prev) => {
      const updated = { ...prev };
      if (updated[schoolId]) {
        // Mark as changed by clearing original values
        updated[schoolId] = {
          verifierId: "",
          date: "",
        };
      }
      return updated;
    });
  };

  const handleSaveAssignment = (schoolId) => {
    const assignment = schoolAssignments[schoolId];
    if (!assignment?.verifierId || !assignment?.date) {
      alert("Please select verifier and assignment date");
      return;
    }

    // Find the school to get districtId
    const school = filteredSchools.find((s) => s.schoolId === schoolId);
    const districtId = school?.districtId || null;

    // Prepare payload according to API specification
    const payload = {
      id: assignment.id || null,
      schoolId: schoolId,
      userId: Number(assignment.verifierId),
      status: "Allocated",
      allocatedDate: assignment.date,
      districtId: districtId ? Number(districtId) : null,
    };

    // Call the API
    saveAllocationMutation.mutate(payload);
  };

  // Handle Excel export
  const handleExportToExcel = () => {
    if (filteredSchools.length === 0) {
      alert("No data to export");
      return;
    }

    // Prepare columns for export
    const exportColumns = [
      { key: "schoolName", label: "School Name" },
      { key: "schoolId", label: "School ID" },
      { key: "district", label: "District" },
      { key: "block", label: "Block" },
      { key: "verifier", label: "Verifier" },
      { key: "assignmentDate", label: "Assignment Date" },
    ];

    // Transform data for export
    const exportData = filteredSchools.map((school) => {
      const assignment = schoolAssignments[school.schoolId] || {};
      const verifier = verifiers.find(
        (v) => String(v.userId) === String(assignment.verifierId)
      );
      return {
        schoolName: school.schoolName || "-",
        schoolId: school.schoolId || "-",
        district: school.districtName || "-",
        block: school.blockName || "-",
        verifier: verifier ? verifier.userName : "-",
        assignmentDate: assignment.date || "-",
      };
    });

    exportToExcel(
      exportData,
      exportColumns,
      "school-allocation",
      "School Allocation"
    );
  };


  return {
    filters,
    setFilters,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    schoolAssignments,
    setSchoolAssignments,
    originalAssignments,
    setOriginalAssignments,
    saveAllocationMutation,
    districtsData,
    districts,
    blocksData,
    blocks,
    schoolsData,
    isLoadingSchools,
    schools,
    totalSchools,
    selectedDistrictId,
    verifiersData,
    verifiers,
    filteredSchools,
    handleFilterChange,
    handleItemsPerPageChange,
    handleAssignmentChange,
    handleSaveAssignment,
    handleExportToExcel,
  };
}
