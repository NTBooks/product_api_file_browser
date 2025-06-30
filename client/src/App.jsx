import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
} from "@mui/material";
import { Folder, Dashboard } from "@mui/icons-material";
import DashboardPage from "./pages/DashboardPage";
import GroupsPage from "./pages/GroupsPage";
import FilesPage from "./pages/FilesPage";
import FileDetailPage from "./pages/FileDetailPage";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            File Browser
          </Typography>
          <Button
            color="inherit"
            startIcon={<Dashboard />}
            onClick={() => navigate("/")}
            sx={{
              backgroundColor: isActive("/")
                ? "rgba(255,255,255,0.1)"
                : "transparent",
              mr: 1,
            }}>
            Dashboard
          </Button>
          <Button
            color="inherit"
            startIcon={<Folder />}
            onClick={() => navigate("/groups")}
            sx={{
              backgroundColor: isActive("/groups")
                ? "rgba(255,255,255,0.1)"
                : "transparent",
            }}>
            Groups
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/files/:groupId" element={<FilesPage />} />
          <Route path="/file/:hash" element={<FileDetailPage />} />
        </Routes>
      </Container>
    </Box>
  );
}

export default App;
