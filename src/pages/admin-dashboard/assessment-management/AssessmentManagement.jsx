import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Fade,
  Card,
  CardContent,
} from "@mui/material";
import {
  Add,
  Delete,
  ExpandMore,
  ExpandLess,
  Language,
} from "@mui/icons-material";
import { colors } from "../../../constants/colors";
import DomainSubdomainView from "./DomainSubdomainView";
import CategoryView from "./CategoryView";
import QuestionView from "./QuestionView";
import "./AssessmentManagement.css";

const AssessmentManagement = () => {
  const { t, i18n } = useTranslation();
  const [domains, setDomains] = useState([]);
  const [newDomainName, setNewDomainName] = useState({ en: "", hi: "", gu: "" });
  const [expandedDomain, setExpandedDomain] = useState(null);
  const [currentView, setCurrentView] = useState("domains"); // domains, categories, questions
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [currentLanguage, setCurrentLanguage] = useState("en");

  const handleAddDomain = () => {
    if (!newDomainName.en.trim()) {
      return;
    }

    const newDomain = {
      id: Date.now(),
      name: newDomainName,
      description: { en: "", hi: "", gu: "" },
      subdomains: [],
      createdAt: new Date().toISOString(),
    };

    setDomains([...domains, newDomain]);
    setNewDomainName({ en: "", hi: "", gu: "" });
  };

  const handleDeleteDomain = (domainId) => {
    setDomains(domains.filter((d) => d.id !== domainId));
    if (expandedDomain === domainId) {
      setExpandedDomain(null);
    }
  };

  const handleToggleDomain = (domainId) => {
    setExpandedDomain(expandedDomain === domainId ? null : domainId);
  };

  const handleLanguageChange = (lang) => {
    setCurrentLanguage(lang);
    i18n.changeLanguage(lang);
  };

  return (
    <Box className="assessment-management-container">
      {/* Language Selector */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end", gap: 1 }}>
        {["en", "hi", "gu"].map((lang) => (
          <Chip
            key={lang}
            label={lang.toUpperCase()}
            onClick={() => handleLanguageChange(lang)}
            color={currentLanguage === lang ? "primary" : "default"}
            sx={{
              cursor: "pointer",
              fontWeight: currentLanguage === lang ? 700 : 400,
            }}
          />
        ))}
      </Box>

      {currentView === "domains" && (
        <Box>
          <Card elevation={2} sx={{ mb: 3, p: 3, borderRadius: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
              {t("assessment.domain.addDomain")}
            </Typography>
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label={`${t("assessment.domain.domainName")} (English)`}
                value={newDomainName.en}
                onChange={(e) =>
                  setNewDomainName({ ...newDomainName, en: e.target.value })
                }
                variant="outlined"
                size="small"
              />
              <TextField
                fullWidth
                label={`${t("assessment.domain.domainName")} (Hindi)`}
                value={newDomainName.hi}
                onChange={(e) =>
                  setNewDomainName({ ...newDomainName, hi: e.target.value })
                }
                variant="outlined"
                size="small"
              />
              <TextField
                fullWidth
                label={`${t("assessment.domain.domainName")} (Gujarati)`}
                value={newDomainName.gu}
                onChange={(e) =>
                  setNewDomainName({ ...newDomainName, gu: e.target.value })
                }
                variant="outlined"
                size="small"
              />
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddDomain}
              sx={{
                bgcolor: colors.primary.blue,
                "&:hover": { bgcolor: colors.primary.dark },
              }}
            >
              {t("common.add")} {t("assessment.domain.title")}
            </Button>
          </Card>

          {/* Domains Table */}
          {domains.length > 0 ? (
            <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: colors.primary.blue + "10" }}>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {t("assessment.domain.title")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {t("assessment.domain.domainDetails")}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                      {t("common.actions")}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {domains.map((domain) => (
                    <React.Fragment key={domain.id}>
                      <TableRow
                        sx={{
                          "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                          cursor: "pointer",
                        }}
                        onClick={() => handleToggleDomain(domain.id)}
                      >
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {expandedDomain === domain.id ? (
                              <ExpandLess />
                            ) : (
                              <ExpandMore />
                            )}
                            <Typography fontWeight={600}>
                              {domain.name[currentLanguage] || domain.name.en}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {domain.description[currentLanguage] ||
                              domain.description.en ||
                              "No description"}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedDomain(domain.id);
                              }}
                              sx={{
                                bgcolor: colors.primary.blue + "15",
                                "&:hover": { bgcolor: colors.primary.blue + "25" },
                              }}
                            >
                              <Add />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDomain(domain.id);
                              }}
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
                      {expandedDomain === domain.id && (
                        <TableRow>
                          <TableCell colSpan={3} sx={{ py: 3, bgcolor: "#f9fafb" }}>
                            <DomainSubdomainView
                              domain={domain}
                              domains={domains}
                              setDomains={setDomains}
                              currentLanguage={currentLanguage}
                              onNavigateToCategories={(subdomain) => {
                                setSelectedCategory({ domain, subdomain });
                                setCurrentView("categories");
                                setExpandedDomain(null);
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Card elevation={2} sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
              <Typography variant="body1" color="text.secondary">
                {t("assessment.domain.noDomains")}
              </Typography>
            </Card>
          )}
        </Box>
      )}

      {currentView === "categories" && selectedCategory && (
        <CategoryView
          categoryData={selectedCategory}
          domains={domains}
          setDomains={setDomains}
          onBack={() => {
            setCurrentView("domains");
            setSelectedCategory(null);
          }}
          onNavigateToQuestions={(category) => {
            if (selectedCategory && selectedCategory.domain && selectedCategory.subdomain) {
              setSelectedCategory({
                domain: selectedCategory.domain,
                subdomain: selectedCategory.subdomain,
                category: category,
              });
              setCurrentView("questions");
            }
          }}
          currentLanguage={currentLanguage}
        />
      )}

      {currentView === "questions" && selectedCategory && (
        <QuestionView
          questionData={selectedCategory}
          domains={domains}
          setDomains={setDomains}
          onBack={() => {
            setCurrentView("categories");
            setSelectedCategory({ ...selectedCategory, category: null });
          }}
          currentLanguage={currentLanguage}
        />
      )}
    </Box>
  );
};

export default AssessmentManagement;

