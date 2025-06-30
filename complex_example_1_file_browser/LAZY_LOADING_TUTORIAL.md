# Lazy Loading Images Tutorial

This tutorial demonstrates how to implement **lazy loading** for images using React hooks and the Intersection Observer API. This significantly improves performance by only loading images when they're about to become visible on screen.

## Why Lazy Loading?

### Problems with Loading All Images:

- ❌ **Performance Impact**: All images load immediately, even if not visible
- ❌ **Bandwidth Waste**: Downloads images user might never see
- ❌ **Slow Initial Load**: Large pages take forever to load
- ❌ **Poor User Experience**: Users wait for unnecessary content

### Benefits of Lazy Loading:

- ✅ **Faster Initial Load**: Only loads visible images
- ✅ **Bandwidth Savings**: Downloads images only when needed
- ✅ **Better Performance**: Reduces memory usage and network requests
- ✅ **Improved UX**: Faster page loads and smoother scrolling

## Implementation Overview

### 1. Custom Hook: `useLazyImage`

```jsx
// hooks/useLazyImage.js
import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";

export const useLazyImage = (src, options = {}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  const { ref, inView } = useInView({
    triggerOnce: true, // Only trigger once
    threshold: 0.1, // Trigger when 10% visible
    rootMargin: "50px", // Start loading 50px before visible
    ...options,
  });

  useEffect(() => {
    if (inView && src && !imageSrc) {
      setImageSrc(src); // Start loading when in view
    }
  }, [inView, src, imageSrc]);

  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();

    const handleLoad = () => {
      setIsLoaded(true);
      setIsError(false);
    };

    const handleError = () => {
      setIsError(true);
      setIsLoaded(false);
    };

    img.addEventListener("load", handleLoad);
    img.addEventListener("error", handleError);
    img.src = imageSrc;

    return () => {
      img.removeEventListener("load", handleLoad);
      img.removeEventListener("error", handleError);
    };
  }, [imageSrc]);

  return { ref, src: imageSrc, isLoaded, isError, isInView: inView };
};
```

### 2. Reusable Component: `LazyImage`

```jsx
// components/LazyImage.jsx
import React from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { Image, BrokenImage } from "@mui/icons-material";
import { useLazyImage } from "../hooks/useLazyImage";

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
  const {
    ref,
    src: imageSrc,
    isLoaded,
    isError,
    isInView,
  } = useLazyImage(src, options);

  // Default placeholder with image icon and loading text
  const defaultPlaceholder = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      width={width || "100%"}
      height={height || 200}
      bgcolor="grey.100"
      borderRadius={1}
      border="2px dashed"
      borderColor="grey.300"
      sx={{
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
        }}
      />
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontWeight: 500 }}>
        Loading Image...
      </Typography>
      <CircularProgress size={20} sx={{ mt: 1, color: "primary.main" }} />
    </Box>
  );

  return (
    <Box
      ref={ref}
      sx={{ width, height, position: "relative", ...sx }}
      {...props}>
      {/* Show placeholder while loading */}
      {(!isInView || !isLoaded) &&
        !isError &&
        (placeholder || (compact ? compactPlaceholder : defaultPlaceholder))}

      {/* Show error if failed */}
      {isError &&
        (errorComponent || (
          <Alert severity="error">Failed to load image</Alert>
        ))}

      {/* Show image when loaded */}
      {isLoaded && imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      )}
    </Box>
  );
};
```

### 3. Usage in Components

#### Before (Traditional approach):

```jsx
// ❌ Bad - loads all images immediately
<CardMedia
  component="img"
  height="200"
  image={getResizedImageUrl(file.gatewayurl)}
  alt={file.name}
/>
```

#### After (Lazy loading):

```jsx
// ✅ Good - loads only when visible
<LazyImage
  src={getResizedImageUrl(file.gatewayurl)}
  alt={file.name}
  width="100%"
  height="200"
  sx={{ objectFit: "contain" }}
/>
```

## Key Concepts

### 1. Intersection Observer API

The Intersection Observer API watches when elements enter/exit the viewport:

```jsx
const { ref, inView } = useInView({
  triggerOnce: true, // Only trigger once
  threshold: 0.1, // Trigger when 10% visible
  rootMargin: "50px", // Start loading 50px before visible
});
```

### 2. Preventing Layout Shifts

The component prevents jarring layout shifts by maintaining consistent dimensions:

```jsx
// ✅ Good - Placeholder reserves exact same space
<LazyImage
  src={imageUrl}
  width="100%"
  height="200px"
  sx={{
    minHeight: "200px", // Ensures consistent height
    aspectRatio: "1/1", // Maintains square aspect ratio
  }}
/>

// ❌ Bad - Placeholder changes size when image loads
<img src={imageUrl} style={{ width: "100%" }} /> // Height changes based on image
```

**Key Features:**

- **Consistent Dimensions**: Placeholder and image have identical size
- **Aspect Ratio Lock**: Maintains shape regardless of image dimensions
- **Min Height**: Ensures minimum space is always reserved
- **Smooth Transitions**: No jarring jumps when images load

### 3. Loading States

The hook manages multiple states:

- **Not in view**: Image not yet visible
- **Loading**: Image is downloading
- **Loaded**: Image successfully loaded
- **Error**: Image failed to load

### 4. Preloading Strategy

```jsx
rootMargin: "50px"; // Start loading 50px before image is visible
```

This creates a "buffer zone" so images start loading before they're actually visible, providing a smoother experience.

## Performance Benefits

### 1. Network Optimization

```jsx
// Before: All images load immediately
// After: Only visible images load
```

### 2. Memory Management

- Reduces memory usage on mobile devices
- Prevents loading unnecessary images
- Better performance on slow connections

### 3. User Experience

- Faster initial page load
- Smoother scrolling
- Progressive content loading

## Advanced Features

### 1. Handling 302 Redirects

The implementation properly handles 302 redirects from IPFS gateways:

```jsx
// ✅ Good - Handles redirects automatically
<LazyImage
  src="https://devedu.chainletter.io/ipfs/QmHash" // May return 302
  alt="Image"
/>

// The hook automatically resolves the final URL:
// 1. Makes HEAD request to original URL
// 2. Follows 302 redirect if present
// 3. Uses final URL for image loading
```

**How it works:**

1. **URL Resolution**: Uses `fetch()` with `redirect: 'follow'` to resolve final URL
2. **HEAD Request**: Avoids downloading full image during resolution
3. **Fallback**: Uses original URL if resolution fails
4. **Caching**: React Query doesn't interfere with image loading

### 2. Obvious Loading Placeholders

The new placeholder design is much more obvious and user-friendly:

```jsx
// ✅ Good - Clear loading indication
<LazyImage
  src={imageUrl}
  placeholder={
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      bgcolor: 'grey.100',
      border: '2px dashed grey.300',
      borderRadius: 1,
    }}>
      <Image sx={{ fontSize: 48, color: 'grey.400', animation: 'pulse 2s infinite' }} />
      <Typography>Loading Image...</Typography>
      <CircularProgress />
    </Box>
  }
/>

// ❌ Bad - Subtle skeleton that's easy to miss
<Skeleton variant="rectangular" width={width} height={height} />
```

**Benefits of Obvious Placeholders:**

- **Clear Loading State**: Users immediately know an image is loading
- **Visual Feedback**: Pulsing icon and spinner show active loading
- **Professional Look**: Dashed border and centered layout look polished
- **Hover Effects**: Subtle interactions make the interface feel responsive

### 3. Compact Mode for File Cards

For smaller images like file thumbnails, use compact mode:

```jsx
<LazyImage
  src={imageUrl}
  alt={fileName}
  width="100%"
  height="200"
  compact={true} // Uses smaller placeholder
  sx={{ objectFit: "contain" }}
/>
```

### 4. Custom Placeholders

```jsx
<LazyImage
  src={imageUrl}
  placeholder={
    <Box
      sx={{
        bgcolor: "grey.200",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
      <Typography>Loading...</Typography>
    </Box>
  }
/>
```

### 5. Error Handling

```jsx
<LazyImage
  src={imageUrl}
  errorComponent={
    <Box sx={{ bgcolor: "error.light", p: 2 }}>
      <Typography color="error">Image failed to load</Typography>
    </Box>
  }
/>
```

### 6. Custom Intersection Options

```jsx
<LazyImage
  src={imageUrl}
  options={{
    threshold: 0.5, // Trigger when 50% visible
    rootMargin: "100px", // Larger buffer zone
    triggerOnce: false, // Trigger every time (for dynamic content)
  }}
/>
```

## Best Practices

### 1. Always Provide Alt Text

```jsx
<LazyImage src={url} alt="Descriptive alt text" />
```

### 2. Set Appropriate Dimensions

```jsx
<LazyImage src={url} width="100%" height="200px" />
```

### 3. Use Meaningful Placeholders

```jsx
<LazyImage
  src={url}
  placeholder={<Skeleton variant="rectangular" height={200} />}
/>
```

### 4. Handle Errors Gracefully

```jsx
<LazyImage
  src={url}
  errorComponent={<Alert severity="error">Failed to load</Alert>}
/>
```

## Browser Support

The Intersection Observer API is supported in:

- ✅ Chrome 51+
- ✅ Firefox 55+
- ✅ Safari 12.1+
- ✅ Edge 15+

For older browsers, `react-intersection-observer` provides polyfills.

## Performance Monitoring

You can monitor the performance impact:

```jsx
// Add performance tracking
const { ref, inView } = useInView({
  onChange: (inView) => {
    if (inView) {
      console.log("Image became visible:", src);
      // Track analytics, performance metrics, etc.
    }
  },
});
```

## Migration Guide

To migrate from traditional image loading:

1. **Install dependency**: `npm install react-intersection-observer`
2. **Create custom hook**: Implement `useLazyImage`
3. **Create component**: Implement `LazyImage`
4. **Replace images**: Replace `CardMedia`/`img` with `LazyImage`
5. **Test performance**: Monitor loading times and user experience

## Conclusion

Lazy loading images is essential for modern web applications. This implementation provides:

- **Better Performance**: Faster page loads and reduced bandwidth
- **Improved UX**: Smoother scrolling and progressive loading
- **Flexibility**: Customizable placeholders and error handling
- **Accessibility**: Proper alt text and loading states

The combination of React hooks and Intersection Observer API creates a powerful, reusable solution for efficient image loading.
