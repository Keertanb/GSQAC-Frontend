import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Paper,
  Divider,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  ArrowBack,
  Save,
  School,
  Business,
  BarChart,
  Build,
  Person,
  WaterDrop,
  Home,
  Bolt,
  Wc,
  Phone,
  Email,
  Badge,
  Menu,
} from "@mui/icons-material";
import { colors } from "../../../constants/colors";
import AppDrawer from "../../../components/AppDrawer/AppDrawer";
import { DRAWER_WIDTH } from "../../../constants/menuItems";
import useAuthStore from "../../../store/useAuthStore";
import { useLogoutMutation } from "../../../services/authService";
import {
  useGetSchoolDataQuery,
  useUpdateSchoolInfrastructureMutation,
} from "../../../services/schoolService";
import { CircularProgress, Alert } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import "./SchoolDetails.css";

// Helper Components - defined outside to avoid recreation on each render
const InfoField = ({
  label,
  value,
  icon: Icon,
  editable = false,
  type = "text",
  options = [],
  onChange,
}) => (
  <Box
    sx={{
      height: "100%",
    }}
  >
    <Typography
      variant="caption"
      sx={{
        fontWeight: 600,
        color: colors.text.secondary,
        fontSize: "0.6875rem",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        mb: 0.75,
        display: "block",
      }}
    >
      {label}
    </Typography>
    {editable ? (
      type === "select" ? (
        <FormControl fullWidth size="small">
          <Select
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
            sx={{
              bgcolor: "white",
              borderRadius: 1.5,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.neutral.gray200,
                borderWidth: "1px",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.primary.blue,
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.primary.blue,
                borderWidth: "2px",
              },
              "& .MuiSelect-select": {
                py: 1,
                fontWeight: 600,
                fontSize: "0.875rem",
              },
            }}
          >
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
        <TextField
          fullWidth
          size="small"
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          variant="outlined"
          sx={{
            bgcolor: "white",
            borderRadius: 1.5,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: colors.neutral.gray200,
              borderWidth: "1px",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: colors.primary.blue,
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: colors.primary.blue,
              borderWidth: "2px",
            },
            "& .MuiInputBase-input": {
              py: 1,
              fontWeight: 600,
              fontSize: "0.875rem",
            },
          }}
        />
      )
    ) : (
      <Typography
        variant="body1"
        sx={{
          color: colors.text.primary,
          fontWeight: 600,
          fontSize: "0.9375rem",
          lineHeight: 1.5,
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}
      >
        {value || "—"}
      </Typography>
    )}
  </Box>
);

const StatCard = ({ label, value, icon: Icon, color }) => (
  <Box
    sx={{
      bgcolor: `${color}08`,
      borderRadius: 2,
      p: 2.5,
      height: "100%",
      position: "relative",
      overflow: "hidden",
      border: `1px solid ${color}20`,
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: `0 12px 24px ${color}25`,
        bgcolor: `${color}12`,
      },
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Box
        sx={{
          bgcolor: color,
          borderRadius: 1.5,
          p: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 48,
          minHeight: 48,
        }}
      >
        {Icon && <Icon sx={{ fontSize: 24, color: "white" }} />}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="body2"
          sx={{
            color: colors.text.secondary,
            mb: 0.25,
            fontWeight: 600,
            fontSize: "0.6875rem",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="h4"
          sx={{
            color: colors.text.primary,
            fontWeight: 700,
            fontSize: "1.75rem",
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  </Box>
);

const FacilityCard = ({ label, value, icon: Icon, onChange }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 2,
      height: "100%",
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        flex: 1,
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          bgcolor: `${colors.accent.green}15`,
          borderRadius: 1.5,
          p: 1.25,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 40,
          minHeight: 40,
        }}
      >
        {Icon && <Icon sx={{ fontSize: 20, color: colors.accent.green }} />}
      </Box>
      <Typography
        variant="body2"
        sx={{
          color: colors.text.primary,
          fontWeight: 600,
          fontSize: "0.875rem",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
    </Box>
    <FormControl
      size="small"
      sx={{
        minWidth: 120,
        "& .MuiOutlinedInput-root": {
          borderRadius: 1.5,
          bgcolor: "white",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: colors.neutral.gray200,
            borderWidth: "1px",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: colors.accent.green,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: colors.accent.green,
            borderWidth: "2px",
          },
        },
      }}
    >
      <Select
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        sx={{
          fontWeight: 600,
          fontSize: "0.8125rem",
          "& .MuiSelect-select": {
            py: 0.875,
          },
        }}
      >
        <MenuItem value="Yes">Yes</MenuItem>
        <MenuItem value="No">No</MenuItem>
        <MenuItem value="Available">Available</MenuItem>
        <MenuItem value="Not Available">Not Available</MenuItem>
      </Select>
    </FormControl>
  </Box>
);

const SchoolDetails = () => {
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

        // Infrastructure & Facilities - Keep defaults if not in API
        drinkingWater: prev.drinkingWater,
        puccaBuilding: prev.puccaBuilding,
        electricity: prev.electricity,
        functionalToilets: prev.functionalToilets,

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
        { variant: "error" }
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
        field === "drinkingWater" ? value : schoolData.drinkingWater
      ),
      puccaBuilding: convertToNumber(
        field === "puccaBuilding" ? value : schoolData.puccaBuilding
      ),
      electricity: convertToNumber(
        field === "electricity" ? value : schoolData.electricity
      ),
      functionalToilets: convertToNumber(
        field === "functionalToilets" ? value : schoolData.functionalToilets
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

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <AppDrawer open={drawerOpen} handleDrawerToggle={handleDrawerToggle} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: "100%",
          transition: theme.transitions.create(["margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          //   marginLeft: drawerOpen && !matchDownMD ? `${DRAWER_WIDTH.xs}px` : 0,
          //   [`@media (min-width:${theme.breakpoints.values.xl}px)`]: {
          //     marginLeft: drawerOpen && !matchDownMD ? `${DRAWER_WIDTH.xl}px` : 0,
          //   },
        }}
      >
        <AppBar
          position="fixed"
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(10px)",
            zIndex: theme.zIndex.drawer + 1,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            borderBottom: `1px solid ${colors.neutral.gray200}`,
            height: "72px",
            width:
              drawerOpen && !matchDownMD
                ? `calc(100% - ${DRAWER_WIDTH.xs}px)`
                : "100%",
            [`@media (min-width:${theme.breakpoints.values.xl}px)`]: {
              width:
                drawerOpen && !matchDownMD
                  ? `calc(100% - ${DRAWER_WIDTH.xl}px)`
                  : "100%",
            },
            transition: theme.transitions.create(["width", "margin"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          <Toolbar sx={{ height: "72px", px: 3 }}>
            <IconButton
              onClick={handleDrawerToggle}
              edge="start"
              sx={{
                color: colors.text.secondary,
                borderRadius: 2,
                mr: 2,
                "&:hover": {
                  bgcolor: colors.primary.lightest,
                  color: colors.primary.blue,
                },
              }}
            >
              <Menu />
            </IconButton>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: colors.primary.blue,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <School sx={{ fontSize: 22, color: "white" }} />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: colors.text.primary,
                    lineHeight: 1.2,
                  }}
                >
                  School Details
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.75rem",
                    color: colors.text.secondary,
                    fontWeight: 500,
                  }}
                >
                  Manage Information
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              onClick={handleLogout}
              sx={{
                color: colors.text.secondary,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                borderRadius: 2,
                px: 3,
                py: 1,
                "&:hover": {
                  bgcolor: `${colors.semantic.error}10`,
                  color: colors.semantic.error,
                },
              }}
            >
              Logout
            </Button>
          </Toolbar>
        </AppBar>

        <Box
          sx={{
            mt: 8,
            minHeight: "100vh",
            bgcolor: colors.background.secondary,
          }}
        >
          <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Loading State */}
            {isLoading && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: "400px",
                }}
              >
                <CircularProgress />
              </Box>
            )}

            {/* Error State */}
            {isError && !isLoading && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error?.response?.data?.message ||
                  "Failed to load school data. Please try again."}
              </Alert>
            )}

            {/* Content - only show if not loading */}
            {!isLoading && (
              <>
                {/* Basic Identification Section */}
                <Paper
                  elevation={0}
                  sx={{
                    mb: 3,
                    bgcolor: "white",
                    borderRadius: 2.5,
                    overflow: "hidden",
                    border: `1px solid ${colors.neutral.gray200}`,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: `${colors.primary.blue}08`,
                      p: 3,
                      borderBottom: `1px solid ${colors.neutral.gray200}`,
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Box
                        sx={{
                          bgcolor: colors.primary.blue,
                          borderRadius: 1.5,
                          p: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <School sx={{ fontSize: 20, color: "white" }} />
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          fontSize: "1.125rem",
                          letterSpacing: "-0.01em",
                          color: colors.text.primary,
                        }}
                      >
                        Basic Identification
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={gridItemStyles}
                      >
                        <InfoField
                          label="SCHOOL NAME"
                          value={schoolData.schoolName}
                          icon={School}
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={gridItemStyles}
                      >
                        <InfoField
                          label="UDISE CODE"
                          value={schoolData.udiseCode}
                          icon={Badge}
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={gridItemStyles}
                      >
                        <InfoField
                          label="DISTRICT"
                          value={schoolData.district}
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={gridItemStyles}
                      >
                        <InfoField label="BLOCK" value={schoolData.block} />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={gridItemStyles}
                      >
                        <InfoField label="STATE" value={schoolData.state} />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={gridItemStyles}
                      >
                        <InfoField
                          label="CATEGORY"
                          value={schoolData.category}
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={gridItemStyles}
                      >
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 600,
                              color: colors.text.secondary,
                              mb: 0.75,
                              fontSize: "0.6875rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              display: "block",
                            }}
                          >
                            CURRENT APPLICATION STATUS
                          </Typography>
                          <Chip
                            label={schoolData.applicationStatus}
                            sx={{
                              bgcolor: colors.semantic.warning + "15",
                              color: colors.semantic.warning,
                              fontWeight: 700,
                              fontSize: "0.875rem",
                              border: `1px solid ${colors.semantic.warning}30`,
                              borderRadius: 1.5,
                              px: 1.5,
                              height: 32,
                            }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>

                {/* School Profile */}
                <Paper
                  elevation={0}
                  sx={{
                    mb: 3,
                    bgcolor: "white",
                    borderRadius: 2.5,
                    overflow: "hidden",
                    border: `1px solid ${colors.neutral.gray200}`,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: `${colors.neutral.gray700}06`,
                      p: 3,
                      borderBottom: `1px solid ${colors.neutral.gray200}`,
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Box
                        sx={{
                          bgcolor: colors.neutral.gray700,
                          borderRadius: 1.5,
                          p: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Business sx={{ fontSize: 20, color: "white" }} />
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          fontSize: "1.125rem",
                          letterSpacing: "-0.01em",
                          color: colors.text.primary,
                        }}
                      >
                        School Profile
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={gridItemStyles}
                      >
                        <InfoField
                          label="Management Type"
                          value={schoolData.managementType}
                          icon={Business}
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={gridItemStyles}
                      >
                        <InfoField
                          label="School Type"
                          value={schoolData.schoolType}
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={gridItemStyles}
                      >
                        <InfoField
                          label="Medium of Instruction"
                          value={schoolData.mediumOfInstruction}
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={gridItemStyles}
                      >
                        <InfoField
                          label="Location Type (Rural/Urban)"
                          value={schoolData.locationType}
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={gridItemStyles}
                      >
                        <InfoField
                          label="Students (Boys & Girls)"
                          value={schoolData.studentsType}
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={gridItemStyles}
                      >
                        <InfoField
                          label="Classes (Range) From"
                          value={schoolData.classesFrom}
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={gridItemStyles}
                      >
                        <InfoField
                          label="Classes (Range) To"
                          value={schoolData.classesTo}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>

                {/* Statistics */}
                <Paper
                  elevation={0}
                  sx={{
                    mb: 3,
                    bgcolor: "white",
                    borderRadius: 2.5,
                    overflow: "hidden",
                    border: `1px solid ${colors.neutral.gray200}`,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: `${colors.semantic.warning}08`,
                      p: 3,
                      borderBottom: `1px solid ${colors.neutral.gray200}`,
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Box
                        sx={{
                          bgcolor: colors.semantic.warning,
                          borderRadius: 1.5,
                          p: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <BarChart sx={{ fontSize: 20, color: "white" }} />
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          fontSize: "1.125rem",
                          letterSpacing: "-0.01em",
                          color: colors.text.primary,
                        }}
                      >
                        Statistics
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ p: 3 }}>
                    <Grid container spacing={2.5}>
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={gridItemStyles}
                      >
                        <StatCard
                          label="TOTAL TEACHERS"
                          value={schoolData.totalTeachers}
                          icon={Person}
                          color={colors.primary.blue}
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={gridItemStyles}
                      >
                        <StatCard
                          label="TOTAL STUDENTS"
                          value={schoolData.totalStudents}
                          icon={Person}
                          color={colors.accent.green}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>

                {/* Infrastructure & Facilities */}
                <Paper
                  elevation={0}
                  sx={{
                    mb: 3,
                    bgcolor: "white",
                    borderRadius: 2.5,
                    overflow: "hidden",
                    border: `1px solid ${colors.neutral.gray200}`,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: `${colors.accent.green}08`,
                      p: 3,
                      borderBottom: `1px solid ${colors.neutral.gray200}`,
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Box
                        sx={{
                          bgcolor: colors.accent.green,
                          borderRadius: 1.5,
                          p: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Build sx={{ fontSize: 20, color: "white" }} />
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          fontSize: "1.125rem",
                          letterSpacing: "-0.01em",
                          color: colors.text.primary,
                        }}
                      >
                        Infrastructure & Facilities
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ p: 3 }}>
                    <Grid container spacing={2.5}>
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={gridItemStyles}
                      >
                        <FacilityCard
                          label="Drinking Water"
                          value={schoolData.drinkingWater}
                          icon={WaterDrop}
                          onChange={(value) =>
                            handleFacilityChange(
                              getFieldName("Drinking Water"),
                              value
                            )
                          }
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={gridItemStyles}
                      >
                        <FacilityCard
                          label="Pucca Building"
                          value={schoolData.puccaBuilding}
                          icon={Home}
                          onChange={(value) =>
                            handleFacilityChange(
                              getFieldName("Pucca Building"),
                              value
                            )
                          }
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={gridItemStyles}
                      >
                        <FacilityCard
                          label="Electricity"
                          value={schoolData.electricity}
                          icon={Bolt}
                          onChange={(value) =>
                            handleFacilityChange(
                              getFieldName("Electricity"),
                              value
                            )
                          }
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={gridItemStyles}
                      >
                        <FacilityCard
                          label="Functional Toilets"
                          value={schoolData.functionalToilets}
                          icon={Wc}
                          onChange={(value) =>
                            handleFacilityChange(
                              getFieldName("Functional Toilets"),
                              value
                            )
                          }
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>

                {/* Contact Information */}
                <Paper
                  elevation={0}
                  sx={{
                    mb: 3,
                    bgcolor: "white",
                    borderRadius: 2.5,
                    overflow: "hidden",
                    border: `1px solid ${colors.neutral.gray200}`,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: `${colors.primary.blue}08`,
                      p: 3,
                      borderBottom: `1px solid ${colors.neutral.gray200}`,
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Box
                        sx={{
                          bgcolor: colors.primary.blue,
                          borderRadius: 1.5,
                          p: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Person sx={{ fontSize: 20, color: "white" }} />
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          fontSize: "1.125rem",
                          letterSpacing: "-0.01em",
                          color: colors.text.primary,
                        }}
                      >
                        Contact Information
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={gridItemStyles}
                      >
                        <InfoField
                          label="Principal/Head Name"
                          value={schoolData.principalName}
                          icon={Person}
                        />
                      </Grid>
                      {/* <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={gridItemStyles}
                      >
                        <InfoField
                          label="Designation"
                          value={schoolData.designation}
                          icon={Badge}
                        />
                      </Grid> */}
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={gridItemStyles}
                      >
                        <InfoField
                          label="Mobile Number"
                          value={schoolData.mobileNumber}
                          icon={Phone}
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3}
                        lg={3}
                        sx={gridItemStyles}
                      >
                        <InfoField
                          label="Email Address"
                          value={schoolData.emailAddress}
                          icon={Email}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>

                {/* Info Banner */}
                {/* <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: `${colors.primary.blue}08`,
                    border: `1px solid ${colors.primary.blue}20`,
                    borderRadius: 2,
                    p: 2.5,
                    mt: 4,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        bgcolor: colors.primary.blue,
                        borderRadius: 1.5,
                        p: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Save sx={{ fontSize: 18, color: "white" }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: colors.text.primary,
                          fontSize: "0.875rem",
                          mb: 0.25,
                        }}
                      >
                        Infrastructure & Facilities
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: colors.text.secondary,
                          fontSize: "0.75rem",
                        }}
                      >
                        Changes are automatically saved when you update facility values
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/school-dashboard")}
                    sx={{
                      borderColor: colors.primary.blue,
                      color: colors.primary.blue,
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      textTransform: "none",
                      transition: "all 0.25s ease",
                      "&:hover": {
                        borderColor: colors.primary.dark,
                        bgcolor: `${colors.primary.blue}10`,
                      },
                    }}
                  >
                    Back to Dashboard
                  </Button>
                </Box> */}
              </>
            )}
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default SchoolDetails;
