import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getGroups,
    getFiles,
    getFileInfo,
    getGroupStats,
    uploadFile,
    deleteFile,
    stampCollection,
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