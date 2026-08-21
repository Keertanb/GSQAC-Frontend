import React from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  Chip,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  School,
  Business,
  Person,
  Hotel,
  Menu,
} from "@mui/icons-material";
import { colors } from "../../../../constants/colors";
import AppDrawer from "../../../../components/AppDrawer/AppDrawer";
import { DRAWER_WIDTH } from "../../../../constants/menuItems";
import { SchoolHostelFacilityModalGate } from "../../components/SchoolHostelFacilityModalGate";
import "../SchoolDetails.css";

const THEME = {
  primary: colors.primary.blue,
  dark: colors.primary.dark,
  lightest: colors.primary.lightest,
  accent: colors.saffron.main,
  accentDark: colors.saffron.dark,
};

function SectionCard({ title, icon: Icon, iconColor = THEME.primary, children }) {
  return (
    <Paper elevation={0} className="sd-section">
      <Box className="sd-section__header">
        <Box className="sd-section__icon" sx={{ bgcolor: iconColor }}>
          {Icon ? <Icon sx={{ fontSize: 20 }} /> : null}
        </Box>
        <Typography className="sd-section__title">{title}</Typography>
      </Box>
      <Box className="sd-section__body">{children}</Box>
    </Paper>
  );
}

function HostelFacilityBanner({ value }) {
  const normalized = String(value || "Not set").trim();
  const isYes = normalized === "Yes";
  const isNo = normalized === "No";
  const bannerClass = isYes
    ? "sd-hostel-banner sd-hostel-banner--yes"
    : isNo
      ? "sd-hostel-banner sd-hostel-banner--no"
      : "sd-hostel-banner";

  const description = isYes
    ? "This school has a hostel facility. Hostel-related assessment domains are included."
    : isNo
      ? "This school does not have a hostel facility. Hostel domain is hidden in assessment."
      : "Not configured yet. This is set once during your first self-assessment.";

  return (
    <Paper elevation={0} className={bannerClass}>
      <Box className="sd-hostel-banner__body">
        <Box className="sd-hostel-banner__icon">
          <Hotel sx={{ fontSize: 26 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: colors.text.secondary,
            }}
          >
            Hostel Facility
          </Typography>
          <Typography className="sd-hostel-banner__value" sx={{ color: colors.text.primary }}>
            {normalized}
          </Typography>
          {/* <Typography className="sd-hostel-banner__hint">{description}</Typography> */}
        </Box>
      </Box>
    </Paper>
  );
}

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
  <Box sx={{ height: "100%" }}>
    <Typography className="sd-info-field__label">{label}</Typography>
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
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: THEME.primary,
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: THEME.primary,
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
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: THEME.primary,
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: THEME.primary,
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
      <Typography className="sd-info-field__value">{value || "—"}</Typography>
    )}
  </Box>
);

export function SchoolDetailsPageView({ c }) {
  const {
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
    handleDrawerToggle,
    handleLogout,
    schoolDataResponse,
    isLoading,
    isError,
    error,
    schoolData,
  } = c;

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
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            zIndex: theme.zIndex.drawer + 1,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            borderBottom: `1px solid ${colors.neutral.gray200}`,
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
          <Toolbar
            sx={{
              height: { xs: 56, md: 72 },
              minHeight: { xs: "56px !important", md: "72px !important" },
              px: { xs: 1.5, md: 3 },
            }}
          >
            <IconButton
              onClick={handleDrawerToggle}
              edge="start"
              sx={{
                color: colors.text.secondary,
                borderRadius: 2,
                mr: 1.5,
                "&:hover": {
                  bgcolor: THEME.lightest,
                  color: THEME.primary,
                },
              }}
            >
              <Menu />
            </IconButton>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.dark} 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: `0 4px 12px ${THEME.primary}30`,
                }}
              >
                <School sx={{ fontSize: 22, color: "white" }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: { xs: "0.9375rem", md: "1rem" },
                    fontWeight: 800,
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
                    fontWeight: 600,
                  }}
                >
                  GSQAC school profile
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              onClick={handleLogout}
              sx={{
                color: colors.text.secondary,
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.875rem",
                borderRadius: 2,
                px: { xs: 1.5, md: 3 },
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

        <Box className="school-details-page" sx={{ mt: { xs: 7, md: 9 } }}>
          <Container maxWidth="xl" className="school-details-page__content" sx={{ py: { xs: 2, md: 3 } }}>
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
                {/* Hero */}
                <Paper elevation={0} className="sd-hero">
                  <Box className="sd-hero__inner">
                    <Typography
                      variant="h4"
                      className="sd-hero__title"
                      sx={{ fontSize: { xs: "1.35rem", md: "1.75rem" }, pr: 2 }}
                    >
                      {schoolData.schoolName || "School Profile"}
                    </Typography>
                    <Typography className="sd-hero__subtitle" variant="body2">
                      UDISE {schoolData.udiseCode || "—"}
                      {schoolData.district ? ` · ${schoolData.district}` : ""}
                      {schoolData.block ? ` · ${schoolData.block}` : ""}
                    </Typography>
                    <Box className="sd-hero__chips">
                      {schoolData.category ? (
                        <Chip size="small" label={schoolData.category} className="sd-hero__chip" />
                      ) : null}
                      {schoolData.managementType ? (
                        <Chip
                          size="small"
                          label={schoolData.managementType}
                          className="sd-hero__chip"
                        />
                      ) : null}
                      {schoolData.schoolType ? (
                        <Chip size="small" label={schoolData.schoolType} className="sd-hero__chip" />
                      ) : null}
                    </Box>
                  </Box>
                </Paper>

                {/* Hostel Facility — prominent, near top */}
                <HostelFacilityBanner value={schoolData.hostelFacility} />

                <SectionCard title="Basic Identification" icon={School} iconColor={THEME.primary}>
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6} md={3} sx={gridItemStyles}>
                      <InfoField label="School Name" value={schoolData.schoolName} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} sx={gridItemStyles}>
                      <InfoField label="UDISE Code" value={schoolData.udiseCode} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} sx={gridItemStyles}>
                      <InfoField label="District" value={schoolData.district} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} sx={gridItemStyles}>
                      <InfoField label="Block" value={schoolData.block} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} sx={gridItemStyles}>
                      <InfoField label="State" value={schoolData.state} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} sx={gridItemStyles}>
                      <InfoField label="Category" value={schoolData.category} />
                    </Grid>
                  </Grid>
                </SectionCard>

                <SectionCard title="School Profile" icon={Business} iconColor={colors.neutral.gray700}>
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6} md={3} sx={gridItemStyles}>
                      <InfoField label="Management Type" value={schoolData.managementType} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} sx={gridItemStyles}>
                      <InfoField label="School Type" value={schoolData.schoolType} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} sx={gridItemStyles}>
                      <InfoField
                        label="Medium of Instruction"
                        value={schoolData.mediumOfInstruction}
                      />
                    </Grid>
                  </Grid>
                </SectionCard>

                <SectionCard title="Contact Information" icon={Person} iconColor={THEME.primary}>
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6} md={4} sx={gridItemStyles}>
                      <InfoField label="Principal / Head Name" value={schoolData.principalName} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} sx={gridItemStyles}>
                      <InfoField label="Mobile Number" value={schoolData.mobileNumber} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} sx={gridItemStyles}>
                      <InfoField label="Email Address" value={schoolData.emailAddress} />
                    </Grid>
                  </Grid>
                </SectionCard>
              </>
            )}
          </Container>
        </Box>
      </Box>
      <SchoolHostelFacilityModalGate />
    </Box>
  );
}
