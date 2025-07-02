import { useState } from "react";
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
} from "../hooks/useApi";
import LazyImage from "../components/LazyImage";
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
import { toProxyUrl } from "../utils/ipfsUtils";

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
          ...cardFullHeight,
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
              toProxyUrl(`https://ipfs.io/ipfs/${file.hash}`)
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
            <Chip
              label={isStamped ? "Stamped" : "Not Stamped"}
              color={isStamped ? "success" : "warning"}
              icon={isStamped ? <CheckCircleIcon /> : <CancelIcon />}
              size="small"
            />
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
