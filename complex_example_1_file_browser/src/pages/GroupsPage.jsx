import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
} from "@mui/material";
import {
  Folder,
  Refresh,
  CalendarToday,
  Person,
  Add,
  InsertDriveFile,
  CheckCircle,
  Warning,
} from "@mui/icons-material";
import { useGroups } from "../hooks/useApi";
import { createGroup } from "../services/api";
import {
  flexSpaceBetween,
  flexCenterVertical,
  flexGap,
  flexGapWrap,
  flexCenter,
  iconWithMargin,
  iconSecondary,
  marginBottom,
  marginTop,
  loadingContainer,
  errorContainer,
  cardFullHeight,
  textWithMargin,
  textSecondary,
  buttonWithMargin,
  alertWithMargin,
  fullWidth,
} from "../utils/commonStyles";

const GroupsPage = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", network: "public" });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const navigate = useNavigate();

  // Use React Query hook for fetching groups
  const { data: groupsData, isLoading, error, refetch } = useGroups();

  const groups = groupsData?.groups || [];

  const handleCreateGroup = async () => {
    try {
      const response = await createGroup(newGroup.name, newGroup.network);
      if (response.success) {
        setCreateDialogOpen(false);
        setNewGroup({ name: "", network: "public" });
        // Refetch groups to show the new group
        refetch();
        setSnackbar({
          open: true,
          message: "Group created successfully!",
          severity: "success",
        });
      }
    } catch (err) {
      console.error("Error creating group:", err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to create group",
        severity: "error",
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getNetworkColor = (network) => {
    return network === "public" ? "primary" : "secondary";
  };

  const GroupCard = ({ group }) => {
    return (
      <Card
        sx={{
          ...cardFullHeight,
          cursor: "pointer",
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: 4,
          },
        }}
        onClick={() => navigate(`/files/${group.id}`)}>
        <CardContent>
          <Box sx={{ ...flexCenterVertical, ...marginBottom(2) }}>
            <Folder color="primary" sx={iconWithMargin(40, 2)} />
            <Box flex={1}>
              <Typography variant="h6" component="div" noWrap>
                {group.name}
              </Typography>
              <Typography variant="body2" sx={textSecondary}>
                ID: {group.id}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ ...flexCenterVertical, ...marginBottom(1) }}>
            <Person sx={iconSecondary(16, 1)} />
            <Typography variant="body2" sx={textSecondary}>
              {group.user_id}
            </Typography>
          </Box>

          <Box sx={{ ...flexCenterVertical, ...marginBottom(2) }}>
            <CalendarToday sx={iconSecondary(16, 1)} />
            <Typography variant="body2" sx={textSecondary}>
              Created: {formatDate(group.createdAt)}
            </Typography>
          </Box>

          <Box sx={flexGapWrap(1)}>
            <Chip
              label={group.network}
              color={getNetworkColor(group.network)}
              size="small"
            />
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Box sx={{ ...flexSpaceBetween, ...marginBottom(3) }}>
        <Typography variant="h4">Groups</Typography>
        <Box sx={flexGap(2)}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => refetch()}
            disabled={isLoading}>
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}>
            Create Group
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={errorContainer}>
          {error.message || "Failed to fetch groups"}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={loadingContainer}>
          <CircularProgress />
        </Box>
      ) : groups.length > 0 ? (
        <Grid container spacing={3}>
          {groups.map((group) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={group.id}>
              <GroupCard group={group} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Alert severity="info">
          No groups found. Create a group to get started.
        </Alert>
      )}

      {/* Create Group Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth>
        <DialogTitle>Create New Group</DialogTitle>
        <DialogContent>
          <Box sx={marginTop(2)}>
            <TextField
              fullWidth
              label="Group Name"
              value={newGroup.name}
              onChange={(e) =>
                setNewGroup({ ...newGroup, name: e.target.value })
              }
              sx={marginBottom(2)}
            />
            <FormControl fullWidth>
              <InputLabel>Network</InputLabel>
              <Select
                value={newGroup.network}
                label="Network"
                onChange={(e) =>
                  setNewGroup({ ...newGroup, network: e.target.value })
                }>
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="private">Private</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateGroup}
            variant="contained"
            disabled={!newGroup.name.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={fullWidth}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GroupsPage;
