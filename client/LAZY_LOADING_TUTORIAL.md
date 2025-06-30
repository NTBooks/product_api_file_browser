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
import { Box, Skeleton, Alert } from "@mui/material";
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
  ...props
}) => {
  const {
    ref,
    src: imageSrc,
    isLoaded,
    isError,
    isInView,
  } = useLazyImage(src, options);

  return (
    <Box
      ref={ref}
      sx={{ width, height, position: "relative", ...sx }}
      {...props}>
      {/* Show placeholder while loading */}
      {(!isInView || !isLoaded) &&
        !isError &&
        (placeholder || (
          <Skeleton variant="rectangular" width={width} height={height} />
        ))}

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

### 2. Loading States

The hook manages multiple states:

- **Not in view**: Image not yet visible
- **Loading**: Image is downloading
- **Loaded**: Image successfully loaded
- **Error**: Image failed to load

### 3. Preloading Strategy

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

### 1. Custom Placeholders

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

### 2. Error Handling

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

### 3. Custom Intersection Options

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
