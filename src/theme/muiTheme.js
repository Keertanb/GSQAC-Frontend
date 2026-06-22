import { createTheme } from "@mui/material/styles";
import { colors } from "../constants/colors";

export const muiTheme = createTheme({
  palette: {
    primary: {
      main: colors.primary.blue,
      dark: colors.primary.dark,
      light: colors.primary.light,
    },
    secondary: {
      main: colors.accent.orange,
      dark: colors.accent.orangeDark,
      light: colors.accent.orangeLight,
    },
    success: {
      main: colors.semantic.success,
    },
    error: {
      main: colors.semantic.error,
    },
    warning: {
      main: colors.semantic.warning,
    },
    info: {
      main: colors.semantic.info,
    },
    background: {
      default: colors.background.secondary,
      paper: colors.background.primary,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          "@media (max-width: 960px)": {
            paddingTop: "env(safe-area-inset-top, 0px)",
            paddingLeft: "env(safe-area-inset-left, 0px)",
            paddingRight: "env(safe-area-inset-right, 0px)",
          },
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          "@media (max-width: 960px)": {
            minHeight: "72px",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: "10px 24px",
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
          },
        },
      },
    },
  },
});

export default muiTheme;

