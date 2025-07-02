import { createContext, useContext, useReducer, useEffect } from "react";
import { getCredentialsInfo } from "../services/api";

const EventContext = createContext();

// Event types that we're interested in
const EVENT_TYPES = {
  FILE_UPLOADED: "file.uploaded",
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

  // Connect to SSE stream
  const connectToEventStream = async () => {
    try {
      // Get API key from credentials using the existing API service
      const credentials = await getCredentialsInfo();
      if (!credentials.success || !credentials.apikey) {
        throw new Error("No credentials found");
      }

      console.log(
        "Connecting to event stream with API key:",
        credentials.apikey
      );
      const eventSource = new EventSource(`/api/webhook/events/stream`);

      eventSource.onopen = () => {
        dispatch({
          type: "SET_CONNECTION_STATUS",
          payload: { isConnected: true, error: null },
        });
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

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
          }
        } catch (error) {
          console.error("Error parsing SSE event:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE connection error:", error);
        dispatch({
          type: "SET_CONNECTION_STATUS",
          payload: { isConnected: false, error: "Connection failed" },
        });
        eventSource.close();
      };

      return eventSource;
    } catch (error) {
      console.error("Failed to connect to event stream:", error);
      dispatch({
        type: "SET_CONNECTION_STATUS",
        payload: { isConnected: false, error: error.message },
      });
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
      if (eventSource) {
        eventSource.close();
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
