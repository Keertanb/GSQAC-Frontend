import React from "react";
import { Alert, Box, Button, Typography } from "@mui/material";
import { colors } from "../../constants/colors";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(this.props.logLabel || "ErrorBoundary", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback !== undefined) {
      return this.props.fallback;
    }

    if (this.props.compact) {
      return (
        <Alert
          severity="warning"
          sx={{ mt: 1.5 }}
          action={
            <Button color="inherit" size="small" onClick={this.handleRetry}>
              Retry
            </Button>
          }
        >
          {this.props.message || "This section could not be loaded. You can continue."}
        </Alert>
      );
    }

    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 3,
          py: 8,
        }}
      >
        <Box sx={{ maxWidth: 460, textAlign: "center" }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, color: colors.text.primary, mb: 1 }}
          >
            {this.props.title || "Something went wrong"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            {this.props.message ||
              "This page hit an unexpected error. Reload to continue."}
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              bgcolor: colors.primary.blue,
            }}
          >
            Reload page
          </Button>
        </Box>
      </Box>
    );
  }
}

export default ErrorBoundary;
