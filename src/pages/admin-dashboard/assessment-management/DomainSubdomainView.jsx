import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Paper,
  Typography,
  Fade,
  TableContainer,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { colors } from "../../../constants/colors";

const DomainSubdomainView = ({
  domain,
  domains,
  setDomains,
  currentLanguage,
  onNavigateToCategories,
}) => {
  const { t } = useTranslation();
  const [showAddSubdomain, setShowAddSubdomain] = useState(false);
  const [newSubdomainName, setNewSubdomainName] = useState({
    en: "",
    hi: "",
    gu: "",
  });

  const handleAddSubdomain = () => {
    if (!newSubdomainName.en.trim()) {
      return;
    }

    const updatedDomains = domains.map((d) => {
      if (d.id === domain.id) {
        return {
          ...d,
          subdomains: [
            ...d.subdomains,
            {
              id: Date.now(),
              name: newSubdomainName,
              description: { en: "", hi: "", gu: "" },
              categories: [],
              createdAt: new Date().toISOString(),
            },
          ],
        };
      }
      return d;
    });

    setDomains(updatedDomains);
    setNewSubdomainName({ en: "", hi: "", gu: "" });
    setShowAddSubdomain(false);
  };

  const handleDeleteSubdomain = (subdomainId) => {
    const updatedDomains = domains.map((d) => {
      if (d.id === domain.id) {
        return {
          ...d,
          subdomains: d.subdomains.filter((s) => s.id !== subdomainId),
        };
      }
      return d;
    });
    setDomains(updatedDomains);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => setShowAddSubdomain(!showAddSubdomain)}
          sx={{
            borderColor: colors.primary.blue,
            color: colors.primary.blue,
            "&:hover": {
              borderColor: colors.primary.dark,
              bgcolor: colors.primary.blue + "10",
            },
          }}
        >
          {t("assessment.subdomain.addSubdomain")}
        </Button>
      </Box>

      <Fade in={showAddSubdomain}>
        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            bgcolor: "#f9fafb",
            display: showAddSubdomain ? "block" : "none",
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {t("assessment.subdomain.addSubdomain")}
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label={`${t("assessment.subdomain.subdomainName")} (English)`}
              value={newSubdomainName.en}
              onChange={(e) =>
                setNewSubdomainName({ ...newSubdomainName, en: e.target.value })
              }
              variant="outlined"
              size="small"
            />
            <TextField
              fullWidth
              label={`${t("assessment.subdomain.subdomainName")} (Hindi)`}
              value={newSubdomainName.hi}
              onChange={(e) =>
                setNewSubdomainName({ ...newSubdomainName, hi: e.target.value })
              }
              variant="outlined"
              size="small"
            />
            <TextField
              fullWidth
              label={`${t("assessment.subdomain.subdomainName")} (Gujarati)`}
              value={newSubdomainName.gu}
              onChange={(e) =>
                setNewSubdomainName({ ...newSubdomainName, gu: e.target.value })
              }
              variant="outlined"
              size="small"
            />
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleAddSubdomain}
              sx={{ bgcolor: colors.primary.blue }}
            >
              {t("common.add")}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setShowAddSubdomain(false);
                setNewSubdomainName({ en: "", hi: "", gu: "" });
              }}
            >
              {t("common.cancel")}
            </Button>
          </Box>
        </Paper>
      </Fade>

      {domain.subdomains && domain.subdomains.length > 0 ? (
        <TableContainer
          component={Paper}
          elevation={1}
          sx={{ borderRadius: 2 }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: colors.accent.green + "10" }}>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t("assessment.subdomain.title")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t("assessment.subdomain.subdomainDescription")}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {t("common.actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {domain.subdomains.map((subdomain) => (
                <React.Fragment key={subdomain.id}>
                  <TableRow
                    sx={{
                      "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                    }}
                  >
                    <TableCell>
                      <Typography fontWeight={500}>
                        {subdomain.name[currentLanguage] || subdomain.name.en}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {subdomain.description[currentLanguage] ||
                          subdomain.description.en ||
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
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onNavigateToCategories) {
                              onNavigateToCategories(subdomain);
                            }
                          }}
                          sx={{
                            bgcolor: colors.accent.green + "15",
                            "&:hover": { bgcolor: colors.accent.green + "25" },
                          }}
                        >
                          <Add />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubdomain(subdomain.id);
                          }}
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
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper
          elevation={1}
          sx={{ p: 3, textAlign: "center", borderRadius: 2 }}
        >
          <Typography variant="body2" color="text.secondary">
            {t("assessment.subdomain.noSubdomains")}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

// Category view within subdomain
const CategorySubdomainView = ({
  subdomain,
  domain,
  domains,
  setDomains,
  currentLanguage,
  onNavigateToQuestions,
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
      if (d.id === domain.id) {
        return {
          ...d,
          subdomains: d.subdomains.map((s) => {
            if (s.id === subdomain.id) {
              return {
                ...s,
                categories: [
                  ...s.categories,
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
      if (d.id === domain.id) {
        return {
          ...d,
          subdomains: d.subdomains.map((s) => {
            if (s.id === subdomain.id) {
              return {
                ...s,
                categories: s.categories.filter((c) => c.id !== categoryId),
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

  const handleNavigateToQuestions = (category) => {
    if (onNavigateToQuestions) {
      onNavigateToQuestions({ domain, subdomain, category });
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Add />}
          onClick={() => setShowAddCategory(!showAddCategory)}
          sx={{
            borderColor: colors.accent.green,
            color: colors.accent.green,
            "&:hover": {
              borderColor: colors.accent.green,
              bgcolor: colors.accent.green + "10",
            },
          }}
        >
          {t("assessment.category.addCategory")}
        </Button>
      </Box>

      <Fade in={showAddCategory}>
        <Paper
          elevation={1}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 2,
            bgcolor: "#ffffff",
            display: showAddCategory ? "block" : "none",
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
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
              size="small"
              onClick={handleAddCategory}
              sx={{ bgcolor: colors.accent.green }}
            >
              {t("common.add")}
            </Button>
            <Button
              variant="outlined"
              size="small"
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

      {subdomain.categories && subdomain.categories.length > 0 ? (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ borderRadius: 2 }}
        >
          <Table size="small">
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
              {subdomain.categories.map((category) => (
                <TableRow
                  key={category.id}
                  sx={{
                    "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
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
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleNavigateToQuestions(category)}
                        sx={{
                          bgcolor: colors.accent.orange + "15",
                          "&:hover": { bgcolor: colors.accent.orange + "25" },
                        }}
                      >
                        <Add />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteCategory(category.id)}
                        sx={{
                          bgcolor: colors.semantic.error + "15",
                          "&:hover": { bgcolor: colors.semantic.error + "25" },
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
          elevation={0}
          sx={{ p: 2, textAlign: "center", borderRadius: 2 }}
        >
          <Typography variant="body2" color="text.secondary">
            {t("assessment.category.noCategories")}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default DomainSubdomainView;
