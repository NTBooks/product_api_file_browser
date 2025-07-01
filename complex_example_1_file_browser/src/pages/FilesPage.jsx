import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Snackbar,
} from "@mui/material";
import {
  InsertDriveFile,
  Image,
  PictureAsPdf,
  Description,
  Upload,
  Refresh,
  CheckCircle,
  Cancel,
  Verified,
  ArrowBack,
  Code,
  Warning,
} from "@mui/icons-material";
import {
  useFiles,
  useGroupStats,
  useUploadFile,
  useStampCollection,
} from "../hooks/useApi";
import LazyImage from "../components/LazyImage";

const FilesPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Use React Query hooks
  const {
    data: filesData,
    isLoading: filesLoading,
    error: filesError,
    refetch: refetchFiles,
  } = useFiles(groupId);

  const {
    data: groupStatsData,
    isLoading: statsLoading,
    error: statsError,
  } = useGroupStats(groupId);

  const uploadMutation = useUploadFile();
  const stampMutation = useStampCollection();

  // Process files to determine stamping status
  const files = (filesData?.files || []).map((file) => ({
    ...file,
    // Use bulk_check.is_stamped for the freshest stamping status, fallback to file.is_stamped
    is_stamped:
      file.bulk_check?.is_stamped !== undefined
        ? file.bulk_check.is_stamped
        : file.is_stamped || false,
  }));

  // Extract group stats from the response and enhance with files data
  const baseGroupStats = groupStatsData?.data;

  // Calculate counts from the actual files list being displayed
  const totalFilesCount = files.length;
  const stampedFilesCount = files.filter((file) => file.is_stamped).length;

  // Enhanced group stats with calculated counts from files list
  // Show "Counting..." if either stats or files are still loading
  const groupStats =
    baseGroupStats && !statsLoading && !filesLoading
      ? {
          ...baseGroupStats,
          totalFiles: totalFilesCount,
          stampedFiles: stampedFilesCount,
          allStamped:
            totalFilesCount > 0 && totalFilesCount === stampedFilesCount,
        }
      : null;

  // Debug logging
  console.log("Base group stats data:", groupStatsData);
  console.log("Enhanced group stats:", groupStats);
  console.log("Stamped files count:", stampedFilesCount);

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop()?.toLowerCase();

    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension)) {
      return <Image color="primary" />;
    } else if (["pdf"].includes(extension)) {
      return <PictureAsPdf color="error" />;
    } else if (["json"].includes(extension)) {
      return <Code color="warning" />;
    } else {
      return <InsertDriveFile color="action" />;
    }
  };

  const isImageFile = (fileName) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png"].includes(extension);
  };

  const getResizedImageUrl = (gatewayUrl, width = 300) => {
    if (!gatewayUrl) return null;
    // Only add resize parameter if it's not the generic ipfs.io gateway
    if (gatewayUrl.includes("ipfs.io")) {
      return gatewayUrl;
    }
    // Add resize parameter for custom gateways
    const separator = gatewayUrl.includes("?") ? "&" : "?";
    return `${gatewayUrl}${separator}img-width=${width}`;
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

  const formatBulkId = (postmarkHash) => {
    if (!postmarkHash) return null;
    // Show first 8 characters followed by ...
    return `${postmarkHash.substring(0, 8)}...`;
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    uploadMutation.mutate(
      { file: selectedFile, groupId },
      {
        onSuccess: () => {
          setSnackbar({
            open: true,
            message: "File uploaded successfully!",
            severity: "success",
          });
          setUploadDialogOpen(false);
          setSelectedFile(null);
        },
        onError: (error) => {
          setSnackbar({
            open: true,
            message: error.message || "Upload failed",
            severity: "error",
          });
        },
      }
    );
  };

  const handleStampCollection = () => {
    stampMutation.mutate(groupId, {
      onSuccess: () => {
        setSnackbar({
          open: true,
          message: "Collection stamped successfully!",
          severity: "success",
        });
      },
      onError: (error) => {
        setSnackbar({
          open: true,
          message: error.message || "Stamping failed",
          severity: "error",
        });
      },
    });
  };

  const FileCard = ({ file }) => {
    // Use is_stamped directly from the API
    const isStamped = file.is_stamped || false;

    return (
      <Card
        sx={{
          height: "100%",
          cursor: "pointer",
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: 4,
          },
        }}
        onClick={() =>
          navigate(`/file/${file.hash}`, {
            state: { fileData: file, groupId: groupId },
          })
        }>
        {isImageFile(file.name) && (
          <LazyImage
            src={
              getResizedImageUrl(file.gatewayurl) ||
              `https://ipfs.io/ipfs/${file.hash}`
            }
            alt={file.name}
            width="100%"
            height="200px"
            compact={true}
            sx={{
              objectFit: "contain",
              backgroundColor: "#f5f5f5",
              borderBottom: "1px solid #e0e0e0",
              minHeight: "200px", // Ensure consistent height
            }}
          />
        )}
        <CardContent>
          <Box display="flex" alignItems="center" mb={1}>
            {getFileIcon(file.name)}
            <Typography variant="h6" component="div" sx={{ ml: 1 }} noWrap>
              {file.name}
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" mb={1}>
            Size: {formatBytes(file.size)}
          </Typography>

          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip
              label={file.network}
              color={getNetworkColor(file.network)}
              size="small"
            />
            <Chip
              label={isStamped ? "Stamped" : "Not Stamped"}
              color={isStamped ? "success" : "warning"}
              icon={isStamped ? <CheckCircle /> : <Cancel />}
              size="small"
            />
            {file.bulk_check?.postmark_hash && (
              <Chip
                label={`Hash: ${formatBulkId(file.bulk_check.postmark_hash)}`}
                color="info"
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate("/groups")}>
            Back to Groups
          </Button>
          <Typography variant="h4">Files in Group: {groupId}</Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={refetchFiles}
            disabled={filesLoading}>
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Upload />}
            onClick={() => setUploadDialogOpen(true)}>
            Upload File
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Verified />}
            onClick={handleStampCollection}>
            Stamp Collection
          </Button>
        </Box>
      </Box>

      {/* Group Statistics */}
      <Card
        sx={{
          mb: 3,
          backgroundColor: groupStats?.allStamped ? "#f8fff8" : "#fff",
        }}>
        <CardContent>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={3}>
              {groupStats ? (
                <>
                  <Box display="flex" alignItems="center">
                    <InsertDriveFile
                      sx={{ fontSize: 20, mr: 1, color: "text.secondary" }}
                    />
                    <Typography variant="h6" color="text.secondary">
                      {groupStats.totalFiles} files
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    {groupStats.allStamped ? (
                      <CheckCircle
                        sx={{ fontSize: 20, mr: 1, color: "success.main" }}
                      />
                    ) : (
                      <Warning
                        sx={{ fontSize: 20, mr: 1, color: "warning.main" }}
                      />
                    )}
                    <Typography
                      variant="h6"
                      color={
                        groupStats.allStamped ? "success.main" : "warning.main"
                      }
                      fontWeight="medium">
                      {groupStats.stampedFiles} stamped
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Total size: {formatBytes(groupStats.totalSize)}
                    </Typography>
                  </Box>
                </>
              ) : (
                <Box display="flex" alignItems="center">
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    Loading...
                  </Typography>
                </Box>
              )}
            </Box>
            {groupStats?.allStamped && (
              <Chip
                label="All Files Stamped"
                color="success"
                icon={<CheckCircle />}
                size="medium"
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {filesError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {filesError.message}
        </Alert>
      )}

      {filesLoading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : files.length > 0 ? (
        <Grid container spacing={3}>
          {files.map((file) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={file.hash}>
              <FileCard file={file} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Alert severity="info">
          No files found in this group. Upload a file to get started.
        </Alert>
      )}

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth>
        <DialogTitle>Upload File</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              accept="*/*"
              style={{ display: "none" }}
              id="file-upload"
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<Upload />}>
                Select File
              </Button>
            </label>
            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 2 }}>
                Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile}>
            Upload
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

export default FilesPage;
