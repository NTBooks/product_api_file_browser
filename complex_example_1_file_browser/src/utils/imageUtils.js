/**
 * Checks if a URL is likely to be an IPFS gateway
 * @param {string} url - The URL to check
 * @returns {boolean} - True if it's likely an IPFS gateway
 */
export const isIpfsGateway = (url) => {
    if (!url) return false;
    return url.includes('ipfs') || url.includes('gateway');
};

/**
 * Resolves image URL by following redirects
 * @param {string} url - The original image URL
 * @returns {Promise<string>} - The resolved URL
 */
export const resolveImageUrl = async (url) => {
    if (!url) return null;

    try {
        // For now, just return the original URL
        // In the future, this could follow redirects if needed
        return url;
    } catch (error) {
        console.error('Error resolving image URL:', error);
        return url; // Fallback to original URL
    }
};

/**
 * Gets the best image URL for display
 * @param {string} originalUrl - The original image URL
 * @returns {string} - The URL to use
 */
export const getBestImageUrl = (originalUrl) => {
    if (!originalUrl) return null;
    return originalUrl;
};

/**
 * Extracts IPFS hash from a gateway URL
 * @param {string} gatewayUrl - The gateway URL
 * @returns {string|null} - The IPFS hash or null if not found
 */
export const extractIpfsHash = (gatewayUrl) => {
    if (!gatewayUrl) return null;

    // Try to extract hash from various gateway URL formats
    const patterns = [
        /\/ipfs\/([a-zA-Z0-9]+)/, // Standard /ipfs/hash format
        /ipfs\.io\/ipfs\/([a-zA-Z0-9]+)/, // ipfs.io format
        /gateway\/([a-zA-Z0-9]+)/, // Custom gateway format
    ];

    for (const pattern of patterns) {
        const match = gatewayUrl.match(pattern);
        if (match) {
            return match[1];
        }
    }

    return null;
};

