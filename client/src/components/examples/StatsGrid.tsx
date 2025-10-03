import { StatsGrid } from "../StatsGrid";
import { Trophy, TrendingUp, Target, Award } from "lucide-react";

export default function StatsGridExample() {
  const stats = [
    { label: "Contests Played", value: 47, icon: <Trophy className="h-4 w-4" /> },
    { label: "Win Rate", value: "68%", icon: <Target className="h-4 w-4" /> },
    { label: "Total ROI", value: "+32.5%", icon: <TrendingUp className="h-4 w-4" /> },
    { label: "Best Rank", value: "3rd", icon: <Award className="h-4 w-4" /> },
  ];

  return (
    <div className="p-4 max-w-md">
      <StatsGrid stats={stats} />
    </div>
  );
}
