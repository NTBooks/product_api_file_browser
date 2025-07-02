import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Snackbar from "@mui/material/Snackbar";
import TextField from "@mui/material/TextField";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import StorageIcon from "@mui/icons-material/Storage";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LinkIcon from "@mui/icons-material/Link";
import DownloadIcon from "@mui/icons-material/Download";
import CodeIcon from "@mui/icons-material/Code";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  useFileInfo,
  useDeleteFile,
  useJsonContent,
  useTextContent,
} from "../hooks/useApi";
import LazyImage from "../components/LazyImage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFileInfo, deleteFile } from "../services/api";
import { useEvents } from "../contexts/EventContext";
import { usePendingUpload } from "../hooks/usePendingUpload";

import {
  flexSpaceBetween,
  flexCenterVertical,
  flexGap,
  flexGapWrap,
  flexCenter,
  iconWithMargin,
  iconSecondary,
  marginBottom,
  marginTop,
  loadingContainer,
  errorContainer,
  cardFullHeight,
  textWithMargin,
  textSecondary,
  buttonWithMargin,
  alertWithMargin,
  fullWidth,
  minHeight,
  dividerWithMargin,
  cardWithPadding,
  contentLoadingBox,
  contentErrorBox,
  contentBox,
} from "../utils/commonStyles";

const FileDetailPage = () => {
  const { hash } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Use React Query hook for file info
  const { data: apiFileInfo, isLoading, error } = useFileInfo(hash);

  // Check if this is a 400 error (file not stamped) vs a real error
  const isUnstampedFile = error?.response?.status === 400;
  const isRealError = error && !isUnstampedFile;

  // Merge API data with navigation state data
  const existingData = location.state?.fileData || {};
  const fileInfo = apiFileInfo?.success
    ? {
        ...apiFileInfo.data, // API data takes precedence
        // Only preserve these fields from navigation state if API doesn't provide them
        name: apiFileInfo.data.name || existingData.name,
        size: apiFileInfo.data.size || existingData.size,
        network: apiFileInfo.data.network || existingData.network,
        gatewayurl: apiFileInfo.data.gatewayurl || existingData.gatewayurl,
        // Use bulk_check.is_stamped for freshest status, fallback to file.is_stamped
        is_stamped:
          apiFileInfo.data.bulk_check?.is_stamped !== undefined
            ? apiFileInfo.data.bulk_check.is_stamped
            : apiFileInfo.data.is_stamped !== undefined
            ? apiFileInfo.data.is_stamped
            : existingData.is_stamped,
      }
    : isUnstampedFile
    ? {
        // For unstamped files, use navigation state data and mark as unstamped
        ...existingData,
        is_stamped: false,
      }
    : existingData;

  // Use React Query hook for JSON content
  const {
    data: jsonContent,
    isLoading: jsonLoading,
    error: jsonError,
  } = useJsonContent(fileInfo);

  // Use React Query hook for text content
  const {
    data: textContent,
    isLoading: textLoading,
    error: textError,
  } = useTextContent(fileInfo);

  // Use React Query mutation for delete
  const deleteMutation = useDeleteFile();

  // Check pending upload status
  const { isPendingUpload } = useEvents();
  const { isConfirmed, isConnected } = usePendingUpload(hash);
  const isPending = isPendingUpload(hash);

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

  const isTextFile = (fileName) => {
    if (!fileName) return false;
    const extension = fileName.split(".").pop()?.toLowerCase();
    return [
      "txt",
      "md",
      "log",
      "csv",
      "xml",
      "html",
      "css",
      "js",
      "ts",
      "py",
      "java",
      "cpp",
      "c",
      "h",
      "sql",
      "sh",
      "bat",
      "yml",
      "yaml",
      "toml",
      "ini",
      "cfg",
      "conf",
    ].includes(extension);
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

  const getOriginalUrl = (gatewayUrl) => {
    if (!gatewayUrl) {
      // Fallback to ipfs.io if no gateway URL is provided
      return `https://ipfs.io/ipfs/${hash}`;
    }
    // Return the original URL without any parameters
    return gatewayUrl;
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

  const handleDelete = () => {
    if (!fileInfo) return;

    console.log("FileInfo for delete:", fileInfo);
    console.log("Group ID from fileInfo:", fileInfo.group_id);
    console.log("All fileInfo keys:", Object.keys(fileInfo));

    // Try to get group ID from various possible field names
    const groupId =
      fileInfo.group_id ||
      fileInfo.groupId ||
      fileInfo.group ||
      location.state?.groupId;

    if (!groupId) {
      setSnackbar({
        open: true,
        message: "Cannot delete: Group ID not found",
        severity: "error",
      });
      return;
    }

    deleteMutation.mutate(
      { fileHash: hash, groupId: groupId },
      {
        onSuccess: () => {
          setSnackbar({
            open: true,
            message: "File deleted successfully!",
            severity: "success",
          });
          setDeleteDialogOpen(false);
          // Navigate back to files page
          navigate(`/files/${groupId}`);
        },
        onError: (error) => {
          setSnackbar({
            open: true,
            message: error.message || "Delete failed",
            severity: "error",
          });
        },
      }
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSnackbar({
      open: true,
      message: "Copied to clipboard!",
      severity: "success",
    });
  };

  if (isLoading) {
    return (
      <Box sx={loadingContainer}>
        <CircularProgress />
      </Box>
    );
  }

  if (isRealError) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={marginBottom(2)}>
          Back
        </Button>
        <Alert severity="error">{error.message}</Alert>
      </Box>
    );
  }

  if (!fileInfo) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={marginBottom(2)}>
          Back
        </Button>
        <Alert severity="info">File not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={marginBottom(3)}>
        Back
      </Button>

      {/* File Name Header */}
      <Typography variant="h4" gutterBottom sx={marginBottom(3)}>
        {fileInfo?.name || `File: ${hash}`}
      </Typography>

      {/* Pending Upload Warning */}
      {isPending && !isConfirmed && (
        <Alert
          severity="warning"
          sx={marginBottom(3)}
          action={
            <Button color="inherit" size="small">
              {isConnected
                ? "Waiting for IPFS confirmation..."
                : "Connection lost"}
            </Button>
          }>
          This file is still being uploaded to IPFS. Downloads may not work
          until the upload is confirmed.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* File Preview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                File Preview
              </Typography>
              {isImageFile(fileInfo.name) ? (
                <LazyImage
                  src={getResizedImageUrl(fileInfo.gatewayurl)}
                  alt={fileInfo.name}
                  width="100%"
                  height="400"
                  sx={{ objectFit: "contain", borderRadius: 1 }}
                />
              ) : isJsonFile(fileInfo.name) ? (
                <Box>
                  {jsonLoading ? (
                    <Box sx={contentLoadingBox(400)}>
                      <CircularProgress />
                    </Box>
                  ) : jsonError ? (
                    <Box sx={contentErrorBox(400)}>
                      <Typography variant="h6" color="error">
                        Failed to load JSON content: {jsonError.message}
                      </Typography>
                    </Box>
                  ) : jsonContent ? (
                    <Box sx={contentBox}>
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
                    <Box sx={contentErrorBox(400)}>
                      <Typography variant="h6" sx={textSecondary}>
                        No JSON content available
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : isTextFile(fileInfo.name) ? (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Text Content
                  </Typography>
                  {textLoading ? (
                    <Box sx={contentLoadingBox(400)}>
                      <CircularProgress />
                    </Box>
                  ) : textError ? (
                    <Box sx={contentErrorBox(400)}>
                      <Typography variant="h6" color="error">
                        Failed to load text content: {textError.message}
                      </Typography>
                    </Box>
                  ) : textContent ? (
                    <Box sx={{ ...contentBox, p: 2 }}>
                      <Typography
                        component="pre"
                        sx={{
                          fontFamily: "monospace",
                          fontSize: "12px",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          margin: 0,
                        }}>
                        {textContent}
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={contentErrorBox(400)}>
                      <Typography variant="h6" sx={textSecondary}>
                        No text content available
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : isPdfFile(fileInfo.name) ? (
                <Box
                  sx={{
                    ...contentLoadingBox(600),
                    minHeight: "600px",
                  }}>
                  <iframe
                    src={`${
                      import.meta.env.VITE_DEMO_SERVER ||
                      "http://localhost:3041"
                    }/ipfs?url=${encodeURIComponent(fileInfo.gatewayurl)}`}
                    width="100%"
                    height="100%"
                    style={{ border: "none", borderRadius: "4px" }}
                  />
                </Box>
              ) : (
                <Box sx={contentErrorBox(400)}>
                  <Typography variant="h6" sx={textSecondary}>
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

              <Box sx={marginBottom(2)}>
                <Typography variant="h6" color="primary">
                  {fileInfo.name || "Unknown File"}
                </Typography>
              </Box>

              {/* Notice for unstamped files */}
              {isUnstampedFile && (
                <Alert severity="info" sx={marginBottom(2)}>
                  This file is not stamped. Detailed verification information is
                  only available for stamped files.
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ ...flexCenterVertical, ...marginBottom(1) }}>
                    <StorageIcon sx={iconSecondary(16, 1)} />
                    <Typography variant="body1">
                      <strong>Hash:</strong> {hash}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => copyToClipboard(hash)}
                      sx={textWithMargin(1)}>
                      Copy
                    </Button>
                  </Box>
                </Grid>

                {fileInfo.contract && (
                  <Grid item xs={12}>
                    <Box sx={{ ...flexCenterVertical, ...marginBottom(1) }}>
                      <LinkIcon sx={iconSecondary(16, 1)} />
                      <Typography variant="body1">
                        <strong>Contract:</strong> {fileInfo.contract}
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => copyToClipboard(fileInfo.contract)}
                        sx={textWithMargin(1)}>
                        Copy
                      </Button>
                    </Box>
                  </Grid>
                )}

                {fileInfo.created && (
                  <Grid item xs={12}>
                    <Box sx={{ ...flexCenterVertical, ...marginBottom(1) }}>
                      <CalendarTodayIcon sx={iconSecondary(16, 1)} />
                      <Typography variant="body1">
                        <strong>Created:</strong> {formatDate(fileInfo.created)}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Box sx={flexGapWrap(1)}>
                    <Chip
                      label={fileInfo.network || "Unknown"}
                      color={getNetworkColor(fileInfo.network)}
                    />
                    <Chip
                      label={fileInfo.is_stamped ? "Stamped" : "Not Stamped"}
                      color={fileInfo.is_stamped ? "success" : "warning"}
                      icon={
                        fileInfo.is_stamped ? (
                          <CheckCircleIcon />
                        ) : (
                          <CancelIcon />
                        )
                      }
                    />
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={dividerWithMargin(3)} />

              {/* Action Buttons */}
              <Box sx={flexGapWrap(2)}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  disabled={isPending && !isConfirmed}
                  onClick={() =>
                    window.open(`https://ipfs.io/ipfs/${hash}`, "_blank")
                  }>
                  {isPending && !isConfirmed
                    ? "Download (Pending)"
                    : "Download"}
                </Button>

                {!fileInfo.foreign_tx_id && (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
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
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
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
