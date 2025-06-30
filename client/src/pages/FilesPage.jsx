import { useState, useEffect } from "react";
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
  getFiles,
  uploadFile,
  stampCollection,
  getGroupStats,
} from "../services/api";

const FilesPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [stamping, setStamping] = useState(false);
  const [groupStats, setGroupStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchGroupStats = async () => {
    setLoadingStats(true);
    try {
      const response = await getGroupStats(groupId);
      if (response.success) {
        setGroupStats(response.data);
      }
    } catch (err) {
      console.error("Error fetching group stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchFiles = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getFiles(groupId);
      console.log("Files API response:", response); // Debug log
      if (response.success) {
        console.log("Files data:", response.files); // Debug log
        // Process files to determine stamping status based on foreign_tx_id
        const processedFiles = (response.files || []).map((file) => {
          const processed = {
            ...file,
            // If foreign_tx_id exists, file is stamped
            is_stamped: file.foreign_tx_id ? true : file.is_stamped || false,
          };
          console.log(
            `File ${file.name}: foreign_tx_id=${file.foreign_tx_id}, is_stamped=${processed.is_stamped}`
          ); // Debug log
          return processed;
        });
        setFiles(processedFiles);
      } else {
        setError(response.message || "Failed to fetch files");
      }
    } catch (err) {
      setError(err.message || "Failed to fetch files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchGroupStats();
  }, [groupId]);

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

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const response = await uploadFile(selectedFile, groupId);
      if (response.success) {
        setSnackbar({
          open: true,
          message: "File uploaded successfully!",
          severity: "success",
        });
        setUploadDialogOpen(false);
        setSelectedFile(null);
        fetchFiles();
      } else {
        setSnackbar({
          open: true,
          message: response.message || "Upload failed",
          severity: "error",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || "Upload failed",
        severity: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleStampCollection = async () => {
    setStamping(true);
    try {
      const response = await stampCollection(groupId);
      if (response.success) {
        setSnackbar({
          open: true,
          message: "Collection stamped successfully!",
          severity: "success",
        });
        fetchFiles();
      } else {
        setSnackbar({
          open: true,
          message: response.message || "Stamping failed",
          severity: "error",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || "Stamping failed",
        severity: "error",
      });
    } finally {
      setStamping(false);
    }
  };

  const FileCard = ({ file }) => {
    // Determine if file is stamped - check both is_stamped and foreign_tx_id
    const isStamped = file.foreign_tx_id ? true : file.is_stamped || false;

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
          navigate(`/file/${file.hash}`, { state: { fileData: file } })
        }>
        {isImageFile(file.name) && (
          <CardMedia
            component="img"
            height="200"
            width="100%"
            image={
              getResizedImageUrl(file.gatewayurl) ||
              `https://ipfs.io/ipfs/${file.hash}`
            }
            alt={file.name}
            sx={{
              objectFit: "contain",
              backgroundColor: "#f5f5f5",
              borderBottom: "1px solid #e0e0e0",
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
            onClick={fetchFiles}
            disabled={loading}>
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
            onClick={handleStampCollection}
            disabled={stamping}>
            {stamping ? "Stamping..." : "Stamp Collection"}
          </Button>
        </Box>
      </Box>

      {/* Group Statistics */}
      {loadingStats ? (
        <Box display="flex" justifyContent="center" mb={3}>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ ml: 1 }}>
            Loading group statistics...
          </Typography>
        </Box>
      ) : (
        groupStats && (
          <Card
            sx={{
              mb: 3,
              backgroundColor: groupStats.allStamped ? "#f8fff8" : "#fff",
            }}>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={3}>
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
                </Box>
                {groupStats.allStamped && (
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
        )
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
            disabled={!selectedFile || uploading}>
            {uploading ? "Uploading..." : "Upload"}
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
