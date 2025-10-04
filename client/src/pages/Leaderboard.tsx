import { EnhancedLeaderboard } from "@/components/EnhancedLeaderboard";
import { SocialFeatures } from "@/components/SocialFeatures";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, ArrowLeft, Users, BarChart3 } from "lucide-react";
import { useState } from "react";
import { useContest } from "@/contexts/ContestContext";
import { useLocation } from "wouter";

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "social">("leaderboard");
  const { selectedContest } = useContest();
  const [, setLocation] = useLocation();
  if (!selectedContest) {
    return (
      <div className="flex flex-col h-full justify-center">
        <div className="text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Contest Selected</h2>
          <p className="text-muted-foreground mb-4">Select a contest to view the leaderboard</p>
          <Button onClick={() => setLocation('/contests')}>
            Browse Contests
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation('/contests')}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Leaderboard</h1>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={activeTab === "leaderboard" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("leaderboard")}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Leaderboard
          </Button>
          <Button
            variant={activeTab === "social" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("social")}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Social
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {activeTab === "leaderboard" ? (
          <EnhancedLeaderboard contestId={selectedContest.id} />
        ) : (
          <SocialFeatures />
        )}
      </div>
    </div>
  );
}
