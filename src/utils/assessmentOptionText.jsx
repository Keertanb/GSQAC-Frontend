import React from "react";
import { Box, Typography } from "@mui/material";

const BULLET_SEPARATOR_PATTERN = /\s*[•·]\s*/;

function cleanOptionSegment(segment) {
  return segment.trim().replace(/^[•·]+\s*/, "").trim();
}

export function splitOptionTextSegments(text) {
  if (!text || typeof text !== "string") return [];

  const normalized = text.trim();
  if (!normalized) return [];

  if (!BULLET_SEPARATOR_PATTERN.test(normalized)) {
    return [normalized];
  }

  return normalized
    .split(BULLET_SEPARATOR_PATTERN)
    .map(cleanOptionSegment)
    .filter(Boolean);
}

export function AssessmentOptionText({ text, sx = {} }) {
  const segments = splitOptionTextSegments(text);

  if (segments.length <= 1) {
    return (
      <Typography
        variant="body2"
        className="sa-mcq-option-text"
        sx={{ lineHeight: 1.5, width: "100%", ...sx }}
      >
        {text}
      </Typography>
    );
  }

  return (
    <Box
      component="ul"
      className="sa-mcq-option-bullets"
      sx={{
        m: 0,
        pl: 2.25,
        width: "100%",
        listStyleType: "disc",
        ...sx,
      }}
    >
      {segments.map((segment, index) => (
        <Typography
          key={`${index}-${segment.slice(0, 24)}`}
          component="li"
          variant="body2"
          sx={{
            lineHeight: 1.5,
            mb: index < segments.length - 1 ? 0.75 : 0,
            "&::marker": { color: "inherit" },
          }}
        >
          {segment}
        </Typography>
      ))}
    </Box>
  );
}
