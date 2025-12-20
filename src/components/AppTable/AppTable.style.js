import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

export const AppTableWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== "hideBorders",
})(({ theme, hideBorders }) => ({
  position: "relative",
  backgroundColor: "#fff",
  borderRadius: theme.spacing(1.5),
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  overflow: "hidden",

  ".table-toolbar": {
    minHeight: "64px",
    padding: theme.spacing(2, 3),
    backgroundColor: "#f9fafb",
    borderBottom: hideBorders ? "none" : `1px solid ${theme.palette.divider}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing(2),
    flexWrap: "wrap",

    "&.end": {
      justifyContent: "flex-end",
    },

    ".select": {
      minWidth: 150,
    },
  },

  ".header-content": {
    padding: theme.spacing(2, 3),
    backgroundColor: "#f9fafb",
    borderBottom: hideBorders ? "none" : `1px solid ${theme.palette.divider}`,
  },

  ".table-container": {
    maxHeight: "calc(100vh - 300px)",
    overflow: "auto",
  },

  ".table-header": {
    backgroundColor: "#f9fafb",
    fontWeight: 700,
    color: theme.palette.text.primary,
    borderBottom: hideBorders ? "none" : `1px solid ${theme.palette.divider}`,
    whiteSpace: "nowrap",
    padding: theme.spacing(1.5, 2),
  },

  ".table-body": {
    ".table-cell": {
      borderBottom: hideBorders ? "none" : `1px solid ${theme.palette.divider}`,
      padding: theme.spacing(1.5, 2),
    },

    "& .MuiTableRow-root": {
      transition: "background-color 0.2s ease",
      "&:hover": {
        backgroundColor: "rgba(0, 0, 0, 0.02)",
      },
    },
  },

  ".table-footer": {
    backgroundColor: "#f9fafb",
    ".table-cell": {
      borderTop: hideBorders ? "none" : `1px solid ${theme.palette.divider}`,
      padding: theme.spacing(1.5, 2),
      fontWeight: 600,
    },
  },

  ".table-pagination": {
    borderTop: hideBorders ? "none" : `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1, 3),
  },
}));

export default AppTableWrapper;

