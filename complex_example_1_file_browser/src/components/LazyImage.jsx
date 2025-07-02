import React, { useState } from "react";
import {
  Box,
  Skeleton,
  Alert,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Image, BrokenImage } from "@mui/icons-material";
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
import { toProxyUrl } from "../utils/ipfsUtils";

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
 * @param {boolean} props.compact - Use compact placeholder for smaller images
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
  compact = false,
  ...props
}) => {
  const [imageState, setImageState] = useState("loading"); // 'loading', 'loaded', 'error'
  const { ref, inView } = useInView({
    triggerOnce: true,
    ...options,
  });

  // Use the actual width/height props if provided, otherwise use compact defaults
  const placeholderHeight = height || (compact ? 120 : 200);
  const placeholderWidth = width || (compact ? 120 : 300);

  // Compact placeholder for file cards
  const compactPlaceholder = (
    <Box
      sx={createPlaceholderStyles(placeholderWidth, placeholderHeight, true)}>
      <Image sx={createIconStyles(true)} />
      <Typography sx={createTextStyles(true)}>Loading...</Typography>
    </Box>
  );

  // Default placeholder with image icon and loading text
  const defaultPlaceholder = (
    <Box
      sx={createPlaceholderStyles(placeholderWidth, placeholderHeight, false)}>
      <Image sx={createIconStyles(false)} />
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

  // Compact error component
  const compactErrorComponent = (
    <Box sx={createErrorStyles(placeholderWidth, placeholderHeight, true)}>
      <BrokenImage sx={createErrorIconStyles(true)} />
      <Typography sx={createErrorTextStyles(true)}>Failed to load</Typography>
    </Box>
  );

  // Default error component with broken image icon
  const defaultErrorComponent = (
    <Box sx={createErrorStyles(placeholderWidth, placeholderHeight, false)}>
      <BrokenImage sx={createErrorIconStyles(false)} />
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
      {/* Show placeholder while not in view or loading */}
      {(!inView || imageState === "loading") &&
        imageState !== "error" &&
        (placeholder || (compact ? compactPlaceholder : defaultPlaceholder))}

      {/* Show error component if image failed to load */}
      {imageState === "error" &&
        (errorComponent ||
          (compact ? compactErrorComponent : defaultErrorComponent))}

      {/* Show image when in view - use proxy to avoid CORS/ORB issues */}
      {inView && src && imageState !== "error" && (
        <img
          src={toProxyUrl(src)}
          alt={alt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            opacity: imageState === "loaded" ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
          onLoad={() => setImageState("loaded")}
          onError={() => setImageState("error")}
        />
      )}
    </Box>
  );
};

export default LazyImage;
