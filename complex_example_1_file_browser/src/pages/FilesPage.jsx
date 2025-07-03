import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ImageIcon from "@mui/icons-material/Image";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CodeIcon from "@mui/icons-material/Code";
import UploadIcon from "@mui/icons-material/Upload";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VerifiedIcon from "@mui/icons-material/Verified";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import WarningIcon from "@mui/icons-material/Warning";
import {
  useFiles,
  useGroupStats,
  useUploadFile,
  useStampCollection,
  useGroups,
} from "../hooks/useApi";
import LazyImage from "../components/LazyImage";
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
} from "../utils/commonStyles";

// FileCard component moved outside to prevent recreation on re-renders
const FileCard = ({
  file,
  groupId,
  navigate,
  isPendingUpload,
  useEvents,
  usePendingUpload,
  isImageFile,
  getResizedImageUrl,
  getFileIcon,
  formatBytes,
  getNetworkColor,
  formatBulkId,
}) => {
  // Use is_stamped directly from the API
  const isStamped = file.is_stamped || false;
  const isPending = isPendingUpload(file.hash);
  const { isConfirmed, isConnected } = usePendingUpload(file.hash);

  // Determine upload state based on events
  const { events } = useEvents();
  const fileEvents = events.filter(
    (event) =>
      event.data?.hash === file.hash &&
      (event.type === "file.uploaded" || event.type === "file.pinned")
  );

  let uploadState = null;
  if (isPending) {
    // Check if we have a file.uploaded event but no file.pinned event
    const hasUploadedEvent = fileEvents.some(
      (event) => event.type === "file.uploaded"
    );
    const hasPinnedEvent = fileEvents.some(
      (event) => event.type === "file.pinned"
    );

    if (hasPinnedEvent) {
      uploadState = "pinned";
    } else if (hasUploadedEvent) {
      uploadState = "uploaded";
    } else {
      uploadState = "pinning";
    }
  }

  return (
    <Card
      sx={{
        ...cardFullHeight,
        cursor: isPending && !isConfirmed ? "not-allowed" : "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
        opacity: isPending && !isConfirmed ? 0.7 : 1,
        "&:hover": {
          transform: isPending && !isConfirmed ? "none" : "translateY(-4px)",
          boxShadow: isPending && !isConfirmed ? 1 : 4,
        },
      }}
      onClick={() => {
        if (!isPending || isConfirmed) {
          navigate(`/file/${file.hash}`, {
            state: { fileData: file, groupId: groupId },
          });
        }
      }}>
      {isImageFile(file.name) && (
        <LazyImage
          src={
            getResizedImageUrl(file.gatewayurl) ||
            `${
              import.meta.env.VITE_DEMO_SERVER || "http://localhost:3041"
            }/ipfs?url=${encodeURIComponent(
              `https://ipfs.io/ipfs/${file.hash}`
            )}`
          }
          alt={file.name}
          width="100%"
          height="200px"
          compact={true}
          isPending={isPending && !isConfirmed}
          uploadState={uploadState}
          sx={{
            objectFit: "contain",
            backgroundColor: "#f5f5f5",
            borderBottom: "1px solid #e0e0e0",
            minHeight: "200px", // Ensure consistent height
          }}
        />
      )}
      <CardContent>
        <Box sx={{ ...flexCenterVertical, ...marginBottom(1) }}>
          {getFileIcon(file.name)}
          <Typography
            variant="h6"
            component="div"
            sx={textWithMargin(1)}
            noWrap>
            {file.name}
          </Typography>
        </Box>

        <Typography
          variant="body2"
          sx={{ ...textSecondary, ...marginBottom(1) }}>
          Size: {formatBytes(file.size)}
        </Typography>

        <Box sx={flexGapWrap(1)}>
          <Chip
            label={file.network}
            color={getNetworkColor(file.network)}
            size="small"
          />
          {isPending && !isConfirmed ? (
            <Chip
              label={isConnected ? "Pending IPFS" : "Waiting for connection"}
              color="warning"
              icon={
                isConnected ? <CircularProgress size={16} /> : <WarningIcon />
              }
              size="small"
            />
          ) : (
            <Chip
              label={isStamped ? "Stamped" : "Not Stamped"}
              color={isStamped ? "success" : "warning"}
              icon={isStamped ? <CheckCircleIcon /> : <CancelIcon />}
              size="small"
            />
          )}
          {file.bulk_check?.postmark_hash && (
            <Chip
              label={`Stamp: ${formatBulkId(file.bulk_check.postmark_hash)}`}
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

const FilesPage = () => {
  console.log("FilesPage component rendering");
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [proxyAvailable, setProxyAvailable] = useState(true);
  const [healthCheckComplete, setHealthCheckComplete] = useState(false);
  const { addPendingUpload, isPendingUpload } = useEvents();

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

  const { data: groupsData, isLoading: groupsLoading } = useGroups();

  const uploadMutation = useUploadFile();
  const stampMutation = useStampCollection();

  // Check proxy availability using health check endpoint
  useEffect(() => {
    console.log("FilesPage mounted, starting proxy health check...");

    const checkProxyHealth = async () => {
      console.log("checkProxyHealth function called");
      try {
        console.log("Making fetch request to /api/healthcheck...");

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch("/api/healthcheck", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log("Fetch response received:", response.status);

        if (response.ok) {
          const healthData = await response.json();
          console.log("Proxy health check successful:", healthData);
          setProxyAvailable(true);
        } else {
          console.error("Proxy health check failed:", response.status);
          setProxyAvailable(false);
        }
      } catch (error) {
        console.error("Proxy health check failed:", error);
        setProxyAvailable(false);
      } finally {
        console.log(
          "Health check complete, setting healthCheckComplete to true"
        );
        setHealthCheckComplete(true);
      }
    };

    // Call health check immediately
    checkProxyHealth();

    // Check health every 30 seconds
    const healthInterval = setInterval(() => {
      console.log("Periodic health check triggered");
      checkProxyHealth();
    }, 30000);

    return () => {
      console.log("Cleaning up health check interval");
      clearInterval(healthInterval);
    };
  }, []);

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
      return <ImageIcon color="primary" />;
    } else if (["pdf"].includes(extension)) {
      return <PictureAsPdfIcon color="error" />;
    } else if (["json"].includes(extension)) {
      return <CodeIcon color="warning" />;
    } else {
      return <InsertDriveFileIcon color="action" />;
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

  const formatBulkId = (stampHash) => {
    if (!stampHash) return null;
    // Show first 8 characters followed by ...
    return `${stampHash.substring(0, 8)}...`;
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    // Get the network from the groups data or from existing files
    let network = "public"; // default fallback

    if (files.length > 0) {
      // If there are existing files, use their network
      network = files[0].network;
    } else if (groupsData?.groups) {
      // If no files yet, get network from groups data
      const group = groupsData.groups.find((g) => g.id === groupId);
      if (group) {
        network = group.network;
      }
    }

    console.log(`Uploading file to group ${groupId} on network: ${network}`);

    uploadMutation.mutate(
      { file: selectedFile, groupId, network },
      {
        onSuccess: (response) => {
          console.log("Upload response:", response); // Debug log

          // Check if this was a 409 response (file already exists)
          if (
            response &&
            response.success === false &&
            response.message === "File already exists in group"
          ) {
            setSnackbar({
              open: true,
              message: `File already exists in this group`,
              severity: "warning",
            });
            setUploadDialogOpen(false);
            setSelectedFile(null);
            // Refresh the files list to show the existing file
            refetchFiles();
          } else if (response && response.hash) {
            // Normal upload success
            addPendingUpload(response.hash);
            setSnackbar({
              open: true,
              message: "File uploaded! Waiting for IPFS confirmation...",
              severity: "info",
            });
            setUploadDialogOpen(false);
            setSelectedFile(null);
          } else {
            setSnackbar({
              open: true,
              message: "File uploaded successfully!",
              severity: "success",
            });
            setUploadDialogOpen(false);
            setSelectedFile(null);
          }
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
    // Get the network from the first file in the group
    // All files in a group should have the same network
    const network = files.length > 0 ? files[0].network : "public";

    console.log(`Stamping collection ${groupId} on network: ${network}`);

    stampMutation.mutate(
      { groupId, network },
      {
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
      }
    );
  };

  // Show loading state while health check is in progress
  if (!healthCheckComplete) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          textAlign: "center",
          p: 3,
        }}>
        <CircularProgress size={60} sx={{ mb: 3 }} />
        <Typography variant="h6" gutterBottom>
          Checking Proxy Server...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Verifying connection to the proxy server
        </Typography>
      </Box>
    );
  }

  // Show full-page error if proxy is unavailable
  if (!proxyAvailable) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          textAlign: "center",
          p: 3,
        }}>
        <Alert
          severity="error"
          sx={{
            maxWidth: 600,
            mb: 3,
          }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Proxy Server Unavailable
          </Typography>
          <Typography variant="body1" paragraph>
            The proxy server is not running or is not accessible. This
            application requires the proxy server to function properly.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please ensure the proxy server is running on port 3041 and try
            refreshing the page.
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}>
            Refresh Page
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ ...flexSpaceBetween, ...marginBottom(3) }}>
        <Box sx={flexGap(2)}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/groups")}>
            Back to Groups
          </Button>
          <Typography variant="h4">Files in Group: {groupId}</Typography>
        </Box>
        <Box sx={flexGap(2)}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refetchFiles}
            disabled={filesLoading}>
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}>
            Upload File
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<VerifiedIcon />}
            onClick={handleStampCollection}
            disabled={groupStats?.allStamped || stampMutation.isPending}>
            {stampMutation.isPending ? "Stamping..." : "Stamp Collection"}
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
          <Box sx={flexSpaceBetween}>
            <Box sx={flexGap(3)}>
              {groupStats ? (
                <>
                  <Box sx={flexCenterVertical}>
                    <InsertDriveFileIcon sx={iconSecondary(20, 1)} />
                    <Typography variant="h6" sx={textSecondary}>
                      {groupStats.totalFiles} files
                    </Typography>
                  </Box>
                  <Box sx={flexCenterVertical}>
                    {groupStats.allStamped ? (
                      <CheckCircleIcon
                        sx={iconWithMargin(20, 1, "success.main")}
                      />
                    ) : (
                      <WarningIcon sx={iconWithMargin(20, 1, "warning.main")} />
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
                  <Box sx={flexCenterVertical}>
                    <Typography variant="body2" sx={textSecondary}>
                      Total size: {formatBytes(groupStats.totalSize)}
                    </Typography>
                  </Box>
                </>
              ) : (
                <Box sx={flexCenterVertical}>
                  <CircularProgress size={20} sx={buttonWithMargin(1)} />
                  <Typography variant="h6" sx={textSecondary}>
                    Loading...
                  </Typography>
                </Box>
              )}
            </Box>
            {groupStats?.allStamped && (
              <Chip
                label="All Files Stamped"
                color="success"
                icon={<CheckCircleIcon />}
                size="medium"
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {filesError && (
        <Alert severity="error" sx={errorContainer}>
          {filesError.message}
        </Alert>
      )}

      {filesLoading ? (
        <Box sx={loadingContainer}>
          <CircularProgress />
        </Box>
      ) : files.length > 0 ? (
        <Grid container spacing={3}>
          {files.map((file) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={file.hash}>
              <FileCard
                file={file}
                groupId={groupId}
                navigate={navigate}
                isPendingUpload={isPendingUpload}
                useEvents={useEvents}
                usePendingUpload={usePendingUpload}
                isImageFile={isImageFile}
                getResizedImageUrl={getResizedImageUrl}
                getFileIcon={getFileIcon}
                formatBytes={formatBytes}
                getNetworkColor={getNetworkColor}
                formatBulkId={formatBulkId}
              />
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
          <Box sx={marginTop(2)}>
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
                startIcon={<UploadIcon />}>
                Select File
              </Button>
            </label>
            {selectedFile && (
              <Typography variant="body2" sx={marginTop(2)}>
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
