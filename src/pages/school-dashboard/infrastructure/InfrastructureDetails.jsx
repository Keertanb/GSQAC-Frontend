import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  CircularProgress,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import {
  WaterDrop,
  Home,
  ElectricBolt,
  Wc,
  Save,
  CheckCircle,
  Cancel,
} from "@mui/icons-material";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetSchoolInfrastructureQuery,
  useUpdateSchoolInfrastructureMutation,
} from "../../../services/schoolService";
import useAuthStore from "../../../store/useAuthStore";

const InfrastructureDetails = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const schoolId = user?.schoolId || "24060100401"; // Use from auth store or fallback

  const [formData, setFormData] = useState({
    drinkingWater: 0,
    puccaBuilding: 0,
    electricity: 0,
    functionalToilets: 0,
  });

  // Fetch infrastructure details
  const {
    data: infrastructureData,
    isLoading,
    isError,
  } = useGetSchoolInfrastructureQuery({
    schoolId,
    enabled: !!schoolId,
  });

  // Update infrastructure mutation
  const updateMutation = useUpdateSchoolInfrastructureMutation({
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries(["school", "infrastructure", schoolId]);
    },
  });

  // Populate form with fetched data
  useEffect(() => {
    if (infrastructureData?.data) {
      setFormData({
        drinkingWater: infrastructureData.data.drinkingWater || 0,
        puccaBuilding: infrastructureData.data.puccaBuilding || 0,
        electricity: infrastructureData.data.electricity || 0,
        functionalToilets: infrastructureData.data.functionalToilets || 0,
      });
    }
  }, [infrastructureData]);

  const handleToggle = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field] === 1 ? 0 : 1,
    }));
  };

  const handleSubmit = () => {
    updateMutation.mutate({
      schoolId,
      ...formData,
    });
  };

  const facilities = [
    {
      key: "drinkingWater",
      label: "Drinking Water",
      icon: <WaterDrop sx={{ fontSize: 40 }} />,
      color: "#3b82f6",
    },
    {
      key: "puccaBuilding",
      label: "Pucca Building",
      icon: <Home sx={{ fontSize: 40 }} />,
      color: "#10b981",
    },
    {
      key: "electricity",
      label: "Electricity",
      icon: <ElectricBolt sx={{ fontSize: 40 }} />,
      color: "#f59e0b",
    },
    {
      key: "functionalToilets",
      label: "Functional Toilets",
      icon: <Wc sx={{ fontSize: 40 }} />,
      color: "#8b5cf6",
    },
  ];

  if (isLoading) {
    return (
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
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          Failed to load infrastructure details. Please try again.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: "#0f172a",
            mb: 1,
            letterSpacing: "-0.5px",
          }}
        >
          Infrastructure Details
        </Typography>
        <Typography variant="body1" sx={{ color: "#64748b" }}>
          Manage your school's infrastructure facilities and amenities
        </Typography>
      </Box>

      {/* Infrastructure Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {facilities.map((facility) => {
          const isAvailable = formData[facility.key] === 1;
          return (
            <Grid item xs={12} sm={6} md={3} key={facility.key}>
              <Card
                sx={{
                  height: "100%",
                  border: `2px solid ${isAvailable ? facility.color : "#e2e8f0"}`,
                  borderRadius: "16px",
                  transition: "all 0.3s",
                  boxShadow: isAvailable
                    ? `0 8px 24px ${facility.color}40`
                    : "0 2px 8px rgba(0,0,0,0.04)",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: `0 12px 32px ${facility.color}30`,
                  },
                }}
              >
                <CardContent sx={{ p: 3, textAlign: "center" }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      margin: "0 auto",
                      mb: 2,
                      borderRadius: "16px",
                      background: isAvailable
                        ? `linear-gradient(135deg, ${facility.color}20, ${facility.color}10)`
                        : "#f8fafc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isAvailable ? facility.color : "#94a3b8",
                      transition: "all 0.3s",
                    }}
                  >
                    {facility.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: "#0f172a",
                      mb: 2,
                      fontSize: "1rem",
                    }}
                  >
                    {facility.label}
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isAvailable}
                        onChange={() => handleToggle(facility.key)}
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": {
                            color: facility.color,
                          },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                            {
                              backgroundColor: facility.color,
                            },
                        }}
                      />
                    }
                    label={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {isAvailable ? (
                          <>
                            <CheckCircle
                              sx={{ color: facility.color, fontSize: 20 }}
                            />
                            <Typography
                              sx={{
                                color: facility.color,
                                fontWeight: 600,
                                fontSize: "0.875rem",
                              }}
                            >
                              Available
                            </Typography>
                          </>
                        ) : (
                          <>
                            <Cancel sx={{ color: "#94a3b8", fontSize: 20 }} />
                            <Typography
                              sx={{
                                color: "#64748b",
                                fontWeight: 600,
                                fontSize: "0.875rem",
                              }}
                            >
                              Not Available
                            </Typography>
                          </>
                        )}
                      </Box>
                    }
                    sx={{ m: 0 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Save Button */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={
            updateMutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Save />
            )
          }
          onClick={handleSubmit}
          disabled={updateMutation.isPending}
          sx={{
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            color: "white",
            fontSize: "1rem",
            fontWeight: 600,
            padding: "12px 48px",
            borderRadius: "12px",
            textTransform: "none",
            boxShadow: "0 8px 24px rgba(59, 130, 246, 0.3)",
            "&:hover": {
              background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
              boxShadow: "0 12px 32px rgba(59, 130, 246, 0.4)",
              transform: "translateY(-2px)",
            },
            "&:disabled": {
              background: "#e2e8f0",
              color: "#94a3b8",
            },
          }}
        >
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </Box>
    </Box>
  );
};

export default InfrastructureDetails;






