import React from "react";
import { Box, Skeleton, Alert } from "@mui/material";
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
  ...props
}) => {
  const {
    ref,
    src: imageSrc,
    isLoaded,
    isError,
    isInView,
  } = useLazyImage(src, options);

  // Default placeholder
  const defaultPlaceholder = (
    <Skeleton
      variant="rectangular"
      width={width || "100%"}
      height={height || 200}
      animation="wave"
    />
  );

  // Default error component
  const defaultErrorComponent = (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      width={width || "100%"}
      height={height || 200}
      bgcolor="grey.100"
      borderRadius={1}>
      <Alert severity="error" sx={{ width: "100%" }}>
        Failed to load image
      </Alert>
    </Box>
  );

  return (
    <Box
      ref={ref}
      sx={{
        width: width || "100%",
        height: height || "auto",
        position: "relative",
        ...sx,
      }}
      {...props}>
      {/* Show placeholder while not in view or loading */}
      {(!isInView || !isLoaded) &&
        !isError &&
        (placeholder || defaultPlaceholder)}

      {/* Show error component if image failed to load */}
      {isError && (errorComponent || defaultErrorComponent)}

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
