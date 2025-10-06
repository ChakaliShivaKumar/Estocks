import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Star, Zap } from "lucide-react";

interface LevelProgressProps {
  level: number;
  experiencePoints: number;
  className?: string;
}

export function LevelProgress({ level, experiencePoints, className }: LevelProgressProps) {
  // Calculate XP for current and next level
  const calculateXPForLevel = (level: number) => Math.pow(level - 1, 2) * 100;
  const currentLevelXP = calculateXPForLevel(level);
  const nextLevelXP = calculateXPForLevel(level + 1);
  const progressXP = experiencePoints - currentLevelXP;
  const neededXP = nextLevelXP - currentLevelXP;
  const progressPercent = Math.min((progressXP / neededXP) * 100, 100);

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          <span className="font-semibold">Level {level}</span>
          <Badge variant="secondary" className="ml-2">
            <Zap className="h-3 w-3 mr-1" />
            {experiencePoints.toLocaleString()} XP
          </Badge>
        </div>
        <Badge variant="outline">
          {progressXP.toLocaleString()} / {neededXP.toLocaleString()} XP
        </Badge>
      </div>
      
      <Progress value={progressPercent} className="h-2" />
      
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>Level {level}</span>
        <span>Level {level + 1}</span>
      </div>
    </Card>
  );
}
