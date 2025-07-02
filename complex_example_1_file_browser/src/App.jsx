import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import FolderIcon from "@mui/icons-material/Folder";
import DashboardIcon from "@mui/icons-material/Dashboard";
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
      retry: (failureCount, error) => {
        // Don't retry on 302 redirects - they should be handled by the browser
        if (error?.response?.status === 302) {
          return false;
        }
        return failureCount < 1; // Only retry once for other errors
      },
      refetchOnWindowFocus: false,
      // Handle redirects properly
      networkMode: "online",
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry on 302 redirects
        if (error?.response?.status === 302) {
          return false;
        }
        return failureCount < 1;
      },
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
              startIcon={<DashboardIcon />}
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
              startIcon={<FolderIcon />}
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
