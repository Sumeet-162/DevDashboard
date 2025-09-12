import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/hooks/use-theme";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import NewsPage from "./pages/NewsPage";
import GitHubPage from "./pages/GitHubPage";
import GitHubCallbackPage from "./pages/GitHubCallbackPage";
import LeetCodePage from "./pages/LeetCodePage";
import ProfilePage from "./pages/ProfilePage";
import CommunityPage from "./pages/CommunityPage";
import PostDetailPage from "./pages/PostDetailPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import PasswordResetPage from "./pages/PasswordResetPage";
import AuthConfirmPage from "./pages/AuthConfirmPage";

// Import Productivity Pages
import TodoPage from "./pages/productivity/TodoPage";
import QuickNotesPage from "./pages/productivity/QuickNotesPage";
import PomodoroPage from "./pages/productivity/PomodoroPage";
import DevCalendarPage from "./pages/productivity/DevCalendarPage";
import JobReadyHub from "./pages/JobReadyHub";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="devdash-ui-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<PasswordResetPage />} />
            <Route path="/auth/confirm" element={<AuthConfirmPage />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/news" element={
              <ProtectedRoute>
                <NewsPage />
              </ProtectedRoute>
            } />
            <Route path="/github" element={
              <ProtectedRoute>
                <GitHubPage />
              </ProtectedRoute>
            } />
            <Route path="/auth/github/callback" element={
              <ProtectedRoute>
                <GitHubCallbackPage />
              </ProtectedRoute>
            } />
            <Route path="/leetcode" element={
              <ProtectedRoute>
                <LeetCodePage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/profile/:userId" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/community" element={
              <ProtectedRoute>
                <CommunityPage />
              </ProtectedRoute>
            } />
            <Route path="/community/post/:postId" element={
              <ProtectedRoute>
                <PostDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
            
            {/* Productivity Routes */}
            <Route path="/productivity/todo" element={
              <ProtectedRoute>
                <TodoPage />
              </ProtectedRoute>
            } />
            <Route path="/productivity/notes" element={
              <ProtectedRoute>
                <QuickNotesPage />
              </ProtectedRoute>
            } />
            <Route path="/productivity/pomodoro" element={
              <ProtectedRoute>
                <PomodoroPage />
              </ProtectedRoute>
            } />
            <Route path="/productivity/calendar" element={
              <ProtectedRoute>
                <DevCalendarPage />
              </ProtectedRoute>
            } />
            
            {/* Job Ready Hub */}
            <Route path="/job-ready" element={
              <ProtectedRoute>
                <JobReadyHub />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </ThemeProvider>
</QueryClientProvider>
);

export default App;
