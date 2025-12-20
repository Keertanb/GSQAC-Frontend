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
import { Business } from "@mui/icons-material";
import { colors } from "../../../constants/colors";

const SchoolAllocation = () => {
  const { t } = useTranslation();

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 4, borderRadius: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Business sx={{ fontSize: 48, color: colors.primary.blue }} />
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              School Allocation
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage school assignments and allocations
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
                  Total Schools
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: colors.primary.blue }}>
                  0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Registered schools in system
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
                  Allocated Schools
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: colors.accent.green }}>
                  0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Schools with assigned verifiers
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
                  Pending Allocation
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: colors.accent.orange }}>
                  0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Schools awaiting allocation
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, textAlign: "center", py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            School allocation features coming soon...
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default SchoolAllocation;

