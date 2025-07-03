import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Box, Typography, Button, Paper } from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";
import App from "./App.jsx";

// Root component that handles proxy status
function Root() {
  const [isProxyUnavailable, setIsProxyUnavailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkProxyHealth = async () => {
      try {
        console.log("Checking proxy server health...");
        const response = await fetch("/api/healthcheck", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Proxy health check successful:", data);
          setIsProxyUnavailable(false);
        } else {
          console.log(
            "Proxy health check failed with status:",
            response.status
          );
          setIsProxyUnavailable(true);
        }
      } catch (error) {
        console.log("Proxy health check failed:", error.message);
        setIsProxyUnavailable(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkProxyHealth();
  }, []);

  if (isLoading) {
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
          <Typography variant="h6" gutterBottom>
            Checking Proxy Server...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we verify the connection.
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (isProxyUnavailable) {
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
            The proxy server is not running. Please start the proxy server to
            use this application.
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

  return <App />;
}

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Root />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
