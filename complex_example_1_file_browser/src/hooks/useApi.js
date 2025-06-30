import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getGroups,
    getFiles,
    getFileInfo,
    getGroupStats,
    uploadFile,
    deleteFile,
    stampCollection,
    proxyContent,
} from "../services/api";

// Query keys for consistent caching
export const queryKeys = {
    groups: ["groups"],
    files: (groupId) => ["files", groupId],
    fileInfo: (hash) => ["file", hash],
    groupStats: (groupId) => ["groupStats", groupId],
};

// Custom hook for fetching groups
export const useGroups = () => {
    return useQuery({
        queryKey: queryKeys.groups,
        queryFn: getGroups,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

// Custom hook for fetching files in a group
export const useFiles = (groupId) => {
    return useQuery({
        queryKey: queryKeys.files(groupId),
        queryFn: () => getFiles(groupId),
        enabled: !!groupId, // Only run if groupId is provided
        staleTime: 1 * 60 * 1000, // 1 minute
    });
};

// Custom hook for fetching file details
export const useFileInfo = (hash) => {
    return useQuery({
        queryKey: queryKeys.fileInfo(hash),
        queryFn: () => getFileInfo(hash),
        enabled: !!hash, // Only run if hash is provided
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

// Custom hook for fetching group statistics
export const useGroupStats = (groupId) => {
    return useQuery({
        queryKey: queryKeys.groupStats(groupId),
        queryFn: () => getGroupStats(groupId),
        enabled: !!groupId, // Only run if groupId is provided
        staleTime: 30 * 1000, // 30 seconds
    });
};

// Custom hook for uploading files
export const useUploadFile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ file, groupId }) => uploadFile(file, groupId),
        onSuccess: (data, variables) => {
            // Invalidate and refetch files for the specific group
            queryClient.invalidateQueries({
                queryKey: queryKeys.files(variables.groupId),
            });
            // Also invalidate group stats
            queryClient.invalidateQueries({
                queryKey: queryKeys.groupStats(variables.groupId),
            });
        },
        onError: (error) => {
            console.error("Upload failed:", error);
        },
    });
};

// Custom hook for deleting files
export const useDeleteFile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ fileHash, groupId }) => deleteFile(fileHash, groupId),
        onSuccess: (data, variables) => {
            // Invalidate and refetch files for the specific group
            queryClient.invalidateQueries({
                queryKey: queryKeys.files(variables.groupId),
            });
            // Also invalidate group stats
            queryClient.invalidateQueries({
                queryKey: queryKeys.groupStats(variables.groupId),
            });
        },
        onError: (error) => {
            console.error("Delete failed:", error);
        },
    });
};

// Custom hook for stamping collections
export const useStampCollection = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (groupId) => stampCollection(groupId),
        onSuccess: (data, groupId) => {
            // Invalidate and refetch files for the specific group
            queryClient.invalidateQueries({
                queryKey: queryKeys.files(groupId),
            });
            // Also invalidate group stats
            queryClient.invalidateQueries({
                queryKey: queryKeys.groupStats(groupId),
            });
        },
        onError: (error) => {
            console.error("Stamping failed:", error);
        },
    });
};

// Hook for fetching JSON content
export const useJsonContent = (fileInfo) => {
    return useQuery({
        queryKey: ['jsonContent', fileInfo?.gatewayurl],
        queryFn: async () => {
            if (!fileInfo?.gatewayurl) {
                throw new Error('No gateway URL provided');
            }

            console.log('Fetching JSON content via React Query:', fileInfo.gatewayurl);
            const response = await proxyContent(fileInfo.gatewayurl);
            console.log('JSON response received, length:', response.length);

            // Parse the JSON and return it
            const parsed = JSON.parse(response);
            console.log('JSON parsed successfully');
            return parsed;
        },
        enabled: !!fileInfo?.gatewayurl && isJsonFile(fileInfo.name),
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
        retry: 2, // Retry up to 2 times on failure
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    });
};

// Helper function to check if file is JSON
const isJsonFile = (fileName) => {
    if (!fileName) return false;
    const extension = fileName.split(".").pop()?.toLowerCase();
    return extension === "json";
}; 