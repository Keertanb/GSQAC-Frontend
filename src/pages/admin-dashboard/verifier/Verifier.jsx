import React from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import { VerifiedUser } from "@mui/icons-material";
import { colors } from "../../../constants/colors";

const Verifier = () => {
  const { t } = useTranslation();

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 4, borderRadius: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <VerifiedUser sx={{ fontSize: 48, color: colors.primary.blue }} />
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Verifier Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage verifiers and their assignments
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card
              elevation={2}
              sx={{
                height: "100%",
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-4px)" },
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Active Verifiers
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: colors.primary.blue }}>
                  0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Currently active verifiers
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              elevation={2}
              sx={{
                height: "100%",
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-4px)" },
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pending Assignments
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: colors.accent.orange }}>
                  0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Assignments awaiting verification
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              elevation={2}
              sx={{
                height: "100%",
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-4px)" },
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Completed Verifications
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: colors.accent.green }}>
                  0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total completed verifications
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, textAlign: "center", py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Verifier management features coming soon...
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Verifier;

