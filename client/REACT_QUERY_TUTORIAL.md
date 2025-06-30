# React Query Tutorial: Modern Data Fetching

This tutorial demonstrates how to implement **React Query (TanStack Query)** in a React application for efficient data fetching, caching, and state management.

## Why React Query?

### Problems with Traditional `fetch` + `useEffect`:

- ❌ No caching - refetches data on every component mount
- ❌ Manual loading/error state management
- ❌ No background updates
- ❌ Difficult to handle optimistic updates
- ❌ No automatic retry logic
- ❌ Complex state synchronization between components

### Benefits of React Query:

- ✅ **Automatic Caching** - Data is cached and shared between components
- ✅ **Background Updates** - Keeps data fresh without blocking UI
- ✅ **Optimistic Updates** - Immediate UI feedback for mutations
- ✅ **Automatic Retries** - Built-in error handling and retry logic
- ✅ **Loading States** - Built-in loading, error, and success states
- ✅ **Query Invalidation** - Smart cache invalidation after mutations
- ✅ **DevTools** - Excellent debugging experience

## Implementation Overview

### 1. Setup React Query Provider

```jsx
// App.jsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app components */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 2. Custom Hooks for Data Fetching

```jsx
// hooks/useApi.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

// Custom hook for mutations
export const useUploadFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, groupId }) => uploadFile(file, groupId),
    onSuccess: (data, variables) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.files(variables.groupId),
      });
    },
  });
};
```

### 3. Using Hooks in Components

#### Before (Traditional approach):

```jsx
const GroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await getGroups();
      setGroups(response.groups);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Manual state management...
};
```

#### After (React Query):

```jsx
const GroupsPage = () => {
  const { data: groupsData, isLoading, error, refetch } = useGroups();
  const groups = groupsData?.groups || [];

  // React Query handles all the state management!
  return (
    <div>
      {isLoading && <CircularProgress />}
      {error && <Alert severity="error">{error.message}</Alert>}
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  );
};
```

## Key Concepts

### 1. Query Keys

Query keys are used to identify and cache queries. They should be:

- **Consistent** - Same key for same data
- **Unique** - Different keys for different data
- **Serializable** - Can be converted to JSON

```jsx
// Good query keys
["groups"][("files", "group-123")][("file", "hash-abc")][ // All groups // Files in specific group // Specific file
  ("groupStats", "group-123")
]; // Stats for specific group
```

### 2. Stale Time vs Cache Time

- **Stale Time**: How long data is considered fresh (no refetch)
- **Cache Time**: How long data stays in cache after component unmounts

```jsx
useQuery({
  queryKey: ["groups"],
  queryFn: getGroups,
  staleTime: 2 * 60 * 1000, // 2 minutes - data fresh for 2 minutes
  cacheTime: 5 * 60 * 1000, // 5 minutes - cache kept for 5 minutes
});
```

### 3. Mutations with Cache Invalidation

```jsx
const uploadMutation = useMutation({
  mutationFn: uploadFile,
  onSuccess: (data, variables) => {
    // Invalidate related queries to refetch fresh data
    queryClient.invalidateQueries({
      queryKey: ["files", variables.groupId],
    });
  },
});
```

### 4. Optimistic Updates

```jsx
const deleteMutation = useMutation({
  mutationFn: deleteFile,
  onMutate: async (variables) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(["files", variables.groupId]);

    // Snapshot previous value
    const previousFiles = queryClient.getQueryData([
      "files",
      variables.groupId,
    ]);

    // Optimistically update
    queryClient.setQueryData(["files", variables.groupId], (old) =>
      old.filter((file) => file.hash !== variables.fileHash)
    );

    return { previousFiles };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(
      ["files", variables.groupId],
      context.previousFiles
    );
  },
});
```

## Best Practices

### 1. Custom Hooks

Always create custom hooks for your queries and mutations:

```jsx
// ✅ Good
export const useGroups = () => useQuery({...});

// ❌ Bad - Don't use useQuery directly in components
const { data } = useQuery({ queryKey: ["groups"], queryFn: getGroups });
```

### 2. Error Handling

```jsx
const { data, error, isError } = useQuery({
  queryKey: ["groups"],
  queryFn: getGroups,
  retry: (failureCount, error) => {
    // Custom retry logic
    if (error.status === 404) return false; // Don't retry 404s
    return failureCount < 3; // Retry up to 3 times
  },
});
```

### 3. Loading States

```jsx
const { data, isLoading, isFetching, isError } = useQuery({...});

// isLoading: true only on first load
// isFetching: true on any fetch (including background updates)
// isError: true when query fails
```

### 4. Dependent Queries

```jsx
const { data: user } = useQuery({
  queryKey: ["user", userId],
  queryFn: () => getUser(userId),
  enabled: !!userId, // Only run if userId exists
});

const { data: userPosts } = useQuery({
  queryKey: ["posts", userId],
  queryFn: () => getUserPosts(userId),
  enabled: !!user, // Only run if user data is available
});
```

## Performance Benefits

1. **Reduced Network Requests**: Data is cached and shared
2. **Better UX**: Instant loading for cached data
3. **Background Updates**: Data stays fresh without blocking UI
4. **Optimistic Updates**: Immediate feedback for user actions
5. **Automatic Retries**: Better error handling

## DevTools

React Query includes excellent DevTools for debugging:

- View all queries and their states
- Inspect cache data
- Manually invalidate queries
- Monitor background updates

## Migration Guide

To migrate from `fetch` + `useEffect`:

1. **Install React Query**: `npm install @tanstack/react-query`
2. **Add Provider**: Wrap your app with `QueryClientProvider`
3. **Create Custom Hooks**: Move API calls to custom hooks
4. **Replace State Management**: Remove manual loading/error states
5. **Add Cache Invalidation**: Invalidate related queries after mutations
6. **Test and Optimize**: Adjust stale times and cache times

## Conclusion

React Query transforms how you handle server state in React applications. It eliminates the need for manual loading states, provides automatic caching, and makes data fetching more predictable and performant.

The key benefits for this tutorial:

- **Simplified Code**: Less boilerplate, more readable
- **Better Performance**: Automatic caching and background updates
- **Improved UX**: Instant loading and optimistic updates
- **Better Error Handling**: Built-in retry logic and error states
- **Developer Experience**: Excellent DevTools and TypeScript support
