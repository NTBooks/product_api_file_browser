import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

/**
 * Custom hook for lazy loading images with intersection observer
 * @param {string} src - The image source URL
 * @param {Object} options - Intersection observer options
 * @returns {Object} - { ref, src, isLoaded, isError, isInView }
 */
export const useLazyImage = (src, options = {}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isError, setIsError] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);

    const { ref, inView } = useInView({
        triggerOnce: true, // Only trigger once when image comes into view
        threshold: 0.1, // Trigger when 10% of the image is visible
        rootMargin: '50px', // Start loading 50px before the image comes into view
        ...options,
    });

    useEffect(() => {
        if (inView && src && !imageSrc) {
            setImageSrc(src);
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

        img.addEventListener('load', handleLoad);
        img.addEventListener('error', handleError);

        img.src = imageSrc;

        return () => {
            img.removeEventListener('load', handleLoad);
            img.removeEventListener('error', handleError);
        };
    }, [imageSrc]);

    return {
        ref,
        src: imageSrc,
        isLoaded,
        isError,
        isInView: inView,
    };
}; 