import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline, ThemeProvider } from '@mui/material';
import './i18n'; // Initialize i18n
import theme from './theme';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminManagementPage from './pages/AdminManagementPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import StatsPage from './pages/StatsPage';
import CitiesManagementPage from './pages/CitiesManagementPage';
import SystemSettingsPage from './pages/SystemSettingsPage';

const queryClient = new QueryClient();

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin-management"
              element={
                <PrivateRoute>
                  <AdminManagementPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile-settings"
              element={
                <PrivateRoute>
                  <ProfileSettingsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/stats"
              element={
                <PrivateRoute>
                  <StatsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/cities"
              element={
                <PrivateRoute>
                  <CitiesManagementPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/system-settings"
              element={
                <PrivateRoute>
                  <SystemSettingsPage />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
