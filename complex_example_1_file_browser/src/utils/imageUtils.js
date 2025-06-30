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

/**
 * Creates a proxy URL for IPFS content
 * @param {string} ipfsHash - The IPFS hash
 * @returns {string} - The proxy URL
 */
export const createIpfsProxyUrl = (ipfsHash) => {
    if (!ipfsHash) return null;
    return `/api/ipfs/${ipfsHash}`;
};

/**
 * Gets the best IPFS URL, falling back to proxy if needed
 * @param {string} gatewayUrl - The original gateway URL
 * @param {boolean} useProxy - Whether to use proxy as fallback
 * @returns {string} - The best URL to use
 */
export const getBestIpfsUrl = (gatewayUrl, useProxy = true) => {
    if (!gatewayUrl) return null;

    // If it's already a proxy URL, return as is
    if (gatewayUrl.startsWith('/api/ipfs/')) {
        return gatewayUrl;
    }

    // Try to extract IPFS hash and create proxy URL
    if (useProxy) {
        const ipfsHash = extractIpfsHash(gatewayUrl);
        if (ipfsHash) {
            return createIpfsProxyUrl(ipfsHash);
        }
    }

    return gatewayUrl;
}; 