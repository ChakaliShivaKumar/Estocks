import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Trophy, Coins, Eye } from "lucide-react";
import { useLocation } from "wouter";

export interface Contest {
  id: string;
  name: string;
  entryFee: number;
  prizePool: number;
  participants: number;
  maxParticipants: number;
  timeRemaining: string;
  featured?: boolean;
  closingSoon?: boolean;
  description?: string;
}

interface ContestCardProps {
  contest: Contest;
  onJoin?: (contestId: string) => void;
}

export function ContestCard({ contest, onJoin }: ContestCardProps) {
  const [, setLocation] = useLocation();

  const handleViewContest = () => {
    setLocation(`/contests/${contest.id}`);
  };

  return (
    <Card className="p-4 hover-elevate" data-testid={`card-contest-${contest.id}`}>
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground">
              {contest.name}
            </h3>
            {contest.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {contest.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {contest.featured && (
                <Badge className="text-xs px-2 py-0.5" data-testid="badge-featured">
                  Featured
                </Badge>
              )}
              {contest.closingSoon && (
                <Badge variant="destructive" className="text-xs px-2 py-0.5" data-testid="badge-closing-soon">
                  Closing Soon
                </Badge>
              )}
            </div>
          </div>
          <Trophy className="h-5 w-5 text-primary flex-shrink-0" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Entry</div>
              <div className="text-sm font-bold tabular-nums" data-testid={`text-entry-fee-${contest.id}`}>
                {contest.entryFee.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Prize Pool</div>
              <div className="text-sm font-bold tabular-nums text-primary" data-testid={`text-prize-pool-${contest.id}`}>
                {contest.prizePool.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Participants</div>
              <div className="text-sm font-medium tabular-nums" data-testid={`text-participants-${contest.id}`}>
                {contest.participants}/{contest.maxParticipants}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Closes in</div>
              <div className="text-sm font-medium" data-testid={`text-time-remaining-${contest.id}`}>
                {contest.timeRemaining}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleViewContest}
            data-testid={`button-view-contest-${contest.id}`}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button
            className="flex-1"
            onClick={() => onJoin?.(contest.id)}
            data-testid={`button-join-contest-${contest.id}`}
          >
            Join Contest
          </Button>
        </div>
      </div>
    </Card>
  );
}
