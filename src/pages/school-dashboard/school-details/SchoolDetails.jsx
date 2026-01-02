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
import { useGetSchoolDataQuery } from "../../../services/schoolService";
import { CircularProgress, Alert } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import "./SchoolDetails.css";

// Helper Components - defined outside to avoid recreation on each render
const SectionHeader = ({ title, icon: Icon, color }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      mb: 3,
      pb: 1.5,
      borderBottom: `3px solid ${color}`,
    }}
  >
    {Icon && <Icon sx={{ fontSize: 28, color }} />}
    <Typography
      variant="h6"
      sx={{
        fontWeight: 700,
        color: colors.text.primary,
        fontSize: "1.125rem",
      }}
    >
      {title}
    </Typography>
  </Box>
);

const InfoField = ({
  label,
  value,
  icon: Icon,
  editable = false,
  type = "text",
  options = [],
  onChange,
}) => (
  <Card
    sx={{
      bgcolor: colors.background.primary,
      border: `1px solid ${colors.neutral.gray200}`,
      borderRadius: 1.5,
      p: 2.5,
      height: "100%",
      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      "&:hover": {
        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        transform: "translateY(-3px)",
        borderColor: colors.primary.light,
      },
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5 }}>
      {Icon && (
        <Box
          sx={{
            bgcolor: `${colors.primary.blue}10`,
            borderRadius: 1,
            p: 0.75,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon sx={{ fontSize: 16, color: colors.primary.blue }} />
        </Box>
      )}
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          color: colors.text.secondary,
          fontSize: "0.8125rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </Typography>
    </Box>
    {editable ? (
      type === "select" ? (
        <FormControl fullWidth size="small">
          <Select
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
            sx={{
              bgcolor: colors.background.secondary,
              borderRadius: 1.5,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.neutral.gray300,
                borderWidth: "1.5px",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.primary.blue,
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.primary.blue,
                borderWidth: "2px",
              },
              "& .MuiSelect-select": {
                py: 1.25,
                fontWeight: 500,
                fontSize: "0.9375rem",
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
            bgcolor: colors.background.secondary,
            borderRadius: 2,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: colors.neutral.gray300,
              borderWidth: "1.5px",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: colors.primary.blue,
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: colors.primary.blue,
              borderWidth: "2px",
            },
            "& .MuiInputBase-input": {
              py: 1.25,
              fontWeight: 500,
              fontSize: "0.9375rem",
            },
          }}
        />
      )
    ) : (
      <Box
        sx={{
          bgcolor: colors.background.secondary,
          p: 1.75,
          borderRadius: 1.5,
          border: `1.5px solid ${colors.neutral.gray200}`,
          transition: "all 0.2s ease",
          "&:hover": {
            borderColor: colors.primary.lightest,
            bgcolor: `${colors.primary.lightest}15`,
          },
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: colors.text.primary,
            fontWeight: 600,
            fontSize: "0.9375rem",
            lineHeight: 1.6,
          }}
        >
          {value || "—"}
        </Typography>
      </Box>
    )}
  </Card>
);

const StatCard = ({ label, value, icon: Icon, color }) => (
  <Card
    sx={{
      bgcolor: colors.background.primary,
      border: `1px solid ${colors.neutral.gray200}`,
      borderRadius: 1.5,
      p: 3,
      height: "100%",
      position: "relative",
      overflow: "hidden",
      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      "&::before": {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        background: `linear-gradient(90deg, ${color}, ${color}80)`,
      },
      "&:hover": {
        boxShadow: `0 6px 20px ${color}25`,
        transform: "translateY(-3px)",
        borderColor: `${color}40`,
      },
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
      <Box
        sx={{
          bgcolor: `${color}12`,
          borderRadius: 2.5,
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 64,
          minHeight: 64,
          border: `1.5px solid ${color}30`,
        }}
      >
        {Icon && <Icon sx={{ fontSize: 32, color }} />}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="body2"
          sx={{
            color: colors.text.secondary,
            mb: 0.75,
            fontWeight: 600,
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="h3"
          sx={{
            color: colors.text.primary,
            fontWeight: 800,
            fontSize: "2.25rem",
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  </Card>
);

const FacilityCard = ({ label, value, icon: Icon, onChange }) => (
  <Card
    sx={{
      bgcolor: colors.background.primary,
      border: `1px solid ${colors.neutral.gray200}`,
      borderRadius: 1.5,
      p: 2.5,
      height: "100%",
      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      "&:hover": {
        boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
        transform: "translateY(-3px)",
        borderColor: `${colors.accent.green}40`,
      },
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
        <Box
          sx={{
            bgcolor: `${colors.accent.green}12`,
            borderRadius: 2,
            p: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 52,
            minHeight: 52,
            border: `1.5px solid ${colors.accent.green}30`,
          }}
        >
          {Icon && <Icon sx={{ fontSize: 24, color: colors.accent.green }} />}
        </Box>
        <Typography
          variant="body1"
          sx={{
            color: colors.text.primary,
            fontWeight: 600,
            fontSize: "0.9375rem",
          }}
        >
          {label}
        </Typography>
      </Box>
      <FormControl
        size="small"
        sx={{
          minWidth: 140,
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
            bgcolor: colors.background.secondary,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: colors.neutral.gray300,
              borderWidth: "1.5px",
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
            fontSize: "0.875rem",
            "& .MuiSelect-select": {
              py: 1,
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
  </Card>
);

const SchoolDetails = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const matchDownMD = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(!matchDownMD);
  const { logout, user, userId } = useAuthStore();

  // Get current academic year (default to current year)
  const currentYear = new Date().getFullYear();
  // eslint-disable-next-line no-unused-vars
  const [academicYear] = useState(`${currentYear}-${currentYear + 1}`);

  // eslint-disable-next-line no-unused-vars
  const schoolId = user?.schoolId || user?.id || userId;

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
    schoolId: "24060100401",
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

  // Helper function to extract value from formatted string (e.g., "1 - RURAL" -> "RURAL")
  const extractValue = (value) => {
    if (!value) return "";
    if (typeof value === "string" && value.includes(" - ")) {
      return value.split(" - ")[1]?.trim() || value;
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

  const handleSave = () => {
    // TODO: Replace with API call
    console.log("Saving school details:", schoolData);
    // Show success message
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
          className="bg-white shadow-lg border-b border-gray-200 backdrop-blur-sm"
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            zIndex: theme.zIndex.drawer + 1,
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            height: "64px",
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
          <Toolbar className="h-16 px-6">
            <IconButton
              onClick={handleDrawerToggle}
              className="mr-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all duration-200"
              edge="start"
              sx={{
                color: "#4b5563",
                borderRadius: "12px",
                "&:hover": {
                  backgroundColor: "#eff6ff",
                  color: "#2563eb",
                  transform: "scale(1.05)",
                },
              }}
            >
              <Menu />
            </IconButton>
            <Box className="flex items-center gap-3 mr-6">
              <Box
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200 hover:scale-105"
                sx={{
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #4f46e5 100%)",
                }}
              >
                <School className="text-white text-lg" />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  component="div"
                  className="font-bold text-gray-900"
                  sx={{
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: "#111827",
                    letterSpacing: "-0.01em",
                  }}
                >
                  School Details
                </Typography>
                <Typography
                  variant="caption"
                  className="text-gray-500 text-xs"
                  sx={{
                    fontSize: "0.7rem",
                    color: "#6b7280",
                    fontWeight: 500,
                  }}
                >
                  School Information
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            {user && (
              <Box className="flex items-center gap-4 mr-4">
                <Box className="text-right hidden sm:block">
                  <Typography
                    variant="body2"
                    className="font-semibold text-gray-900 text-sm"
                    sx={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {user.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    className="text-gray-500 text-xs"
                    sx={{
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      fontWeight: 500,
                    }}
                  >
                    School
                  </Typography>
                </Box>
                <Box
                  className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200 hover:scale-105 cursor-pointer"
                  sx={{
                    background:
                      "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #4f46e5 100%)",
                  }}
                >
                  {user.name?.charAt(0)?.toUpperCase() || "S"}
                </Box>
              </Box>
            )}
            <Button
              onClick={handleLogout}
              className="text-gray-700 hover:bg-red-50 hover:text-red-600 font-semibold px-5 py-2 rounded-xl transition-all duration-200 hover:scale-105"
              sx={{
                color: "#374151",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                borderRadius: "12px",
                "&:hover": {
                  backgroundColor: "#fef2f2",
                  color: "#dc2626",
                  transform: "scale(1.05)",
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
                <Card
                  sx={{
                    mb: 4,
                    bgcolor: colors.background.primary,
                    borderRadius: 2,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    overflow: "hidden",
                    border: `1px solid ${colors.neutral.gray200}`,
                    transition: "all 0.25s ease",
                    "&:hover": {
                      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: "transparent",
                      background: `linear-gradient(135deg, ${colors.primary.blue}08 0%, ${colors.primary.dark}05 100%)`,
                      backdropFilter: "blur(10px)",
                      borderBottom: `2px solid ${colors.primary.blue}20`,
                      p: 3.5,
                      color: colors.text.primary,
                      position: "relative",
                      overflow: "hidden",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: -60,
                        right: -60,
                        width: 240,
                        height: 240,
                        borderRadius: "50%",
                        bgcolor: `${colors.primary.blue}05`,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <Box
                        sx={{
                          bgcolor: `${colors.primary.blue}15`,
                          borderRadius: 1.5,
                          p: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: `1.5px solid ${colors.primary.blue}30`,
                        }}
                      >
                        <School
                          sx={{ fontSize: 28, color: colors.primary.blue }}
                        />
                      </Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          fontSize: "1.5rem",
                          letterSpacing: "-0.01em",
                          color: colors.text.primary,
                        }}
                      >
                        Basic Identification
                      </Typography>
                    </Box>
                  </Box>
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} sm={6} md={3}>
                        <InfoField
                          label="SCHOOL NAME"
                          value={schoolData.schoolName}
                          icon={School}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <InfoField
                          label="UDISE CODE"
                          value={schoolData.udiseCode}
                          icon={Badge}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <InfoField
                          label="DISTRICT"
                          value={schoolData.district}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <InfoField label="BLOCK" value={schoolData.block} />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <InfoField label="STATE" value={schoolData.state} />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <InfoField
                          label="CATEGORY"
                          value={schoolData.category}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box
                          sx={{
                            bgcolor: colors.background.primary,
                            border: `1px solid ${colors.neutral.gray200}`,
                            borderRadius: 1.5,
                            p: 2.5,
                            height: "100%",
                            transition:
                              "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                            "&:hover": {
                              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                              transform: "translateY(-3px)",
                              borderColor: colors.primary.light,
                            },
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: colors.text.secondary,
                              mb: 1.5,
                              fontSize: "0.8125rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            CURRENT APPLICATION STATUS
                          </Typography>
                          <Chip
                            label={schoolData.applicationStatus}
                            sx={{
                              bgcolor: colors.semantic.warning + "15",
                              color: colors.semantic.warning,
                              fontWeight: 600,
                              fontSize: "0.875rem",
                              border: `1px solid ${colors.semantic.warning}30`,
                              borderRadius: 1.5,
                            }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* School Profile */}
                <Card
                  sx={{
                    mb: 4,
                    bgcolor: colors.background.primary,
                    borderRadius: 2,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    overflow: "hidden",
                    border: `1px solid ${colors.neutral.gray200}`,
                    transition: "all 0.25s ease",
                    "&:hover": {
                      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: "transparent",
                      background: `linear-gradient(135deg, ${colors.neutral.gray700}08 0%, ${colors.neutral.gray800}05 100%)`,
                      backdropFilter: "blur(10px)",
                      borderBottom: `2px solid ${colors.neutral.gray700}20`,
                      p: 3.5,
                      color: colors.text.primary,
                      position: "relative",
                      overflow: "hidden",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: -60,
                        right: -60,
                        width: 240,
                        height: 240,
                        borderRadius: "50%",
                        bgcolor: `${colors.neutral.gray700}05`,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <Box
                        sx={{
                          bgcolor: `${colors.neutral.gray700}15`,
                          borderRadius: 1.5,
                          p: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: `1.5px solid ${colors.neutral.gray700}30`,
                        }}
                      >
                        <Business
                          sx={{ fontSize: 28, color: colors.neutral.gray700 }}
                        />
                      </Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          fontSize: "1.5rem",
                          letterSpacing: "-0.01em",
                          color: colors.text.primary,
                        }}
                      >
                        School Profile
                      </Typography>
                    </Box>
                  </Box>
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} sm={6} md={3}>
                        <InfoField
                          label="Management Type"
                          value={schoolData.managementType}
                          icon={Business}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <InfoField
                          label="School Type"
                          value={schoolData.schoolType}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <InfoField
                          label="Medium of Instruction"
                          value={schoolData.mediumOfInstruction}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <InfoField
                          label="Location Type (Rural/Urban)"
                          value={schoolData.locationType}
                          editable
                          type="select"
                          options={[
                            { value: "Rural", label: "Rural" },
                            { value: "Urban", label: "Urban" },
                          ]}
                          onChange={(value) =>
                            handleChange(
                              getFieldName("Location Type (Rural/Urban)"),
                              value
                            )
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <InfoField
                          label="Students (Boys & Girls)"
                          value={schoolData.studentsType}
                          editable
                          type="select"
                          options={[
                            { value: "Co-Ed", label: "Co-Ed" },
                            { value: "Boys", label: "Boys" },
                            { value: "Girls", label: "Girls" },
                          ]}
                          onChange={(value) =>
                            handleChange(
                              getFieldName("Students (Boys & Girls)"),
                              value
                            )
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <InfoField
                          label="Classes (Range) From"
                          value={schoolData.classesFrom}
                          editable
                          type="select"
                          options={Array.from({ length: 12 }, (_, i) => ({
                            value: String(i + 1),
                            label: String(i + 1),
                          }))}
                          onChange={(value) =>
                            handleChange(
                              getFieldName("Classes (Range) From"),
                              value
                            )
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <InfoField
                          label="Classes (Range) To"
                          value={schoolData.classesTo}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Statistics */}
                <Card
                  sx={{
                    mb: 4,
                    bgcolor: colors.background.primary,
                    borderRadius: 2,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    overflow: "hidden",
                    border: `1px solid ${colors.neutral.gray200}`,
                    transition: "all 0.25s ease",
                    "&:hover": {
                      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: "transparent",
                      background: `linear-gradient(135deg, ${colors.semantic.warning}08 0%, ${colors.accent.orange}05 100%)`,
                      backdropFilter: "blur(10px)",
                      borderBottom: `2px solid ${colors.semantic.warning}20`,
                      p: 3.5,
                      color: colors.text.primary,
                      position: "relative",
                      overflow: "hidden",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: -60,
                        right: -60,
                        width: 240,
                        height: 240,
                        borderRadius: "50%",
                        bgcolor: `${colors.semantic.warning}05`,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <Box
                        sx={{
                          bgcolor: `${colors.semantic.warning}15`,
                          borderRadius: 1.5,
                          p: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: `1.5px solid ${colors.semantic.warning}30`,
                        }}
                      >
                        <BarChart
                          sx={{ fontSize: 28, color: colors.semantic.warning }}
                        />
                      </Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          fontSize: "1.5rem",
                          letterSpacing: "-0.01em",
                          color: colors.text.primary,
                        }}
                      >
                        Statistics
                      </Typography>
                    </Box>
                  </Box>
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                          label="TOTAL TEACHERS"
                          value={schoolData.totalTeachers}
                          icon={Person}
                          color={colors.primary.blue}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                          label="TOTAL STUDENTS"
                          value={schoolData.totalStudents}
                          icon={Person}
                          color={colors.accent.green}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Infrastructure & Facilities */}
                <Card
                  sx={{
                    mb: 4,
                    bgcolor: colors.background.primary,
                    borderRadius: 2,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    overflow: "hidden",
                    border: `1px solid ${colors.neutral.gray200}`,
                    transition: "all 0.25s ease",
                    "&:hover": {
                      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: "transparent",
                      background: `linear-gradient(135deg, ${colors.accent.green}08 0%, ${colors.accent.greenDark}05 100%)`,
                      backdropFilter: "blur(10px)",
                      borderBottom: `2px solid ${colors.accent.green}20`,
                      p: 3.5,
                      color: colors.text.primary,
                      position: "relative",
                      overflow: "hidden",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: -60,
                        right: -60,
                        width: 240,
                        height: 240,
                        borderRadius: "50%",
                        bgcolor: `${colors.accent.green}05`,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <Box
                        sx={{
                          bgcolor: `${colors.accent.green}15`,
                          borderRadius: 1.5,
                          p: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: `1.5px solid ${colors.accent.green}30`,
                        }}
                      >
                        <Build
                          sx={{ fontSize: 28, color: colors.accent.green }}
                        />
                      </Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          fontSize: "1.5rem",
                          letterSpacing: "-0.01em",
                          color: colors.text.primary,
                        }}
                      >
                        Infrastructure & Facilities
                      </Typography>
                    </Box>
                  </Box>
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} sm={6} md={3}>
                        <FacilityCard
                          label="Drinking Water"
                          value={schoolData.drinkingWater}
                          icon={WaterDrop}
                          onChange={(value) =>
                            handleChange(getFieldName("Drinking Water"), value)
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <FacilityCard
                          label="Pucca Building"
                          value={schoolData.puccaBuilding}
                          icon={Home}
                          onChange={(value) =>
                            handleChange(getFieldName("Pucca Building"), value)
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <FacilityCard
                          label="Electricity"
                          value={schoolData.electricity}
                          icon={Bolt}
                          onChange={(value) =>
                            handleChange(getFieldName("Electricity"), value)
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <FacilityCard
                          label="Functional Toilets"
                          value={schoolData.functionalToilets}
                          icon={Wc}
                          onChange={(value) =>
                            handleChange(
                              getFieldName("Functional Toilets"),
                              value
                            )
                          }
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card
                  sx={{
                    mb: 4,
                    bgcolor: colors.background.primary,
                    borderRadius: 2,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    overflow: "hidden",
                    border: `1px solid ${colors.neutral.gray200}`,
                    transition: "all 0.25s ease",
                    "&:hover": {
                      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: "transparent",
                      background: `linear-gradient(135deg, ${colors.primary.blue}08 0%, ${colors.primary.dark}05 100%)`,
                      backdropFilter: "blur(10px)",
                      borderBottom: `2px solid ${colors.primary.blue}20`,
                      p: 3.5,
                      color: colors.text.primary,
                      position: "relative",
                      overflow: "hidden",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: -60,
                        right: -60,
                        width: 240,
                        height: 240,
                        borderRadius: "50%",
                        bgcolor: `${colors.primary.blue}05`,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <Box
                        sx={{
                          bgcolor: `${colors.primary.blue}15`,
                          borderRadius: 1.5,
                          p: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: `1.5px solid ${colors.primary.blue}30`,
                        }}
                      >
                        <Person
                          sx={{ fontSize: 28, color: colors.primary.blue }}
                        />
                      </Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          fontSize: "1.5rem",
                          letterSpacing: "-0.01em",
                          color: colors.text.primary,
                        }}
                      >
                        Contact Information
                      </Typography>
                    </Box>
                  </Box>
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} sm={6} md={3}>
                        <InfoField
                          label="Principal/Head Name"
                          value={schoolData.principalName}
                          icon={Person}
                          editable
                          onChange={(value) =>
                            handleChange(
                              getFieldName("Principal/Head Name"),
                              value
                            )
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <InfoField
                          label="Designation"
                          value={schoolData.designation}
                          icon={Badge}
                          editable
                          onChange={(value) =>
                            handleChange(getFieldName("Designation"), value)
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <InfoField
                          label="Mobile Number"
                          value={schoolData.mobileNumber}
                          icon={Phone}
                          editable
                          onChange={(value) =>
                            handleChange(getFieldName("Mobile Number"), value)
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <InfoField
                          label="Email Address"
                          value={schoolData.emailAddress}
                          icon={Email}
                          editable
                          onChange={(value) =>
                            handleChange(getFieldName("Email Address"), value)
                          }
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 2.5,
                    mt: 5,
                    pt: 4,
                    borderTop: `2px solid ${colors.neutral.gray200}`,
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/school-dashboard")}
                    sx={{
                      borderColor: colors.neutral.gray300,
                      borderWidth: "1.5px",
                      color: colors.text.primary,
                      borderRadius: 2.5,
                      px: 4.5,
                      py: 1.5,
                      fontWeight: 600,
                      fontSize: "0.9375rem",
                      textTransform: "none",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        borderColor: colors.primary.blue,
                        borderWidth: "1.5px",
                        bgcolor: colors.primary.lightest,
                        transform: "translateY(-2px)",
                        boxShadow: `0 4px 12px ${colors.primary.blue}20`,
                      },
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSave}
                    sx={{
                      background: `linear-gradient(135deg, ${colors.accent.green} 0%, ${colors.accent.greenDark} 100%)`,
                      borderRadius: 2.5,
                      px: 5,
                      py: 1.5,
                      fontWeight: 700,
                      fontSize: "0.9375rem",
                      textTransform: "none",
                      boxShadow: `0 4px 16px ${colors.accent.green}40`,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        background: `linear-gradient(135deg, ${colors.accent.greenDark} 0%, ${colors.accent.green} 100%)`,
                        transform: "translateY(-2px)",
                        boxShadow: `0 6px 20px ${colors.accent.green}50`,
                      },
                    }}
                  >
                    Save All Changes
                  </Button>
                </Box>
              </>
            )}
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default SchoolDetails;
