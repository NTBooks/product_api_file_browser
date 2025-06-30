import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { resolveImageUrl } from '../utils/imageUtils';

/**
 * Custom hook for lazy loading images with fallback to IPFS proxy
 * @param {string} src - The image source URL
 * @param {Object} options - Intersection observer options
 * @returns {Object} - Image loading state and ref
 */
export const useLazyImage = (src, options = {}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isError, setIsError] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const [useProxy, setUseProxy] = useState(false);

    const { ref, inView } = useInView({
        triggerOnce: true,
        ...options
    });

    useEffect(() => {
        if (!src || !inView) {
            setImageSrc(null);
            setIsLoaded(false);
            setIsError(false);
            setUseProxy(false);
            return;
        }

        const loadImage = async () => {
            setIsLoaded(false);
            setIsError(false);

            try {
                // First try the original URL (with redirect resolution)
                const resolvedUrl = await resolveImageUrl(src);
                console.log('Resolved image URL:', resolvedUrl);

                const img = new Image();

                img.onload = () => {
                    setImageSrc(resolvedUrl);
                    setIsLoaded(true);
                    setIsError(false);
                };

                img.onerror = async () => {
                    console.log('Original URL failed, trying IPFS proxy...');

                    // If original URL fails and it's an IPFS URL, try the proxy
                    if (src.includes('ipfs') && !useProxy) {
                        setUseProxy(true);

                        // Extract IPFS hash and create proxy URL
                        const ipfsHash = extractIpfsHashFromUrl(src);
                        if (ipfsHash) {
                            const proxyUrl = `/api/ipfs/${ipfsHash}`;
                            console.log('Trying IPFS proxy:', proxyUrl);

                            const proxyImg = new Image();
                            proxyImg.onload = () => {
                                setImageSrc(proxyUrl);
                                setIsLoaded(true);
                                setIsError(false);
                            };
                            proxyImg.onerror = () => {
                                setIsError(true);
                                setIsLoaded(false);
                            };
                            proxyImg.src = proxyUrl;
                        } else {
                            setIsError(true);
                            setIsLoaded(false);
                        }
                    } else {
                        setIsError(true);
                        setIsLoaded(false);
                    }
                };

                img.src = resolvedUrl;

            } catch (err) {
                console.error('Error loading image:', err);
                setIsError(true);
                setIsLoaded(false);
            }
        };

        loadImage();
    }, [src, inView, useProxy]);

    return {
        ref,
        isLoaded,
        isError,
        imageSrc,
        isInView: inView,
    };
};

/**
 * Extract IPFS hash from various URL formats
 * @param {string} url - The URL to extract hash from
 * @returns {string|null} - The IPFS hash or null
 */
const extractIpfsHashFromUrl = (url) => {
    if (!url) return null;

    // Try to extract hash from various gateway URL formats
    const patterns = [
        /\/ipfs\/([a-zA-Z0-9]+)/, // Standard /ipfs/hash format
        /ipfs\.io\/ipfs\/([a-zA-Z0-9]+)/, // ipfs.io format
        /gateway\/([a-zA-Z0-9]+)/, // Custom gateway format
        /\/gateway\/([a-zA-Z0-9]+)/, // Another gateway format
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }

    return null;
}; 