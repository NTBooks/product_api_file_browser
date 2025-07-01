import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Chip,
} from "@mui/material";
import {
  Storage,
  Folder,
  CheckCircle,
  Warning,
  Settings,
  Security,
  VpnKey,
} from "@mui/icons-material";
import {
  getStats,
  saveCredentials,
  hasCredentials,
  getCredentialsInfo,
  clearCredentials,
} from "../services/api";

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState({
    apikey: "",
    secretKey: "",
    network: "public",
  });
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentialsInfo, setCredentialsInfo] = useState(null);
  const [checkingCredentials, setCheckingCredentials] = useState(true);

  const checkCredentials = async () => {
    setCheckingCredentials(true);
    try {
      const hasCreds = await hasCredentials();
      if (hasCreds) {
        const info = await getCredentialsInfo();
        setCredentialsInfo(info.data);
        setShowCredentials(false);
        fetchStats();
      } else {
        setShowCredentials(true);
      }
    } catch (err) {
      setError("Failed to check credentials status");
      setShowCredentials(true);
    } finally {
      setCheckingCredentials(false);
    }
  };

  const handleCredentialsChange = (field, value) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveCredentials = async () => {
    if (!credentials.apikey || !credentials.secretKey) {
      setError("API Key and Secret Key are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await saveCredentials(
        credentials.apikey,
        credentials.secretKey,
        credentials.network
      );
      if (response.success) {
        setShowCredentials(false);
        setError("");
        await checkCredentials();
      } else {
        setError(response.message || "Failed to save credentials");
      }
    } catch (err) {
      if (err.response?.data?.code === "AUTH_ERROR") {
        setError("Authentication failed. Please check your credentials.");
        setShowCredentials(true);
      } else {
        setError(err.message || "Failed to save credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearCredentials = async () => {
    try {
      await clearCredentials();
      setCredentialsInfo(null);
      setStats(null);
      setShowCredentials(true);
      setError("");
    } catch (err) {
      setError("Failed to clear credentials");
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getStats();
      if (response.success) {
        setStats(response.data);
      } else {
        setError(response.message || "Failed to fetch stats");
      }
    } catch (err) {
      if (err.response?.data?.code === "AUTH_ERROR") {
        setError("Authentication failed. Please check your credentials.");
        setShowCredentials(true);
      } else {
        setError(err.message || "Failed to fetch stats");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkCredentials();
  }, []);

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const StatCard = ({ title, value, icon, color = "primary" }) => (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          {icon}
          <Typography variant="h6" component="div" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" color={color}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  if (checkingCredentials) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {showCredentials && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <Settings sx={{ mr: 1 }} />
            <Typography variant="h6">API Configuration</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="API Key"
                value={credentials.apikey}
                onChange={(e) =>
                  handleCredentialsChange("apikey", e.target.value)
                }
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Secret Key"
                type="password"
                value={credentials.secretKey}
                onChange={(e) =>
                  handleCredentialsChange("secretKey", e.target.value)
                }
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Network"
                select
                value={credentials.network}
                onChange={(e) =>
                  handleCredentialsChange("network", e.target.value)
                }
                margin="normal"
                SelectProps={{ native: true }}>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="all">All</option>
              </TextField>
            </Grid>
          </Grid>
          <Button
            variant="contained"
            onClick={handleSaveCredentials}
            disabled={loading}
            sx={{ mt: 2 }}>
            {loading ? "Saving..." : "Save Configuration"}
          </Button>
        </Paper>
      )}

      {!showCredentials && credentialsInfo && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center">
            <Box>
              <Typography variant="h6" gutterBottom>
                Current Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary">
                API Key: {credentialsInfo.apikey}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Network: {credentialsInfo.network}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                {credentialsInfo.source === "environment" ? (
                  <Chip
                    icon={<VpnKey />}
                    label="Environment Variables"
                    color="success"
                    size="small"
                  />
                ) : (
                  <Chip
                    icon={<Security />}
                    label="Session Storage"
                    color="primary"
                    size="small"
                  />
                )}
              </Box>
            </Box>
            <Box display="flex" gap={2}>
              {credentialsInfo.source === "session" && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<Settings />}
                    onClick={() => setShowCredentials(true)}>
                    Edit Configuration
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClearCredentials}>
                    Clear Configuration
                  </Button>
                </>
              )}
              {credentialsInfo.source === "environment" && (
                <Typography variant="body2" color="text.secondary">
                  Credentials are hardcoded in environment variables
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : stats ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <StatCard
              title="Total Files"
              value={stats.totalFiles}
              icon={<Storage color="primary" />}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard
              title="Total Size"
              value={formatBytes(stats.totalSize)}
              icon={<Folder color="info" />}
              color="info"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard
              title="Credits"
              value={stats.credits}
              icon={<Warning color="warning" />}
              color="warning"
            />
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Status
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1">
                      <strong>Group Enabled:</strong>{" "}
                      {stats.groupEnabled ? "Yes" : "No"}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Group Exists:</strong>{" "}
                      {stats.groupExists || "N/A"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1">
                      <strong>Group Public:</strong>{" "}
                      {stats.groupPublic || "N/A"}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Network:</strong>{" "}
                      {credentialsInfo?.network || "N/A"}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/groups")}
              sx={{ mr: 2 }}>
              View Groups
            </Button>
            <Button variant="outlined" size="large" onClick={fetchStats}>
              Refresh Stats
            </Button>
          </Grid>
        </Grid>
      ) : (
        !showCredentials && (
          <Alert severity="info">
            Click "Refresh Stats" to load your account statistics.
          </Alert>
        )
      )}
    </Box>
  );
};

export default DashboardPage;
