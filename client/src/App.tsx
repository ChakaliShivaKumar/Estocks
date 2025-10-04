import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ContestProvider } from "@/contexts/ContestContext";
import { BottomNav } from "@/components/BottomNav";
import Home from "@/pages/Home";
import Market from "@/pages/Market";
import Portfolio from "@/pages/Portfolio";
import Contests from "@/pages/Contests";
import Profile from "@/pages/Profile";
import Leaderboard from "@/pages/Leaderboard";
import Admin from "@/pages/Admin";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <main className="flex-1 overflow-hidden">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/market" component={Market} />
          <Route path="/portfolio" component={Portfolio} />
          <Route path="/contests" component={Contests} />
          <Route path="/profile" component={Profile} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/admin" component={Admin} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <BottomNav />
    </div>
  );
}

function UnauthenticatedApp() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route component={Login} />
    </Switch>
  );
}

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return user ? <AuthenticatedApp /> : <UnauthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <AuthProvider>
            <ContestProvider>
              <Router />
              <Toaster />
            </ContestProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
