import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/context/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoadingScreen from "@/components/LoadingScreen";

// Pages
import Index from "@/pages/Index";
import LoginPage from "@/pages/LoginPage";
import Dashboard from "@/pages/Dashboard";
import RecipientPage from "@/pages/RecipientPage";
import HoneypotPage from "@/pages/HoneypotPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

/**
 * Main Routes Component
 */
const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route path="/s/:token" element={<RecipientPage />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />

      {/* Security honeypot routes - trap unauthorized access attempts */}
      <Route path="/api/users" element={<HoneypotPage />} />
      <Route path="/api/admin/export" element={<HoneypotPage />} />
      <Route path="/api/backup" element={<HoneypotPage />} />
      <Route path="/admin" element={<HoneypotPage />} />
      <Route path="/api/*" element={<HoneypotPage />} />

      {/* Catch-all route - must be last */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

/**
 * Main App Component
 */
const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;

