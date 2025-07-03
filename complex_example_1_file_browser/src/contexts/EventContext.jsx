import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
} from "react";
import { getCredentialsInfo } from "../services/api";

const EventContext = createContext();

// Event types that we're interested in
const EVENT_TYPES = {
  FILE_UPLOADED: "file.uploaded",
  FILE_PINNED: "file.pinned",
  FILE_DELETED: "file.deleted",
  COLLECTION_STAMPED: "collection.stamped",
  CONNECTION_ESTABLISHED: "connection.established",
};

// Initial state
const initialState = {
  events: [],
  isConnected: false,
  connectionError: null,
  pendingUploads: new Set(), // Track files waiting for IPFS confirmation
};

// Reducer for managing event state
const eventReducer = (state, action) => {
  switch (action.type) {
    case "ADD_EVENT":
      // Check for duplicate events based on id, type, timestamp, and hash
      const isDuplicate = state.events.some((existingEvent) => {
        // For file events, check hash and timestamp
        if (
          (action.payload.type === "file.uploaded" &&
            existingEvent.type === "file.uploaded") ||
          (action.payload.type === "file.pinned" &&
            existingEvent.type === "file.pinned")
        ) {
          return (
            existingEvent.data?.hash === action.payload.data?.hash &&
            existingEvent.timestamp === action.payload.timestamp
          );
        }
        // For connection events, check timestamp and message
        if (
          action.payload.type === "connection.established" &&
          existingEvent.type === "connection.established"
        ) {
          return (
            existingEvent.timestamp === action.payload.timestamp &&
            existingEvent.data?.message === action.payload.data?.message
          );
        }
        // For other events, check id and timestamp
        return (
          existingEvent.id === action.payload.id &&
          existingEvent.timestamp === action.payload.timestamp
        );
      });

      if (isDuplicate) {
        console.log("Duplicate event detected, skipping:", action.payload);
        return state;
      }

      return {
        ...state,
        events: [action.payload, ...state.events].slice(0, 100), // Keep last 100 events
      };

    case "SET_CONNECTION_STATUS":
      return {
        ...state,
        isConnected: action.payload.isConnected,
        connectionError: action.payload.error || null,
      };

    case "ADD_PENDING_UPLOAD":
      return {
        ...state,
        pendingUploads: new Set([...state.pendingUploads, action.payload]),
      };

    case "REMOVE_PENDING_UPLOAD":
      const newPendingUploads = new Set(state.pendingUploads);
      newPendingUploads.delete(action.payload);
      return {
        ...state,
        pendingUploads: newPendingUploads,
      };

    case "CLEAR_EVENTS":
      return {
        ...state,
        events: [],
      };

    default:
      return state;
  }
};

export const EventProvider = ({ children }) => {
  const [state, dispatch] = useReducer(eventReducer, initialState);
  const eventSourceRef = useRef(null);

  // Connect to SSE stream
  const connectToEventStream = async () => {
    // Prevent multiple connections
    if (eventSourceRef.current) {
      console.log("EventSource already exists, skipping connection");
      return eventSourceRef.current;
    }

    try {
      // Get API key from credentials using the existing API service
      const credentials = await getCredentialsInfo();
      console.log("Credentials response:", credentials);

      if (!credentials.success || !credentials.data?.apikey) {
        console.log("Credentials check failed:", {
          success: credentials.success,
          hasData: !!credentials.data,
          hasApikey: !!credentials.data?.apikey,
          message: credentials.message,
        });
        throw new Error("No credentials found");
      }

      console.log(
        "Connecting to event stream with API key:",
        credentials.data.apikey
      );
      console.log("EventSource URL:", `/api/webhook/events/stream`);

      // Wrap EventSource creation in try-catch to handle connection errors
      let eventSource;
      try {
        eventSource = new EventSource(`/api/webhook/events/stream`);
      } catch (error) {
        console.error("Failed to create EventSource:", error);
        dispatch({
          type: "SET_CONNECTION_STATUS",
          payload: {
            isConnected: false,
            error: "Failed to create connection",
          },
        });
        return null;
      }

      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("EventSource connection opened successfully");
        dispatch({
          type: "SET_CONNECTION_STATUS",
          payload: { isConnected: true, error: null },
        });
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received SSE event:", data); // Debug log

          // Add event to state
          dispatch({
            type: "ADD_EVENT",
            payload: {
              ...data,
              receivedAt: new Date().toISOString(),
            },
          });

          // Handle specific event types
          if (data.type === EVENT_TYPES.FILE_UPLOADED) {
            // Remove from pending uploads when file is confirmed uploaded to IPFS
            if (data.data && data.data.hash) {
              dispatch({
                type: "REMOVE_PENDING_UPLOAD",
                payload: data.data.hash,
              });
            }
          } else if (data.type === EVENT_TYPES.FILE_PINNED) {
            // Remove from pending uploads when file is pinned and ready for display
            if (data.data && data.data.hash) {
              dispatch({
                type: "REMOVE_PENDING_UPLOAD",
                payload: data.data.hash,
              });
            }
          }
        } catch (error) {
          console.error("Error parsing SSE event:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE connection error:", error);
        console.error("EventSource readyState:", eventSource.readyState);
        console.error("EventSource URL:", eventSource.url);

        // Check if this is a connection failure that should trigger a retry
        const shouldRetry =
          eventSource.readyState === EventSource.CLOSED ||
          eventSource.readyState === EventSource.CONNECTING;

        // Check for specific proxy connection error
        const isProxyError =
          error.message &&
          error.message.includes("Receiving end does not exist");

        dispatch({
          type: "SET_CONNECTION_STATUS",
          payload: {
            isConnected: false,
            error: isProxyError
              ? "Receiving end does not exist"
              : shouldRetry
              ? "Connection failed, retrying..."
              : "Connection failed",
          },
        });

        eventSource.close();
        eventSourceRef.current = null;

        // Don't retry if it's a proxy error - just log it and continue
        if (isProxyError) {
          console.log(
            "Proxy server not available, EventSource connection failed"
          );
          return;
        }

        // If it's a connection failure, retry after a delay
        if (shouldRetry) {
          setTimeout(() => {
            console.log("Retrying SSE connection...");
            connectToEventStream();
          }, 5000); // Retry after 5 seconds
        }
      };

      return eventSource;
    } catch (error) {
      console.error("Failed to connect to event stream:", error);
      dispatch({
        type: "SET_CONNECTION_STATUS",
        payload: { isConnected: false, error: error.message },
      });
      eventSourceRef.current = null;
    }
  };

  // Add a file to pending uploads
  const addPendingUpload = (fileHash) => {
    dispatch({
      type: "ADD_PENDING_UPLOAD",
      payload: fileHash,
    });
  };

  // Check if a file is pending upload
  const isPendingUpload = (fileHash) => {
    return state.pendingUploads.has(fileHash);
  };

  // Clear all events
  const clearEvents = () => {
    dispatch({ type: "CLEAR_EVENTS" });
  };

  // Connect to event stream on mount
  useEffect(() => {
    let eventSource;
    let retryTimeout;

    const initConnection = async () => {
      try {
        eventSource = await connectToEventStream();
        // If connection failed (returned null), retry after 5 seconds
        if (!eventSource) {
          retryTimeout = setTimeout(initConnection, 5000);
        }
      } catch (error) {
        console.log("Failed to connect to event stream:", error.message);
        // Retry after 5 seconds if no credentials
        if (error.message === "No credentials found") {
          retryTimeout = setTimeout(initConnection, 5000);
        }
      }
    };

    initConnection();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, []);

  const value = {
    events: state.events,
    isConnected: state.isConnected,
    connectionError: state.connectionError,
    pendingUploads: Array.from(state.pendingUploads),
    addPendingUpload,
    isPendingUpload,
    clearEvents,
    connectToEventStream,
  };

  return (
    <EventContext.Provider value={value}>{children}</EventContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEvents must be used within an EventProvider");
  }
  return context;
};
