import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BottomNav } from "@/components/BottomNav";
import Market from "@/pages/Market";
import Portfolio from "@/pages/Portfolio";
import Contests from "@/pages/Contests";
import Profile from "@/pages/Profile";
import Leaderboard from "@/pages/Leaderboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <main className="flex-1 overflow-hidden">
        <Switch>
          <Route path="/" component={Market} />
          <Route path="/portfolio" component={Portfolio} />
          <Route path="/contests" component={Contests} />
          <Route path="/profile" component={Profile} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
