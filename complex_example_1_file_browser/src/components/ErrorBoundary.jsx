import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Check if this is an EventSource connection error
    if (
      error &&
      error.message &&
      error.message.includes("Receiving end does not exist")
    ) {
      return {
        hasError: true,
        error: {
          type: "proxy_unavailable",
          message: "Proxy server is not available",
        },
      };
    }

    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.log("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.state.error?.type === "proxy_unavailable") {
        return (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "100vh",
              p: 3,
            }}>
            <Paper
              elevation={3}
              sx={{
                p: 4,
                textAlign: "center",
                maxWidth: 500,
              }}>
              <ErrorIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
              <Typography variant="h5" component="h1" gutterBottom>
                Proxy Server Unavailable
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                The proxy server is not running. Please start the proxy server
                to use this application.
              </Typography>
              <Button
                variant="contained"
                onClick={() => window.location.reload()}
                sx={{ mt: 2 }}>
                Retry
              </Button>
            </Paper>
          </Box>
        );
      }

      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            p: 3,
          }}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: "center",
              maxWidth: 500,
            }}>
            <ErrorIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
            <Typography variant="h5" component="h1" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              An unexpected error occurred. Please try refreshing the page.
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
              sx={{ mt: 2 }}>
              Refresh Page
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
