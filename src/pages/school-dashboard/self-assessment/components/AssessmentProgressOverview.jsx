import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  LinearProgress,
} from "@mui/material";
import {
  ArrowBack,
  ChevronRight,
  CheckCircle,
  Timelapse,
  RadioButtonUnchecked,
  AssessmentOutlined,
} from "@mui/icons-material";
import { colors } from "../../../../constants/colors";
import { getAssessmentTheme } from "../../../../utils/assessmentTheme";
import "./AssessmentProgressOverview.css";

function stripLeadingNumber(name) {
  return String(name || "").replace(/^\d+\.\s*/, "");
}

function getStatus(progress) {
  if (progress >= 100) return "complete";
  if (progress > 0) return "inProgress";
  return "notStarted";
}

function CircularProgressRing({
  value,
  size = 92,
  stroke = 9,
  color,
  trackColor = colors.neutral.gray200,
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));
  const offset = circumference - (safeValue / 100) * circumference;

  return (
    <Box
      className="sa-progress-ring"
      sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}
    >
      <svg width={size} height={size} className="sa-progress-ring__svg">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="sa-progress-ring__bar"
        />
      </svg>
      <Box className="sa-progress-ring__label">
        <Typography
          component="span"
          sx={{ fontWeight: 800, fontSize: "1.25rem", lineHeight: 1, color }}
        >
          {Math.round(safeValue)}
        </Typography>
        <Typography
          component="span"
          sx={{
            fontWeight: 700,
            fontSize: "0.6875rem",
            color: colors.text.secondary,
            mt: 0.25,
          }}
        >
          %
        </Typography>
      </Box>
    </Box>
  );
}

function ProgressItemCard({
  item,
  index,
  accentColor,
  getProgressColor,
  onClick,
  statusLabels,
}) {
  const status = getStatus(item.progress);
  const displayName = stripLeadingNumber(item.name);
  const barColor = getProgressColor(item.progress);

  const StatusIcon =
    status === "complete"
      ? CheckCircle
      : status === "inProgress"
        ? Timelapse
        : RadioButtonUnchecked;

  const statusColor =
    status === "complete"
      ? colors.accent.green
      : status === "inProgress"
        ? colors.semantic.warning
        : colors.neutral.gray400;

  return (
    <Box
      component="button"
      type="button"
      className="sa-progress-item"
      onClick={onClick}
      sx={{
        width: "100%",
        textAlign: "left",
        border: `1px solid ${colors.neutral.gray200}`,
        borderRadius: 2.5,
        p: { xs: 1.75, md: 2 },
        bgcolor: "#fff",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.22s ease",
        boxShadow: "0 1px 4px rgba(15, 23, 42, 0.04)",
        "&:hover": onClick
          ? {
              borderColor: `${accentColor}55`,
              boxShadow: `0 8px 24px ${accentColor}18`,
              transform: "translateY(-1px)",
            }
          : undefined,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1.5,
          mb: 1.25,
        }}
      >
        <Box
          className="sa-progress-item__index"
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontWeight: 800,
            fontSize: "0.8125rem",
            bgcolor: `${accentColor}14`,
            color: accentColor,
          }}
        >
          {index + 1}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: colors.text.primary,
              lineHeight: 1.35,
              mb: 0.5,
            }}
          >
            {displayName}
          </Typography>
          <Chip
            size="small"
            icon={<StatusIcon sx={{ fontSize: "14px !important" }} />}
            label={statusLabels[status]}
            sx={{
              height: 24,
              fontWeight: 700,
              fontSize: "0.6875rem",
              bgcolor: `${statusColor}14`,
              color: statusColor,
              border: `1px solid ${statusColor}30`,
              "& .MuiChip-icon": { color: statusColor },
            }}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            flexShrink: 0,
            color: barColor,
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: "1.125rem" }}>
            {item.progress}%
          </Typography>
          {onClick ? (
            <ChevronRight sx={{ fontSize: 20, color: colors.text.tertiary }} />
          ) : null}
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={item.progress}
        sx={{
          height: 8,
          borderRadius: 99,
          bgcolor: colors.neutral.gray100,
          "& .MuiLinearProgress-bar": {
            borderRadius: 99,
            bgcolor: barColor,
          },
        }}
      />
    </Box>
  );
}

export function AssessmentProgressOverview({
  items = [],
  title,
  subtitle,
  assessmentTheme,
  assessments = [],
  chartDrilldownAssessmentId,
  showBackButton = false,
  onBack,
  onItemClick,
  getProgressColor,
  t,
}) {
  const at = assessmentTheme || {
    primary: colors.primary.blue,
    dark: colors.primary.dark,
    lightest: colors.primary.lightest,
    panelGradient: `linear-gradient(180deg, ${colors.primary.lightest} 0%, #ffffff 100%)`,
  };

  const summary = useMemo(() => {
    if (!items.length) {
      return { average: 0, complete: 0, inProgress: 0, notStarted: 0 };
    }
    const total = items.reduce((sum, item) => sum + (item.progress || 0), 0);
    const complete = items.filter((item) => item.progress >= 100).length;
    const inProgress = items.filter(
      (item) => item.progress > 0 && item.progress < 100,
    ).length;
    const notStarted = items.filter((item) => item.progress === 0).length;
    return {
      average: Math.round(total / items.length),
      complete,
      inProgress,
      notStarted,
    };
  }, [items]);

  const statusLabels = {
    complete: t("selfAssessment.progressOverview.complete"),
    inProgress: t("selfAssessment.progressOverview.inProgress"),
    notStarted: t("selfAssessment.progressOverview.notStarted"),
  };

  const resolveAccentColor = (item) => {
    if (item.assessmentId != null) {
      const assessment = assessments.find(
        (a) => Number(a.assessmentId) === Number(item.assessmentId),
      );
      return getAssessmentTheme(assessment).primary;
    }
    return at.primary;
  };

  return (
    <Box className="sa-progress-overview">
      <Box
        className="sa-progress-overview__hero"
        sx={{
          background: at.panelGradient,
          border: `1px solid ${at.primary}22`,
          borderRadius: 3,
          p: { xs: 2, md: 2.5 },
          mb: 2.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: { xs: 2, md: 2.5 },
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <CircularProgressRing
            value={summary.average}
            color={at.primary}
            trackColor={`${at.primary}18`}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 0.75,
                flexWrap: "wrap",
              }}
            >
              <AssessmentOutlined sx={{ color: at.primary, fontSize: 22 }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, color: colors.text.primary, lineHeight: 1.25 }}
              >
                {title}
              </Typography>
            </Box>
            {subtitle ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1.5, lineHeight: 1.5 }}
              >
                {subtitle}
              </Typography>
            ) : null}
            <Box className="sa-progress-overview__stats" sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Chip
                size="small"
                label={t("selfAssessment.progressOverview.totalItems", {
                  count: items.length,
                })}
                sx={{
                  fontWeight: 700,
                  bgcolor: `${at.primary}12`,
                  color: at.primary,
                  border: `1px solid ${at.primary}28`,
                }}
              />
              <Chip
                size="small"
                label={t("selfAssessment.progressOverview.completeCount", {
                  count: summary.complete,
                })}
                sx={{
                  fontWeight: 700,
                  bgcolor: `${colors.accent.green}12`,
                  color: colors.accent.green,
                  border: `1px solid ${colors.accent.green}30`,
                }}
              />
              {summary.inProgress > 0 ? (
                <Chip
                  size="small"
                  label={t("selfAssessment.progressOverview.inProgressCount", {
                    count: summary.inProgress,
                  })}
                  sx={{
                    fontWeight: 700,
                    bgcolor: `${colors.semantic.warning}12`,
                    color: colors.semantic.warning,
                    border: `1px solid ${colors.semantic.warning}30`,
                  }}
                />
              ) : null}
            </Box>
          </Box>
        </Box>
      </Box>

      {showBackButton && onBack ? (
        <Button
          size="small"
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={onBack}
          sx={{
            mb: 2,
            textTransform: "none",
            fontWeight: 700,
            borderColor: `${at.primary}40`,
            color: at.primary,
            "&:hover": {
              borderColor: at.primary,
              bgcolor: `${at.primary}08`,
            },
          }}
        >
          {t("selfAssessment.progressOverview.backToAssessments")}
        </Button>
      ) : null}

      <Box
        className="sa-progress-overview__list"
        sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
      >
        {items.map((item, index) => (
          <ProgressItemCard
            key={`${item.assessmentId || item.domainId || index}-${item.name}`}
            item={item}
            index={index}
            accentColor={resolveAccentColor(item)}
            getProgressColor={getProgressColor}
            statusLabels={statusLabels}
            onClick={
              onItemClick
                ? () => onItemClick(item)
                : undefined
            }
          />
        ))}
      </Box>

      {chartDrilldownAssessmentId ? (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 2,
            color: colors.text.tertiary,
            fontWeight: 500,
          }}
        >
          {t("selfAssessment.progressOverview.tapDomainHint")}
        </Typography>
      ) : items[0]?.assessmentId != null ? (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 2,
            color: colors.text.tertiary,
            fontWeight: 500,
          }}
        >
          {t("selfAssessment.progressOverview.tapAssessmentHint")}
        </Typography>
      ) : null}
    </Box>
  );
}
