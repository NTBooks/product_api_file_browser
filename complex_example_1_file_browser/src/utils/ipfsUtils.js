/**
 * IPFS utility functions for handling gateway URLs
 */

/**
 * Convert gateway URL to proxy URL
 * @param {string} gatewayUrl - The original gateway URL
 * @returns {string} - The proxy URL
 */
export const toProxyUrl = (gatewayUrl) => {
    if (!gatewayUrl) return null;

    // If it's already a proxy URL, return as is
    if (gatewayUrl.startsWith('http://localhost:3041/ipfs?')) {
        return gatewayUrl;
    }

    // Encode the URL and use it as a query parameter
    const encodedUrl = encodeURIComponent(gatewayUrl);
    return `http://localhost:3041/ipfs?url=${encodedUrl}`;
};

/**
 * Check if a URL is an IPFS gateway URL
 * @param {string} url - The URL to check
 * @returns {boolean} - True if it's an IPFS gateway URL
 */
export const isIpfsGatewayUrl = (url) => {
    if (!url) return false;

    return url.includes('ipfs') ||
        url.includes('gateway.pinata.cloud') ||
        url.includes('cloudflare-ipfs.com') ||
        url.includes('dweb.link');
}; 