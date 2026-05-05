import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, useMediaQuery } from "@mui/material";
import { useLogoutMutation } from "../../../../services/authService";
import {
  useGetSchoolDataQuery,
  useUpdateSchoolInfrastructureMutation,
} from "../../../../services/schoolService";
import useAuthStore from "../../../../store/useAuthStore";
import { enqueueSnackbar } from "notistack";

export function useSchoolDetails() {

  const navigate = useNavigate();
  const theme = useTheme();
  const matchDownMD = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(!matchDownMD);
  const { logout, user, userId, userName } = useAuthStore();

  // Grid item styles for equal width cards (4 per row)
  const gridItemStyles = {
    minWidth: 0,
    flexBasis: { md: "25%", lg: "25%" },
    maxWidth: { md: "25%", lg: "25%" },
  };

  // Get current academic year (default to current year)
  const currentYear = new Date().getFullYear();
  // eslint-disable-next-line no-unused-vars
  const [academicYear] = useState(`${currentYear}-${currentYear + 1}`);

  // Get schoolId from auth store (userName is typically the school login ID)
  const schoolId = userName || user?.schoolId || user?.id || userId;

  const logoutMutation = useLogoutMutation({
    onSuccess: () => {
      logout();
      navigate("/login");
    },
    onError: (error) => {
      console.error("Logout API error:", error);
      logout();
      navigate("/login");
    },
  });

  const updateInfrastructureMutation = useUpdateSchoolInfrastructureMutation({
    onSuccess: () => {
      // Optionally refetch school data after successful update
    },
  });

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Fetch school data from API
  const {
    data: schoolDataResponse,
    isLoading,
    isError,
    error,
  } = useGetSchoolDataQuery({
    schoolId: schoolId,
  });

  // Initialize school data with API response or default values
  const [schoolData, setSchoolData] = useState({
    // Basic Identification
    schoolName: "",
    udiseCode: "",
    district: "",
    block: "",
    state: "",
    category: "",
    applicationStatus: "Draft",

    // School Profile
    managementType: "",
    schoolType: "",
    mediumOfInstruction: "",
    locationType: "Rural",
    studentsType: "Co-Ed",
    classesFrom: "1",
    classesTo: "8",

    // Statistics
    totalTeachers: "0",
    totalStudents: "0",

    // Infrastructure & Facilities
    drinkingWater: "Available",
    puccaBuilding: "Yes",
    electricity: "Yes",
    functionalToilets: "Yes",

    // Contact Information
    principalName: "",
    designation: "",
    mobileNumber: "",
    emailAddress: "",
  });

  // Helper function to extract value from formatted string (e.g., "2 - URBAN" -> "Urban")
  const extractValue = (value) => {
    if (!value) return "";
    if (typeof value === "string" && value.includes(" - ")) {
      const extracted = value.split(" - ")[1]?.trim() || value;
      // Capitalize first letter, lowercase rest for consistent display
      return (
        extracted.charAt(0).toUpperCase() + extracted.slice(1).toLowerCase()
      );
    }
    return value;
  };

  // Helper function to convert 0/1 to Yes/No or Available/Not Available
  const convertInfrastructureValue = (value, fieldType = "yesno") => {
    if (value === null || value === undefined) {
      return fieldType === "available" ? "Available" : "Yes";
    }
    const numValue = Number(value);
    if (fieldType === "available") {
      return numValue === 1 ? "Available" : "Not Available";
    }
    return numValue === 1 ? "Yes" : "No";
  };

  // Update school data when API response is received
  useEffect(() => {
    if (schoolDataResponse?.data) {
      const apiData = schoolDataResponse.data;
      setSchoolData((prev) => ({
        ...prev,
        // Basic Identification - map API response fields
        schoolName: apiData.schoolName || prev.schoolName,
        udiseCode: apiData.schoolId || prev.udiseCode,
        district: apiData.districtName || prev.district,
        block: apiData.blockName || prev.block,
        state: apiData.stateName || prev.state,
        category: apiData.schoolCategoryName || prev.category,
        applicationStatus: prev.applicationStatus, // Keep default or from API if available

        // School Profile
        managementType:
          extractValue(apiData.schoolManagementName) || prev.managementType,
        schoolType: apiData.schoolTypeName || prev.schoolType,
        mediumOfInstruction:
          apiData.mediumNames || apiData.mediums || prev.mediumOfInstruction,
        locationType:
          extractValue(apiData.schoolLocalityName) || prev.locationType,
        studentsType:
          apiData.schoolTypeName === "Co-educational"
            ? "Co-Ed"
            : prev.studentsType,
        classesFrom: String(apiData.lowerClass || prev.classesFrom),
        classesTo: String(apiData.upperClass || prev.classesTo),

        // Statistics
        totalTeachers: String(apiData.teacherCount || prev.totalTeachers),
        totalStudents: String(apiData.studentCount || prev.totalStudents),

        // Infrastructure & Facilities - Convert 0/1 to proper values
        drinkingWater:
          apiData.drinkingWater !== undefined && apiData.drinkingWater !== null
            ? convertInfrastructureValue(apiData.drinkingWater, "available")
            : prev.drinkingWater,
        puccaBuilding:
          apiData.puccaBuilding !== undefined && apiData.puccaBuilding !== null
            ? convertInfrastructureValue(apiData.puccaBuilding, "yesno")
            : prev.puccaBuilding,
        electricity:
          apiData.electricity !== undefined && apiData.electricity !== null
            ? convertInfrastructureValue(apiData.electricity, "yesno")
            : prev.electricity,
        functionalToilets:
          apiData.functionalToilets !== undefined &&
          apiData.functionalToilets !== null
            ? convertInfrastructureValue(apiData.functionalToilets, "yesno")
            : prev.functionalToilets,

        // Contact Information
        principalName: apiData.principalName || prev.principalName,
        designation: prev.designation, // Keep default if not in API
        mobileNumber: apiData.principalMobile || prev.mobileNumber,
        emailAddress: apiData.principalEmail || prev.emailAddress,
      }));
    }
  }, [schoolDataResponse]);

  // Show error message if API call fails
  useEffect(() => {
    if (isError) {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to load school data",
        { variant: "error" },
      );
    }
  }, [isError, error]);

  const handleChange = (field, value) => {
    setSchoolData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFacilityChange = (field, value) => {
    // Update local state
    setSchoolData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-save infrastructure changes
    const convertToNumber = (val) => {
      return val === "Yes" || val === "Available" ? 1 : 0;
    };

    // Create payload with updated value
    const payload = {
      schoolId: schoolData.udiseCode || schoolId,
      drinkingWater: convertToNumber(
        field === "drinkingWater" ? value : schoolData.drinkingWater,
      ),
      puccaBuilding: convertToNumber(
        field === "puccaBuilding" ? value : schoolData.puccaBuilding,
      ),
      electricity: convertToNumber(
        field === "electricity" ? value : schoolData.electricity,
      ),
      functionalToilets: convertToNumber(
        field === "functionalToilets" ? value : schoolData.functionalToilets,
      ),
    };

    // Call API to save
    updateInfrastructureMutation.mutate(payload);
  };

  const handleSave = () => {
    // Convert facility values to numbers for API
    const convertToNumber = (value) => {
      return value === "Yes" || value === "Available" ? 1 : 0;
    };

    const payload = {
      schoolId: schoolData.udiseCode || schoolId,
      drinkingWater: convertToNumber(schoolData.drinkingWater),
      puccaBuilding: convertToNumber(schoolData.puccaBuilding),
      electricity: convertToNumber(schoolData.electricity),
      functionalToilets: convertToNumber(schoolData.functionalToilets),
    };

    updateInfrastructureMutation.mutate(payload);
  };

  // Helper function to get field name from label
  const getFieldName = (label) => {
    const fieldMap = {
      "SCHOOL NAME": "schoolName",
      "UDISE CODE": "udiseCode",
      DISTRICT: "district",
      BLOCK: "block",
      STATE: "state",
      CATEGORY: "category",
      "Management Type": "managementType",
      "School Type": "schoolType",
      "Medium of Instruction": "mediumOfInstruction",
      "Location Type (Rural/Urban)": "locationType",
      "Students (Boys & Girls)": "studentsType",
      "Classes (Range) From": "classesFrom",
      "Classes (Range) To": "classesTo",
      "Principal/Head Name": "principalName",
      Designation: "designation",
      "Mobile Number": "mobileNumber",
      "Email Address": "emailAddress",
      "Drinking Water": "drinkingWater",
      "Pucca Building": "puccaBuilding",
      Electricity: "electricity",
      "Functional Toilets": "functionalToilets",
    };
    return (
      fieldMap[label] ||
      label.toLowerCase().replace(/\s+/g, "").replace(/[()]/g, "")
    );
  };

  // Backward-compatible alias used by the view layer.
  const infrastructureMutation = updateInfrastructureMutation;

  return {
    navigate,
    theme,
    matchDownMD,
    drawerOpen,
    setDrawerOpen,
    logout,
    user,
    userId,
    userName,
    gridItemStyles,
    currentYear,
    schoolId,
    logoutMutation,
    updateInfrastructureMutation,
    handleDrawerToggle,
    handleLogout,
    schoolDataResponse,
    isLoading,
    isError,
    error,
    schoolData,
    setSchoolData,
    extractValue,
    convertInfrastructureValue,
    handleChange,
    handleFacilityChange,
    handleSave,
    getFieldName,
    infrastructureMutation,
  };
}
