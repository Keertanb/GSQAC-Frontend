import React from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Stack,
} from "@mui/material";
import {
  Search as SearchIcon,
  RestartAlt as RestartAltIcon,
  School as SchoolIcon,
} from "@mui/icons-material";
import ConfirmationModal from "../../../../components/ConfirmationModal/ConfirmationModal";
import { colors } from "../../../../constants/colors";

function DetailRow({ label, value }) {
  if (value == null || value === "") return null;
  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", py: 0.5 }}>
      <Typography
        variant="body2"
        sx={{ color: colors.text.secondary, minWidth: 140, fontWeight: 600 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: colors.text.primary, fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  );
}

export function SchoolFormResetPageView({ c }) {
  const {
    schoolIdInput,
    setSchoolIdInput,
    searchedSchoolId,
    handleSearch,
    handleClear,
    isLoadingDetail,
    isDetailError,
    detailError,
    school,
    assessments,
    assessmentSummary,
    hasSchoolUser,
    canReset,
    confirmOpen,
    setConfirmOpen,
    handleOpenResetConfirm,
    handleConfirmReset,
    isResetting,
  } = c;

  return (
    <Box className="school-form-reset-page" sx={{ width: "100%" }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          mb: 2.5,
          borderRadius: 3,
          border: `1px solid ${colors.neutral.gray200}`,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
          School Form Reset
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Search a school by UDISE / School ID, review details, then reset their
          filled self-assessment answers, sessions, and evidence.
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <TextField
            fullWidth
            size="small"
            label="School ID / UDISE"
            placeholder="e.g. 24010103101"
            value={schoolIdInput}
            onChange={(e) => setSchoolIdInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={isLoadingDetail}
            sx={{ textTransform: "none", fontWeight: 700, minWidth: 120 }}
          >
            Search
          </Button>
          {searchedSchoolId ? (
            <Button
              variant="outlined"
              onClick={handleClear}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Clear
            </Button>
          ) : null}
        </Stack>
      </Paper>

      {isLoadingDetail ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : null}

      {isDetailError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {detailError?.response?.data?.message ||
            detailError?.message ||
            "Failed to fetch school details."}
        </Alert>
      ) : null}

      {!isLoadingDetail && searchedSchoolId && school ? (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: 3,
            border: `1px solid ${colors.neutral.gray200}`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
              mb: 2,
              flexWrap: "wrap",
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: `${colors.primary.blue}12`,
                color: colors.primary.blue,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SchoolIcon />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
                {school.schoolName || "School"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                School ID: {school.schoolId || searchedSchoolId}
              </Typography>
            </Box>
            <Chip
              size="small"
              label={hasSchoolUser ? "Login account found" : "No school login found"}
              sx={{
                fontWeight: 700,
                bgcolor: hasSchoolUser
                  ? `${colors.accent.green}18`
                  : `${colors.semantic.error}15`,
                color: hasSchoolUser
                  ? colors.accent.green
                  : colors.semantic.error,
              }}
            />
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 1,
              mb: 2.5,
            }}
          >
            <DetailRow label="District" value={school.districtName} />
            <DetailRow label="Block / Taluka" value={school.blockName} />
            <DetailRow label="Management" value={school.schoolManagementName} />
            <DetailRow label="Category" value={school.schoolCategoryName} />
            <DetailRow
              label="Class range"
              value={
                school.lowerClass != null && school.upperClass != null
                  ? `${school.lowerClass} – ${school.upperClass}`
                  : null
              }
            />
            <DetailRow label="Principal" value={school.principalName} />
            <DetailRow label="Mobile" value={school.principalMobile} />
            <DetailRow label="Academic year" value={school.academicYear} />
            {school.round != null && school.round !== "" ? (
              <DetailRow label="Round" value={school.round} />
            ) : null}
          </Box>

          <Box
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: 2,
              bgcolor: colors.neutral.gray50 || "#f9fafb",
              border: `1px solid ${colors.neutral.gray200}`,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
              Assessment status
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                label={`Assessments: ${assessmentSummary.total}`}
                sx={{ fontWeight: 700 }}
              />
              <Chip
                size="small"
                label={`Submitted: ${assessmentSummary.submitted}`}
                color="success"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
              <Chip
                size="small"
                label={`Not submitted: ${assessmentSummary.inProgress}`}
                color="warning"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            </Stack>

            {assessments.length > 0 ? (
              <Box sx={{ mt: 1.5 }}>
                {assessments.map((item) => (
                  <Typography
                    key={`${item.assessmentId}-${item.roleId}`}
                    variant="body2"
                    sx={{ color: colors.text.secondary, py: 0.25 }}
                  >
                    • {item.assessmentName || `Assessment ${item.assessmentId}`}
                    {item.roleName ? ` (${item.roleName})` : ""} —{" "}
                    {Number(item.isSubmitted) === 1 || item.isSubmitted === true
                      ? "Submitted"
                      : item.sessionId
                        ? "In progress"
                        : "Not started"}
                  </Typography>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No assessment session data found for this school yet.
              </Typography>
            )}
          </Box>

          {!hasSchoolUser ? (
            <Alert severity="warning">
              This School ID was found in registry, but no active school login
              (role 2) exists in GSQAC. Form reset is not available.
            </Alert>
          ) : (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Reset permanently deletes this school&apos;s self-assessment
                answers, assessment sessions, and uploaded evidence for the
                current academic year. The school will need to fill the form
                again.
              </Alert>
              <Button
                variant="contained"
                color="error"
                startIcon={<RestartAltIcon />}
                onClick={handleOpenResetConfirm}
                disabled={!canReset || isResetting}
                sx={{ textTransform: "none", fontWeight: 800, px: 2.5, py: 1.1 }}
              >
                Reset School Form
              </Button>
            </>
          )}
        </Paper>
      ) : null}

      {!isLoadingDetail && searchedSchoolId && !school && !isDetailError ? (
        <Alert severity="info">
          No school details found for School ID <strong>{searchedSchoolId}</strong>.
        </Alert>
      ) : null}

      <ConfirmationModal
        open={confirmOpen}
        onClose={() => !isResetting && setConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset school assessment form?"
        message={`This will permanently clear all filled answers, sessions, and evidence for school ${searchedSchoolId}${
          school?.schoolName ? ` (${school.schoolName})` : ""
        }. The school must complete the self-assessment again. This cannot be undone.`}
        confirmText="Yes, Reset Form"
        cancelText="Cancel"
        variant="danger"
        isLoading={isResetting}
      />
    </Box>
  );
}
