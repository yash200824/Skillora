import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard";
import { NotificationProvider } from "./context/notification-context";

// Trainer Pages
import TrainerOpportunities from "@/pages/trainer/opportunities";
import TrainerApplications from "@/pages/trainer/applications";
import TrainerContracts from "@/pages/trainer/contracts";
import TrainerProfile from "@/pages/trainer/profile";

// College Pages
import CollegeRequirements from "@/pages/college/requirements";
import CollegeApplications from "@/pages/college/applications";
import CollegeCreateRequirement from "@/pages/college/create-requirement";
import CollegeContracts from "@/pages/college/contracts";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminTrainers from "@/pages/admin/trainers";
import AdminColleges from "@/pages/admin/colleges";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected Routes */}
      <ProtectedRoute path="/" component={DashboardPage} />
      
      {/* Trainer Routes */}
      <ProtectedRoute path="/opportunities" component={TrainerOpportunities} />
      <ProtectedRoute path="/applications" component={TrainerApplications} />
      <ProtectedRoute path="/contracts" component={TrainerContracts} />
      <ProtectedRoute path="/profile" component={TrainerProfile} />
      
      {/* College Routes */}
      <ProtectedRoute path="/requirements" component={CollegeRequirements} />
      <ProtectedRoute path="/college/applications" component={CollegeApplications} />
      <ProtectedRoute path="/create-requirement" component={CollegeCreateRequirement} />
      <ProtectedRoute path="/college/contracts" component={CollegeContracts} />
      
      {/* Admin Routes */}
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/admin/trainers" component={AdminTrainers} />
      <ProtectedRoute path="/admin/colleges" component={AdminColleges} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
