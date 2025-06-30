import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
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

// Create a client
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
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <QueryClientProvider client={queryClient}>
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
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
