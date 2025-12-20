import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Paper,
  Typography,
  Button,
  Breadcrumbs,
  Link,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Fade,
} from "@mui/material";
import { ArrowBack, Home, Add, Delete } from "@mui/icons-material";
import { colors } from "../../../constants/colors";

const CategoryView = ({
  categoryData,
  domains,
  setDomains,
  onBack,
  onNavigateToQuestions,
  currentLanguage,
}) => {
  const { t } = useTranslation();
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState({
    en: "",
    hi: "",
    gu: "",
  });

  const handleAddCategory = () => {
    if (!newCategoryName.en.trim()) {
      return;
    }

    const updatedDomains = domains.map((d) => {
      if (d.id === categoryData.domain.id) {
        return {
          ...d,
          subdomains: d.subdomains.map((s) => {
            if (s.id === categoryData.subdomain.id) {
              return {
                ...s,
                categories: [
                  ...(s.categories || []),
                  {
                    id: Date.now(),
                    name: newCategoryName,
                    description: { en: "", hi: "", gu: "" },
                    questions: [],
                    createdAt: new Date().toISOString(),
                  },
                ],
              };
            }
            return s;
          }),
        };
      }
      return d;
    });

    setDomains(updatedDomains);
    setNewCategoryName({ en: "", hi: "", gu: "" });
    setShowAddCategory(false);
  };

  const handleDeleteCategory = (categoryId) => {
    const updatedDomains = domains.map((d) => {
      if (d.id === categoryData.domain.id) {
        return {
          ...d,
          subdomains: d.subdomains.map((s) => {
            if (s.id === categoryData.subdomain.id) {
              return {
                ...s,
                categories: (s.categories || []).filter(
                  (c) => c.id !== categoryId
                ),
              };
            }
            return s;
          }),
        };
      }
      return d;
    });
    setDomains(updatedDomains);
  };

  // Get current subdomain with updated categories
  const currentSubdomain =
    domains
      .find((d) => d.id === categoryData?.domain?.id)
      ?.subdomains?.find((s) => s.id === categoryData?.subdomain?.id) ||
    categoryData?.subdomain;

  // Safety checks
  if (!categoryData || !categoryData.domain || !categoryData.subdomain) {
    return (
      <Box>
        <Typography color="error">
          Invalid category data. Please go back.
        </Typography>
        <Button onClick={onBack} sx={{ mt: 2 }} variant="outlined">
          {t("common.cancel")}
        </Button>
      </Box>
    );
  }

  const domainName = categoryData.domain?.name || {};
  const subdomainName = categoryData.subdomain?.name || {};

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          color="inherit"
          href="#"
          onClick={onBack}
          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <Home fontSize="small" />
          {t("assessment.domain.title")}
        </Link>
        <Typography color="text.primary">
          {domainName[currentLanguage] || domainName.en || "Domain"}
        </Typography>
        <Typography color="text.primary">
          {subdomainName[currentLanguage] || subdomainName.en || "Subdomain"}
        </Typography>
        <Typography color="text.primary">
          {t("assessment.category.title")}
        </Typography>
      </Breadcrumbs>

      <Button
        startIcon={<ArrowBack />}
        onClick={onBack}
        sx={{ mb: 3 }}
        variant="outlined"
      >
        {t("common.cancel")}
      </Button>

      <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
              {currentSubdomain?.name?.[currentLanguage] ||
                currentSubdomain?.name?.en ||
                "Subdomain"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("assessment.category.title")} -{" "}
              {domainName[currentLanguage] || domainName.en || "Domain"}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowAddCategory(!showAddCategory)}
            sx={{ bgcolor: colors.primary.blue }}
          >
            {t("assessment.category.addCategory")}
          </Button>
        </Box>

        <Fade in={showAddCategory}>
          <Paper
            elevation={1}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 2,
              bgcolor: "#f9fafb",
              display: showAddCategory ? "block" : "none",
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {t("assessment.category.addCategory")}
            </Typography>
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label={`${t("assessment.category.categoryName")} (English)`}
                value={newCategoryName.en}
                onChange={(e) =>
                  setNewCategoryName({ ...newCategoryName, en: e.target.value })
                }
                variant="outlined"
                size="small"
              />
              <TextField
                fullWidth
                label={`${t("assessment.category.categoryName")} (Hindi)`}
                value={newCategoryName.hi}
                onChange={(e) =>
                  setNewCategoryName({ ...newCategoryName, hi: e.target.value })
                }
                variant="outlined"
                size="small"
              />
              <TextField
                fullWidth
                label={`${t("assessment.category.categoryName")} (Gujarati)`}
                value={newCategoryName.gu}
                onChange={(e) =>
                  setNewCategoryName({ ...newCategoryName, gu: e.target.value })
                }
                variant="outlined"
                size="small"
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleAddCategory}
                sx={{ bgcolor: colors.primary.blue }}
              >
                {t("common.add")}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategoryName({ en: "", hi: "", gu: "" });
                }}
              >
                {t("common.cancel")}
              </Button>
            </Box>
          </Paper>
        </Fade>

        {currentSubdomain?.categories &&
        currentSubdomain.categories.length > 0 ? (
          <TableContainer
            component={Paper}
            elevation={1}
            sx={{ borderRadius: 2 }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: colors.accent.orange + "10" }}>
                  <TableCell sx={{ fontWeight: 700 }}>
                    {t("assessment.category.title")}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    {t("assessment.category.categoryDescription")}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    {t("common.actions")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentSubdomain.categories.map((category) => (
                  <TableRow
                    key={category.id}
                    sx={{
                      "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                      cursor: "pointer",
                    }}
                  >
                    <TableCell>
                      <Typography fontWeight={500}>
                        {category.name[currentLanguage] || category.name.en}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {category.description[currentLanguage] ||
                          category.description.en ||
                          "No description"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          justifyContent: "center",
                        }}
                      >
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => onNavigateToQuestions(category)}
                          sx={{
                            bgcolor: colors.primary.blue,
                            textTransform: "none",
                          }}
                        >
                          {t("assessment.question.addQuestion")}
                        </Button>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteCategory(category.id)}
                          sx={{
                            bgcolor: colors.semantic.error + "15",
                            "&:hover": {
                              bgcolor: colors.semantic.error + "25",
                            },
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Paper
            elevation={1}
            sx={{ p: 4, textAlign: "center", borderRadius: 2 }}
          >
            <Typography variant="body1" color="text.secondary">
              {t("assessment.category.noCategories")}
            </Typography>
          </Paper>
        )}
      </Paper>
    </Box>
  );
};

export default CategoryView;
