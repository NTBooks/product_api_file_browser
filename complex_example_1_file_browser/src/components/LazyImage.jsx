import React, { useState, useRef, useEffect, memo } from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import ImageIcon from "@mui/icons-material/Image";
import BrokenImageIcon from "@mui/icons-material/BrokenImage";
import { useInView } from "react-intersection-observer";
import {
  flexCenter,
  iconWithMargin,
  iconSecondary,
  textCenter,
  textSecondary,
  marginTop,
  minHeight,
  fullWidth,
} from "../utils/commonStyles";

// LazyImage specific styles that extend common styles
const createPlaceholderStyles = (width, height, compact = false) => ({
  ...flexCenter,
  flexDirection: "column",
  width: width,
  height: height,
  minHeight: height,
  aspectRatio: width && height ? `${width}/${height}` : undefined,
  borderRadius: 1,
  border: `${compact ? 1 : 2}px dashed`,
  borderColor: "grey.300",
  bgcolor: "grey.100",
  transition: "all 0.3s ease",
  "&:hover": {
    bgcolor: "grey.200",
    borderColor: "grey.400",
  },
});

const createErrorStyles = (width, height, compact = false) => ({
  ...flexCenter,
  flexDirection: "column",
  width: width,
  height: height,
  minHeight: height,
  aspectRatio: width && height ? `${width}/${height}` : undefined,
  borderRadius: 1,
  border: `${compact ? 1 : 2}px dashed`,
  borderColor: "error.main",
  bgcolor: "error.light",
});

const createPendingStyles = (width, height, compact = false) => ({
  ...flexCenter,
  flexDirection: "column",
  width: width,
  height: height,
  minHeight: height,
  aspectRatio: width && height ? `${width}/${height}` : undefined,
  borderRadius: 1,
  border: `${compact ? 1 : 2}px dashed`,
  borderColor: "warning.main",
  bgcolor: "warning.light",
});

const createIconStyles = (compact = false) => ({
  fontSize: compact ? 32 : 48,
  color: "grey.400",
  mb: compact ? 0.5 : 1,
  animation: "pulse 2s infinite",
  "@keyframes pulse": {
    "0%": { opacity: 0.6 },
    "50%": { opacity: 1 },
    "100%": { opacity: 0.6 },
  },
});

const createErrorIconStyles = (compact = false) => ({
  fontSize: compact ? 32 : 48,
  color: "error.main",
  mb: compact ? 0.5 : 1,
});

const createPendingIconStyles = (compact = false) => ({
  fontSize: compact ? 32 : 48,
  color: "warning.main",
  mb: compact ? 0.5 : 1,
  animation: "pulse 2s infinite",
  "@keyframes pulse": {
    "0%": { opacity: 0.6 },
    "50%": { opacity: 1 },
    "100%": { opacity: 0.6 },
  },
});

const createTextStyles = (compact = false, color = "text.secondary") => ({
  fontWeight: 500,
  ...textCenter,
  color: color,
  variant: compact ? "caption" : "body2",
});

const createErrorTextStyles = (compact = false) => ({
  fontWeight: 500,
  ...textCenter,
  color: "error.main",
  variant: compact ? "caption" : "body2",
});

const createPendingTextStyles = (compact = false) => ({
  fontWeight: 500,
  ...textCenter,
  color: "warning.main",
  variant: compact ? "caption" : "body2",
});

/**
 * LazyImage component for efficient image loading
 * @param {Object} props - Component props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Image alt text
 * @param {number} props.width - Image width
 * @param {number} props.height - Image height
 * @param {Object} props.sx - Material-UI sx prop
 * @param {Object} props.options - Intersection observer options
 * @param {React.ReactNode} props.placeholder - Custom placeholder component
 * @param {React.ReactNode} props.errorComponent - Custom error component
 * @param {React.ReactNode} props.pendingComponent - Custom pending component
 * @param {boolean} props.compact - Use compact placeholder for smaller images
 * @param {boolean} props.isPending - Show pending state instead of loading image
 * @param {string} props.uploadState - Upload state: 'uploaded', 'pinning', 'pinned'
 */
const LazyImage = ({
  src,
  alt,
  width,
  height,
  sx = {},
  options = {},
  placeholder,
  errorComponent,
  pendingComponent,
  compact = false,
  isPending = false,
  uploadState = null,
  ...props
}) => {
  const [imageState, setImageState] = useState("loading"); // 'loading', 'loaded', 'error'
  const [triedIpfsFallback, setTriedIpfsFallback] = useState(false);
  const loadedImagesRef = useRef(new Set());
  const { ref, inView } = useInView({
    triggerOnce: true,
    ...options,
  });

  // Check if this image has already been loaded
  const isAlreadyLoaded = loadedImagesRef.current.has(src);

  // Use the actual width/height props if provided, otherwise use compact defaults
  const placeholderHeight = height || (compact ? 120 : 200);
  const placeholderWidth = width || (compact ? 120 : 300);

  // Compact placeholder for file cards
  const compactPlaceholder = (
    <Box
      sx={createPlaceholderStyles(placeholderWidth, placeholderHeight, true)}>
      <ImageIcon sx={createIconStyles(true)} />
      <Typography sx={createTextStyles(true)}>Loading...</Typography>
    </Box>
  );

  // Default placeholder with image icon and loading text
  const defaultPlaceholder = (
    <Box
      sx={createPlaceholderStyles(placeholderWidth, placeholderHeight, false)}>
      <ImageIcon sx={createIconStyles(false)} />
      <Typography sx={createTextStyles(false)}>Loading Image...</Typography>
      <CircularProgress
        size={20}
        sx={{
          ...marginTop(1),
          color: "primary.main",
        }}
      />
    </Box>
  );

  // Get upload state text
  const getUploadStateText = () => {
    switch (uploadState) {
      case "uploaded":
        return "Uploaded, pinning...";
      case "pinning":
        return "Pinning...";
      case "pinned":
        return "Pinned";
      default:
        return "Pending IPFS";
    }
  };

  // Compact pending component
  const compactPendingComponent = (
    <Box sx={createPendingStyles(placeholderWidth, placeholderHeight, true)}>
      <CircularProgress sx={createPendingIconStyles(true)} />
      <Typography sx={createPendingTextStyles(true)}>
        {getUploadStateText()}
      </Typography>
    </Box>
  );

  // Compact error component
  const compactErrorComponent = (
    <Box sx={createErrorStyles(placeholderWidth, placeholderHeight, true)}>
      <BrokenImageIcon sx={createErrorIconStyles(true)} />
      <Typography sx={createErrorTextStyles(true)}>Failed to load</Typography>
    </Box>
  );

  // Default pending component
  const defaultPendingComponent = (
    <Box sx={createPendingStyles(placeholderWidth, placeholderHeight, false)}>
      <CircularProgress sx={createPendingIconStyles(false)} />
      <Typography sx={createPendingTextStyles(false)}>
        {getUploadStateText()}
      </Typography>
      <Typography
        variant="caption"
        color="warning.main"
        sx={{
          ...textCenter,
          opacity: 0.8,
        }}>
        {alt || "Image"}
      </Typography>
    </Box>
  );

  // Default error component with broken image icon
  const defaultErrorComponent = (
    <Box sx={createErrorStyles(placeholderWidth, placeholderHeight, false)}>
      <BrokenImageIcon sx={createErrorIconStyles(false)} />
      <Typography sx={createErrorTextStyles(false)}>
        Failed to load image
      </Typography>
      <Typography
        variant="caption"
        color="error.main"
        sx={{
          ...textCenter,
          opacity: 0.8,
        }}>
        {alt || "Image"}
      </Typography>
    </Box>
  );

  // Helper to extract CID from src (assume src is a CID or an IPFS URL)
  const getCidFromSrc = (src) => {
    if (!src) return null;
    // If src is just a CID
    if (/^[a-zA-Z0-9]{46,}$/.test(src)) return src;
    // If src is an ipfs:// or https://.../ipfs/CID
    const match = src.match(/(?:ipfs:\/\/|\/ipfs\/)([a-zA-Z0-9]+)(?:\/|$)/);
    if (match) return match[1];
    return null;
  };

  return (
    <Box
      ref={ref}
      sx={{
        width: width || "100%",
        height: height || "auto",
        ...minHeight(height || 200),
        aspectRatio: width && height ? `${width}/${height}` : undefined,
        position: "relative",
        ...sx,
      }}
      {...props}>
      {/* Show pending component if file is pending upload */}
      {isPending &&
        (pendingComponent ||
          (compact ? compactPendingComponent : defaultPendingComponent))}

      {/* Show placeholder while not in view or loading (only if not pending and not in upload states) */}
      {!isPending &&
        uploadState !== "uploaded" &&
        uploadState !== "pinning" &&
        (!inView || (imageState === "loading" && !isAlreadyLoaded)) &&
        imageState !== "error" &&
        (placeholder || (compact ? compactPlaceholder : defaultPlaceholder))}

      {/* Show error component only if both proxy and ipfs.io fail */}
      {!isPending &&
        uploadState !== "uploaded" &&
        uploadState !== "pinning" &&
        imageState === "error" &&
        triedIpfsFallback &&
        (errorComponent ||
          (compact ? compactErrorComponent : defaultErrorComponent))}

      {/* Show image when in view - use proxy to avoid CORS/ORB issues, fallback to ipfs.io if proxy fails */}
      {/* Only load image if not pending and upload state is 'pinned' or null (already pinned) */}
      {!isPending &&
        uploadState !== "uploaded" &&
        uploadState !== "pinning" &&
        inView &&
        src &&
        (imageState !== "error" || !triedIpfsFallback) && (
          <img
            key={src + (triedIpfsFallback ? "-ipfs" : "-proxy")}
            src={
              !triedIpfsFallback
                ? `${
                    import.meta.env.VITE_DEMO_SERVER || "http://localhost:3041"
                  }/ipfs?url=${encodeURIComponent(src)}`
                : (() => {
                    const cid = getCidFromSrc(src);
                    return cid ? `https://ipfs.io/ipfs/${cid}` : src;
                  })()
            }
            alt={alt}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
              opacity: imageState === "loaded" ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
            onLoad={() => {
              setImageState("loaded");
              loadedImagesRef.current.add(src);
            }}
            onError={() => {
              if (!triedIpfsFallback) {
                setTriedIpfsFallback(true);
                setImageState("loading");
              } else {
                setImageState("error");
              }
            }}
          />
        )}
    </Box>
  );
};

export default memo(LazyImage);
