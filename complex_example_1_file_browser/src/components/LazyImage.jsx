import React from "react";
import {
  Box,
  Skeleton,
  Alert,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Image, BrokenImage } from "@mui/icons-material";
import { useLazyImage } from "../hooks/useLazyImage";

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
  const { ref, imageSrc, isLoaded, isError, isInView } = useLazyImage(
    src,
    options
  );

  // Use the actual width/height props if provided, otherwise use compact defaults
  const placeholderHeight = height || (compact ? 120 : 200);
  const placeholderWidth = width || (compact ? 120 : 300);

  // Compact placeholder for file cards
  const compactPlaceholder = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      width={placeholderWidth}
      height={placeholderHeight}
      bgcolor="grey.100"
      borderRadius={1}
      border="1px dashed"
      borderColor="grey.300"
      sx={{
        minHeight: placeholderHeight, // Ensure minimum height is maintained
        aspectRatio: width && height ? `${width}/${height}` : undefined, // Maintain aspect ratio
      }}>
      <Image
        sx={{
          fontSize: 32,
          color: "grey.400",
          mb: 0.5,
          animation: "pulse 2s infinite",
          "@keyframes pulse": {
            "0%": { opacity: 0.6 },
            "50%": { opacity: 1 },
            "100%": { opacity: 0.6 },
          },
        }}
      />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          fontWeight: 500,
          textAlign: "center",
        }}>
        Loading...
      </Typography>
    </Box>
  );

  // Default placeholder with image icon and loading text
  const defaultPlaceholder = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      width={placeholderWidth}
      height={placeholderHeight}
      bgcolor="grey.100"
      borderRadius={1}
      border="2px dashed"
      borderColor="grey.300"
      sx={{
        minHeight: placeholderHeight, // Ensure minimum height is maintained
        aspectRatio: width && height ? `${width}/${height}` : undefined, // Maintain aspect ratio
        transition: "all 0.3s ease",
        "&:hover": {
          bgcolor: "grey.200",
          borderColor: "grey.400",
        },
      }}>
      <Image
        sx={{
          fontSize: 48,
          color: "grey.400",
          mb: 1,
          animation: "pulse 2s infinite",
          "@keyframes pulse": {
            "0%": { opacity: 0.6 },
            "50%": { opacity: 1 },
            "100%": { opacity: 0.6 },
          },
        }}
      />
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          fontWeight: 500,
          textAlign: "center",
        }}>
        Loading Image...
      </Typography>
      <CircularProgress
        size={20}
        sx={{
          mt: 1,
          color: "primary.main",
        }}
      />
    </Box>
  );

  // Compact error component
  const compactErrorComponent = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      width={placeholderWidth}
      height={placeholderHeight}
      bgcolor="error.light"
      borderRadius={1}
      border="1px dashed"
      borderColor="error.main"
      sx={{
        minHeight: placeholderHeight, // Ensure minimum height is maintained
        aspectRatio: width && height ? `${width}/${height}` : undefined, // Maintain aspect ratio
      }}>
      <BrokenImage
        sx={{
          fontSize: 32,
          color: "error.main",
          mb: 0.5,
        }}
      />
      <Typography
        variant="caption"
        color="error.main"
        sx={{
          fontWeight: 500,
          textAlign: "center",
        }}>
        Failed to load
      </Typography>
    </Box>
  );

  // Default error component with broken image icon
  const defaultErrorComponent = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      width={placeholderWidth}
      height={placeholderHeight}
      bgcolor="error.light"
      borderRadius={1}
      border="2px dashed"
      borderColor="error.main"
      sx={{
        minHeight: placeholderHeight, // Ensure minimum height is maintained
        aspectRatio: width && height ? `${width}/${height}` : undefined, // Maintain aspect ratio
      }}>
      <BrokenImage
        sx={{
          fontSize: 48,
          color: "error.main",
          mb: 1,
        }}
      />
      <Typography
        variant="body2"
        color="error.main"
        sx={{
          fontWeight: 500,
          textAlign: "center",
        }}>
        Failed to load image
      </Typography>
      <Typography
        variant="caption"
        color="error.main"
        sx={{
          textAlign: "center",
          opacity: 0.8,
        }}>
        {alt || "Image"}
      </Typography>
    </Box>
  );

  if (isError) {
    return (
      <Box
        ref={ref}
        sx={{
          width: placeholderWidth,
          height: placeholderHeight,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "grey.100",
          border: "1px solid",
          borderColor: "grey.300",
          borderRadius: 1,
          ...sx,
        }}
        {...props}>
        <Image sx={{ fontSize: 40, color: "grey.400", mb: 1 }} />
        <Typography variant="caption" color="text.secondary">
          Failed to load
        </Typography>
      </Box>
    );
  }

  if (!isLoaded) {
    return (
      <Box
        ref={ref}
        sx={{
          width: placeholderWidth,
          height: placeholderHeight,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "grey.50",
          border: "1px solid",
          borderColor: "grey.200",
          borderRadius: 1,
          ...sx,
        }}
        {...props}>
        <Skeleton
          variant="circular"
          width={compact ? 24 : 40}
          height={compact ? 24 : 40}
          sx={{ mb: 1 }}
        />
        <Typography variant="caption" color="text.secondary">
          {compact ? "Loading..." : "Loading image..."}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={ref}
      sx={{
        width: width || "100%",
        height: height || "auto",
        minHeight: height || 200, // Ensure minimum height is maintained
        aspectRatio: width && height ? `${width}/${height}` : undefined, // Maintain aspect ratio
        position: "relative",
        ...sx,
      }}
      {...props}>
      {/* Show placeholder while not in view or loading */}
      {(!isInView || !isLoaded) &&
        !isError &&
        (placeholder || (compact ? compactPlaceholder : defaultPlaceholder))}

      {/* Show error component if image failed to load */}
      {isError &&
        (errorComponent ||
          (compact ? compactErrorComponent : defaultErrorComponent))}

      {/* Show image when loaded */}
      {isLoaded && imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          }}
        />
      )}
    </Box>
  );
};

export default LazyImage;
