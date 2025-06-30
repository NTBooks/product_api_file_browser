import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  TextField,
} from "@mui/material";
import {
  ArrowBack,
  Delete,
  CheckCircle,
  Cancel,
  Storage,
  CalendarToday,
  Link,
  Download,
  Code,
} from "@mui/icons-material";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { getFileInfo, deleteFile } from "../services/api";

const FileDetailPage = () => {
  const { hash } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [fileInfo, setFileInfo] = useState(location.state?.fileData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [jsonContent, setJsonContent] = useState(null);
  const [jsonLoading, setJsonLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchFileInfo = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getFileInfo(hash);
      console.log("File info response:", response);
      if (response.success) {
        console.log("File info data:", response.data);
        // Merge API data with existing state data, preserving only essential fields from state
        const existingData = location.state?.fileData || {};
        const mergedData = {
          ...response.data, // API data takes precedence
          // Only preserve these fields from navigation state if API doesn't provide them
          name: response.data.name || existingData.name,
          size: response.data.size || existingData.size,
          network: response.data.network || existingData.network,
          gatewayurl: response.data.gatewayurl || existingData.gatewayurl,
          // Determine stamping status: if foreign_tx_id exists, file is stamped
          is_stamped: response.data.foreign_tx_id
            ? true
            : response.data.is_stamped !== undefined
            ? response.data.is_stamped
            : existingData.is_stamped,
        };
        console.log("File detail merged data:", mergedData); // Debug log
        console.log("API data foreign_tx_id:", response.data.foreign_tx_id); // Debug log
        console.log("Final is_stamped value:", mergedData.is_stamped); // Debug log
        setFileInfo(mergedData);
      } else {
        setError(response.message || "Failed to fetch file info");
      }
    } catch (err) {
      console.error("Error fetching file info:", err);
      setError(err.message || "Failed to fetch file info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Always fetch detailed file info from API to get contract, foreign_tx_id, etc.
    fetchFileInfo();
  }, [hash]);

  useEffect(() => {
    if (fileInfo && isJsonFile(fileInfo.name)) {
      fetchJsonContent();
    }
  }, [fileInfo]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const isImageFile = (fileName) => {
    if (!fileName) return false;
    const extension = fileName.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png"].includes(extension);
  };

  const isJsonFile = (fileName) => {
    if (!fileName) return false;
    const extension = fileName.split(".").pop()?.toLowerCase();
    return extension === "json";
  };

  const isPdfFile = (fileName) => {
    if (!fileName) return false;
    const extension = fileName.split(".").pop()?.toLowerCase();
    return extension === "pdf";
  };

  const getResizedImageUrl = (gatewayUrl, width = 800) => {
    if (!gatewayUrl) {
      // Fallback to ipfs.io if no gateway URL is provided
      return `https://ipfs.io/ipfs/${hash}`;
    }
    // Only add resize parameter if it's not the generic ipfs.io gateway
    if (gatewayUrl.includes("ipfs.io")) {
      return gatewayUrl;
    }
    // Add resize parameter for custom gateways
    const separator = gatewayUrl.includes("?") ? "&" : "?";
    return `${gatewayUrl}${separator}img-width=${width}`;
  };

  const fetchJsonContent = async () => {
    if (!isJsonFile(fileInfo.name)) return;

    setJsonLoading(true);
    try {
      const url = getResizedImageUrl(fileInfo.gatewayurl);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch JSON content");
      }
      const text = await response.text();
      const parsed = JSON.parse(text);
      setJsonContent(parsed);
    } catch (err) {
      console.error("Error fetching JSON:", err);
      setJsonContent(null);
    } finally {
      setJsonLoading(false);
    }
  };

  const getNetworkColor = (network) => {
    switch (network) {
      case "public":
        return "success";
      case "private":
        return "warning";
      default:
        return "default";
    }
  };

  const handleDelete = async () => {
    if (!fileInfo) return;

    setDeleting(true);
    try {
      const response = await deleteFile(hash, fileInfo.group_id);
      if (response.success) {
        setSnackbar({
          open: true,
          message: "File deleted successfully!",
          severity: "success",
        });
        setDeleteDialogOpen(false);
        // Navigate back to files page
        navigate(`/files/${fileInfo.group_id}`);
      } else {
        setSnackbar({
          open: true,
          message: response.message || "Delete failed",
          severity: "error",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || "Delete failed",
        severity: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSnackbar({
      open: true,
      message: "Copied to clipboard!",
      severity: "success",
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}>
          Back
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!fileInfo) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}>
          Back
        </Button>
        <Alert severity="info">File not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}>
        Back
      </Button>

      {/* File Name Header */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        {fileInfo?.name || `File: ${hash}`}
      </Typography>

      <Grid container spacing={3}>
        {/* File Preview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                File Preview
              </Typography>
              {isImageFile(fileInfo.name) ? (
                <CardMedia
                  component="img"
                  height="400"
                  image={getResizedImageUrl(fileInfo.gatewayurl)}
                  alt={fileInfo.name}
                  sx={{ objectFit: "contain", borderRadius: 1 }}
                />
              ) : isJsonFile(fileInfo.name) ? (
                <Box>
                  {jsonLoading ? (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      height="400"
                      bgcolor="grey.100"
                      borderRadius={1}>
                      <CircularProgress />
                    </Box>
                  ) : jsonContent ? (
                    <Box
                      sx={{
                        maxHeight: "400px",
                        overflow: "auto",
                        border: "1px solid #e0e0e0",
                        borderRadius: 1,
                        bgcolor: "#f8f9fa",
                      }}>
                      <SyntaxHighlighter
                        language="json"
                        style={tomorrow}
                        customStyle={{
                          margin: 0,
                          fontSize: "12px",
                          backgroundColor: "transparent",
                        }}
                        showLineNumbers={true}
                        wrapLines={true}>
                        {JSON.stringify(jsonContent, null, 2)}
                      </SyntaxHighlighter>
                    </Box>
                  ) : (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      height="400"
                      bgcolor="grey.100"
                      borderRadius={1}>
                      <Typography variant="h6" color="text.secondary">
                        Failed to load JSON content
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : isPdfFile(fileInfo.name) ? (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  height="400"
                  bgcolor="grey.100"
                  borderRadius={1}>
                  <iframe
                    src={getResizedImageUrl(fileInfo.gatewayurl)}
                    width="100%"
                    height="100%"
                    style={{ border: "none" }}
                  />
                </Box>
              ) : (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  height="400"
                  bgcolor="grey.100"
                  borderRadius={1}>
                  <Typography variant="h6" color="text.secondary">
                    Preview not available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* File Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                File Information
              </Typography>

              <Box mb={2}>
                <Typography variant="h6" color="primary">
                  {fileInfo.name || "Unknown File"}
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Storage sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography variant="body1">
                      <strong>Hash:</strong> {hash}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => copyToClipboard(hash)}
                      sx={{ ml: 1 }}>
                      Copy
                    </Button>
                  </Box>
                </Grid>

                {fileInfo.contract && (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Link sx={{ mr: 1, color: "text.secondary" }} />
                      <Typography variant="body1">
                        <strong>Contract:</strong> {fileInfo.contract}
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => copyToClipboard(fileInfo.contract)}
                        sx={{ ml: 1 }}>
                        Copy
                      </Button>
                    </Box>
                  </Grid>
                )}

                {fileInfo.created && (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <CalendarToday sx={{ mr: 1, color: "text.secondary" }} />
                      <Typography variant="body1">
                        <strong>Created:</strong> {formatDate(fileInfo.created)}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {fileInfo.foreign_tx_id && (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Link sx={{ mr: 1, color: "text.secondary" }} />
                      <Typography variant="body1">
                        <strong>Transaction ID:</strong>{" "}
                        {fileInfo.foreign_tx_id}
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => copyToClipboard(fileInfo.foreign_tx_id)}
                        sx={{ ml: 1 }}>
                        Copy
                      </Button>
                    </Box>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      label={fileInfo.network || "Unknown"}
                      color={getNetworkColor(fileInfo.network)}
                    />
                    <Chip
                      label={fileInfo.is_stamped ? "Stamped" : "Not Stamped"}
                      color={fileInfo.is_stamped ? "success" : "warning"}
                      icon={fileInfo.is_stamped ? <CheckCircle /> : <Cancel />}
                    />
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Action Buttons */}
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() =>
                    window.open(`https://ipfs.io/ipfs/${hash}`, "_blank")
                  }>
                  Download
                </Button>

                {!fileInfo.foreign_tx_id && (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => setDeleteDialogOpen(true)}>
                    Delete File
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Verification Results */}
        {fileInfo.allResults && fileInfo.allResults.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Verification Results
                </Typography>
                {fileInfo.allResults.map((result, index) => (
                  <Paper key={index} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Result {index + 1}
                    </Typography>
                    <Grid container spacing={2}>
                      {result.contract && (
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2">
                            <strong>Contract:</strong> {result.contract}
                          </Typography>
                        </Grid>
                      )}
                      {result.created && (
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2">
                            <strong>Created:</strong>{" "}
                            {formatDate(result.created)}
                          </Typography>
                        </Grid>
                      )}
                      {result.foreign_tx_id && (
                        <Grid item xs={12}>
                          <Typography variant="body2">
                            <strong>Transaction ID:</strong>{" "}
                            {result.foreign_tx_id}
                          </Typography>
                        </Grid>
                      )}
                      {result.is_bulk && (
                        <Grid item xs={12}>
                          <Typography variant="body2">
                            <strong>Bulk Hash:</strong> {result.is_bulk}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete File</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this file? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FileDetailPage;
