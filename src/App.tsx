import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { FamilyProvider } from "@/contexts/FamilyContext";
import { VitalsProvider } from "@/contexts/VitalsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Reports from "./pages/Reports";
import DoctorNotes from "./pages/DoctorNotes";
import Appointments from "./pages/Appointments";
import Reminders from "./pages/Reminders";

import ActivityLogs from "./pages/ActivityLogs";
import Chatbot from "./pages/Chatbot";
import NotFound from "./pages/NotFound";

// Layout
import { AppLayout } from "./components/layout/AppLayout";

const queryClient = new QueryClient();

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public route - redirect to dashboard if logged in
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Placeholder pages for now
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh]">
    <h1 className="text-2xl font-bold mb-2">{title}</h1>
    <p className="text-muted-foreground">Coming soon...</p>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <FamilyProvider>
          <VitalsProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
                  <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                  <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                  <Route path="/about" element={<About />} />

                  {/* Protected routes with app layout */}
                  <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/doctor-notes" element={<DoctorNotes />} />
                    <Route path="/appointments" element={<Appointments />} />
                    <Route path="/reminders" element={<Reminders />} />

                    <Route path="/reports" element={<Reports />} />
                    <Route path="/chatbot" element={<Chatbot />} />
                    <Route path="/activity" element={<ActivityLogs />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </VitalsProvider>
        </FamilyProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
