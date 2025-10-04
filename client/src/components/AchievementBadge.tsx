import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Trophy, Star, Target, Users, Zap, Crown, Medal } from "lucide-react";

interface AchievementBadgeProps {
  achievement: {
    id: string;
    name: string;
    description: string;
    icon?: string;
    category: string;
    rarity: string;
  };
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

const rarityColors = {
  common: "bg-gray-500",
  rare: "bg-blue-500", 
  epic: "bg-purple-500",
  legendary: "bg-yellow-500"
};

const rarityBorders = {
  common: "border-gray-400",
  rare: "border-blue-400",
  epic: "border-purple-400", 
  legendary: "border-yellow-400"
};

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8"
};

const iconMap = {
  trophy: Trophy,
  star: Star,
  target: Target,
  users: Users,
  zap: Zap,
  crown: Crown,
  medal: Medal
};

export function AchievementBadge({ achievement, size = "md", showTooltip = true }: AchievementBadgeProps) {
  const IconComponent = iconMap[achievement.icon as keyof typeof iconMap] || Trophy;
  
  const BadgeComponent = (
    <div 
      className={`
        ${sizeClasses[size]} 
        ${rarityColors[achievement.rarity as keyof typeof rarityColors]} 
        ${rarityBorders[achievement.rarity as keyof typeof rarityBorders]}
        rounded-full border-2 flex items-center justify-center text-white shadow-lg
        hover:scale-110 transition-transform duration-200 cursor-pointer
      `}
    >
      <IconComponent className={`${size === "sm" ? "h-2 w-2" : size === "md" ? "h-3 w-3" : "h-4 w-4"}`} />
    </div>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {BadgeComponent}
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <div className="font-semibold text-sm">{achievement.name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {achievement.description}
              </div>
              <Badge 
                variant="secondary" 
                className={`mt-2 ${rarityColors[achievement.rarity as keyof typeof rarityColors]} text-white`}
              >
                {achievement.rarity}
              </Badge>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return BadgeComponent;
}
