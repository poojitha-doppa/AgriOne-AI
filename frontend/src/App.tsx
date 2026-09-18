import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import CropAssistant from "./pages/CropAssistant";
import SchemeFinder from "./pages/SchemeFinder";
import News from "./pages/News";
import AIAssistant from "./pages/AIAssistant";
import NotFound from "./pages/NotFound";
import SchemeResults from "./pages/SchemeResults";
import AdminDashboard from "./pages/AdminDashboard";
import GuestPreview from "./pages/GuestPreview";
import FloatingAssistant from "@/components/FloatingAssistant";

const queryClient = new QueryClient();

// Renders children only after auth state is resolved; redirects unauthenticated users to /login
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f6fff8] to-[#eef7f0]">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <I18nProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/preview" element={<GuestPreview />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assistant"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <CropAssistant />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/schemes"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <SchemeFinder />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/scheme-results"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <SchemeResults />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/news"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <News />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai-assistant"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <AIAssistant />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <AdminDashboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <FloatingAssistant />
          </BrowserRouter>
        </AuthProvider>
      </I18nProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
