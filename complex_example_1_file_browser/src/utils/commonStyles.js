/**
 * Common styles used across multiple components
 * Reduces code duplication and ensures consistency
 */

// Common flex layout styles
export const flexCenter = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
};

export const flexCenterVertical = {
    display: "flex",
    alignItems: "center",
};

export const flexCenterHorizontal = {
    display: "flex",
    justifyContent: "center",
};

export const flexSpaceBetween = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
};

export const flexGap = (gap = 1) => ({
    display: "flex",
    gap: gap,
});

export const flexGapWrap = (gap = 1) => ({
    display: "flex",
    gap: gap,
    flexWrap: "wrap",
});

// Common icon styles
export const iconWithMargin = (size = 16, marginRight = 1, color = "text.secondary") => ({
    fontSize: size,
    mr: marginRight,
    color: color,
});

export const iconPrimary = (size = 16, marginRight = 1) => ({
    fontSize: size,
    mr: marginRight,
    color: "primary.main",
});

export const iconSecondary = (size = 16, marginRight = 1) => ({
    fontSize: size,
    mr: marginRight,
    color: "text.secondary",
});

// Common spacing styles
export const marginBottom = (spacing = 2) => ({
    mb: spacing,
});

export const marginTop = (spacing = 2) => ({
    mt: spacing,
});

export const padding = (spacing = 2) => ({
    p: spacing,
});

// Common container styles
export const fullHeight = {
    height: "100%",
};

export const fullWidth = {
    width: "100%",
};

export const minHeight = (height = 200) => ({
    minHeight: height,
});

// Common loading/error states
export const loadingContainer = {
    display: "flex",
    justifyContent: "center",
    p: 4,
};

export const errorContainer = {
    mb: 3,
};

export const contentLoadingBox = (height = 400) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: height,
    bgcolor: "grey.100",
    borderRadius: 1,
});

export const contentErrorBox = (height = 400) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: height,
    bgcolor: "grey.100",
    borderRadius: 1,
});

export const contentBox = {
    maxHeight: "400px",
    overflow: "auto",
    border: "1px solid #e0e0e0",
    borderRadius: 1,
    bgcolor: "#f8f9fa",
};

// Common card styles
export const cardWithPadding = (padding = 2) => ({
    p: padding,
    mb: 2,
});

export const cardFullHeight = {
    height: "100%",
};

// Common text styles
export const textWithMargin = (margin = 1) => ({
    ml: margin,
});

export const textSecondary = {
    color: "text.secondary",
};

export const textCenter = {
    textAlign: "center",
};

// Common divider styles
export const dividerWithMargin = (margin = 3) => ({
    my: margin,
});

// Common button styles
export const buttonWithMargin = (margin = 2) => ({
    mr: margin,
});

// Common alert styles
export const alertWithMargin = (margin = 3) => ({
    mb: margin,
}); 