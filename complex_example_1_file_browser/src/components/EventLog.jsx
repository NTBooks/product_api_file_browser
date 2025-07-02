import { useState } from "react";
import {
  Box,
  Fab,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Typography,
  IconButton,
  Chip,
  Paper,
  Divider,
  Alert,
  Button,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  Clear as ClearIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
} from "@mui/icons-material";
import { useEvents } from "../contexts/EventContext";

const EventLog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { events, isConnected, connectionError, clearEvents } = useEvents();

  const getEventColor = (eventType) => {
    switch (eventType) {
      case "file.uploaded":
        return "success";
      case "file.deleted":
        return "error";
      case "collection.stamped":
        return "warning";
      case "connection.established":
        return "info";
      default:
        return "default";
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case "file.uploaded":
        return "📁";
      case "file.deleted":
        return "🗑️";
      case "collection.stamped":
        return "🏷️";
      case "connection.established":
        return "🔗";
      default:
        return "📋";
    }
  };

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="event log"
        onClick={toggleDrawer}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}>
        <NotificationsIcon />
        {events.length > 0 && (
          <Chip
            label={events.length}
            size="small"
            color="secondary"
            sx={{
              position: "absolute",
              top: -8,
              right: -8,
              minWidth: 20,
              height: 20,
              fontSize: "0.75rem",
            }}
          />
        )}
      </Fab>

      {/* Event Log Drawer */}
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={toggleDrawer}
        PaperProps={{
          sx: {
            width: 400,
            maxWidth: "90vw",
          },
        }}>
        <Box
          sx={{
            p: 2,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}>
            <Typography variant="h6" component="h2">
              Event Log
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {isConnected ? (
                <Chip
                  icon={<WifiIcon />}
                  label="Connected"
                  color="success"
                  size="small"
                />
              ) : (
                <Chip
                  icon={<WifiOffIcon />}
                  label="Disconnected"
                  color="error"
                  size="small"
                />
              )}
              <IconButton onClick={toggleDrawer} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Connection Error Alert */}
          {connectionError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {connectionError}
            </Alert>
          )}

          {/* Clear Events Button */}
          {events.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Button
                startIcon={<ClearIcon />}
                onClick={clearEvents}
                variant="outlined"
                size="small"
                fullWidth>
                Clear Events
              </Button>
            </Box>
          )}

          {/* Events List */}
          <Paper
            sx={{
              flex: 1,
              overflow: "auto",
              bgcolor: "grey.50",
            }}>
            {events.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  p: 3,
                }}>
                <Typography variant="body2" color="text.secondary">
                  No events yet
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {events.map((event, index) => (
                  <Box key={`${event.id}-${index}`}>
                    <ListItem
                      sx={{
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        "&:last-child": {
                          borderBottom: "none",
                        },
                      }}>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1,
                            }}>
                            <span style={{ fontSize: "1.2rem" }}>
                              {getEventIcon(event.type)}
                            </span>
                            <Chip
                              label={event.type}
                              color={getEventColor(event.type)}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1 }}>
                              {formatTimestamp(event.timestamp)}
                            </Typography>
                            {event.data && (
                              <Box sx={{ mt: 1 }}>
                                {Object.entries(event.data).map(
                                  ([key, value]) => (
                                    <Typography
                                      key={key}
                                      variant="caption"
                                      component="div"
                                      sx={{ fontFamily: "monospace" }}>
                                      {key}:{" "}
                                      {typeof value === "object"
                                        ? JSON.stringify(value)
                                        : String(value)}
                                    </Typography>
                                  )
                                )}
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        </Box>
      </Drawer>
    </>
  );
};

export default EventLog;
