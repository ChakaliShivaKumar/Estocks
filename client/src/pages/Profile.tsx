import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatsGrid } from "@/components/StatsGrid";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LeaderboardEntry, type LeaderboardUser } from "@/components/LeaderboardEntry";
import { Trophy, TrendingUp, Target, Award, Settings, LogOut } from "lucide-react";

const mockUser = {
  username: "TraderPro",
  email: "trader@example.com",
  joinDate: "Jan 2025",
};

const stats = [
  { label: "Contests Played", value: "47", icon: <Trophy className="h-4 w-4" /> },
  { label: "Win Rate", value: "68%", icon: <Target className="h-4 w-4" /> },
  { label: "Total ROI", value: "+32.5%", icon: <TrendingUp className="h-4 w-4" /> },
  { label: "Best Rank", value: "3rd", icon: <Award className="h-4 w-4" /> },
];

const recentPerformance: LeaderboardUser[] = [
  { rank: 1, userId: "1", username: "TraderPro", portfolioValue: 125000, roi: 25.4 },
  { rank: 3, userId: "1", username: "TraderPro", portfolioValue: 118000, roi: 18.2 },
  { rank: 12, userId: "1", username: "TraderPro", portfolioValue: 103500, roi: 3.5 },
];

export default function Profile() {
  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Profile</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" data-testid="button-settings">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {mockUser.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold" data-testid="text-username">
                {mockUser.username}
              </h2>
              <p className="text-sm text-muted-foreground">{mockUser.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Member since {mockUser.joinDate}
              </p>
            </div>
          </div>
          <Button variant="outline" className="w-full" data-testid="button-edit-profile">
            Edit Profile
          </Button>
        </Card>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Statistics</h3>
          <StatsGrid stats={stats} />
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Recent Performance</h3>
          <div className="flex flex-col gap-3">
            {recentPerformance.map((perf, index) => (
              <LeaderboardEntry key={index} user={perf} />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start" data-testid="button-transaction-history">
            Transaction History
          </Button>
          <Button variant="outline" className="w-full justify-start" data-testid="button-help">
            Help & Support
          </Button>
          <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive" data-testid="button-logout">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
