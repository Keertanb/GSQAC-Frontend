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
  IconButton,
  InputAdornment,
} from "@mui/material";
import {
  Search as SearchIcon,
  School as SchoolIcon,
  Visibility,
  VisibilityOff,
  ContentCopy as ContentCopyIcon,
  LockReset as LockResetIcon,
} from "@mui/icons-material";
import { enqueueSnackbar } from "notistack";
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

export function SchoolPasswordResetPageView({ c }) {
  const {
    schoolIdInput,
    setSchoolIdInput,
    searchedSchoolId,
    handleSearch,
    handleClear,
    isLoadingLogin,
    isLoginError,
    loginError,
    login,
    school,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    passwordError,
    canReset,
    confirmOpen,
    setConfirmOpen,
    handleOpenResetConfirm,
    handleConfirmReset,
    isResetting,
  } = c;

  const currentPassword = login?.password || "";

  const handleCopyPassword = async () => {
    if (!currentPassword) return;
    try {
      await navigator.clipboard.writeText(currentPassword);
      enqueueSnackbar("Current password copied.", { variant: "success" });
    } catch {
      enqueueSnackbar("Could not copy password.", { variant: "warning" });
    }
  };

  return (
    <Box className="school-password-reset-page" sx={{ width: "100%" }}>
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
          School Password Reset
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Search a school by UDISE / School ID to view the current login password
          and reset it from this page.
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
            disabled={isLoadingLogin}
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

      {isLoadingLogin ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : null}

      {isLoginError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loginError?.response?.data?.message ||
            loginError?.message ||
            "No school login found for this School ID."}
        </Alert>
      ) : null}

      {!isLoadingLogin && searchedSchoolId && login ? (
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
                {school.schoolName || "School login found"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                School ID / User name: {login.schoolId || searchedSchoolId}
              </Typography>
            </Box>
            <Chip
              size="small"
              label={login.isActive ? "Active login" : "Inactive login"}
              sx={{
                fontWeight: 700,
                bgcolor: login.isActive
                  ? `${colors.accent.green}18`
                  : `${colors.semantic.error}15`,
                color: login.isActive
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
            <DetailRow label="Mobile" value={login.mobileNumber || school.principalMobile} />
            <DetailRow
              label="Last updated"
              value={login.updatedAt}
            />
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
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.25 }}>
              Current password
            </Typography>
            <TextField
              fullWidth
              size="small"
              label="Old / current password"
              value={currentPassword}
              InputProps={{
                readOnly: true,
                type: showCurrentPassword ? "text" : "password",
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                    >
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={handleCopyPassword}
                      aria-label="Copy password"
                      disabled={!currentPassword}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.25 }}>
            Set new password
          </Typography>
          <Stack spacing={1.5} sx={{ mb: 2.5, maxWidth: 480 }}>
            <TextField
              fullWidth
              size="small"
              label="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type={showNewPassword ? "text" : "password"}
              error={Boolean(newPassword || confirmPassword) && Boolean(passwordError)}
              helperText={
                Boolean(newPassword || confirmPassword) && passwordError
                  ? passwordError
                  : "At least 4 characters, no spaces."
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              size="small"
              label="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type={showNewPassword ? "text" : "password"}
              error={Boolean(confirmPassword) && newPassword !== confirmPassword}
            />
          </Stack>

          <Button
            variant="contained"
            startIcon={<LockResetIcon />}
            onClick={handleOpenResetConfirm}
            disabled={!canReset || isResetting}
            sx={{ textTransform: "none", fontWeight: 800, px: 2.5, py: 1.1 }}
          >
            Reset Password
          </Button>
        </Paper>
      ) : null}

      {!isLoadingLogin && searchedSchoolId && !login && !isLoginError ? (
        <Alert severity="info">
          No school login found for School ID <strong>{searchedSchoolId}</strong>.
        </Alert>
      ) : null}

      <ConfirmationModal
        open={confirmOpen}
        onClose={() => !isResetting && setConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset school password?"
        message={`This will replace the current password for school ${searchedSchoolId}${
          school?.schoolName ? ` (${school.schoolName})` : ""
        }. The school must use the new password to log in.`}
        confirmText="Yes, Reset Password"
        cancelText="Cancel"
        variant="warning"
        isLoading={isResetting}
      />
    </Box>
  );
}
