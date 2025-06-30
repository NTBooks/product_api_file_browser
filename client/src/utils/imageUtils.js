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
 * Gets the best image URL for display
 * @param {string} originalUrl - The original image URL
 * @returns {string} - The URL to use
 */
export const getBestImageUrl = (originalUrl) => {
    if (!originalUrl) return null;
    return originalUrl;
}; 