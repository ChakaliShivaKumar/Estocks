import { ContestCard, type Contest } from "@/components/ContestCard";
import { CoinBalance } from "@/components/CoinBalance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap } from "lucide-react";

const mockContests: Contest[] = [
  {
    id: "1",
    name: "Daily Tech Titans",
    entryFee: 500,
    prizePool: 50000,
    participants: 847,
    maxParticipants: 1000,
    timeRemaining: "4h 23m",
    featured: true,
  },
  {
    id: "2",
    name: "Banking Bonanza",
    entryFee: 1000,
    prizePool: 100000,
    participants: 456,
    maxParticipants: 500,
    timeRemaining: "1h 15m",
    closingSoon: true,
  },
  {
    id: "3",
    name: "Weekly Winners",
    entryFee: 2000,
    prizePool: 500000,
    participants: 1234,
    maxParticipants: 2000,
    timeRemaining: "3d 12h",
  },
  {
    id: "4",
    name: "Pharma Power Play",
    entryFee: 750,
    prizePool: 75000,
    participants: 623,
    maxParticipants: 800,
    timeRemaining: "6h 45m",
  },
];

export default function Contests() {
  const handleJoinContest = (contestId: string) => {
    console.log("Joining contest:", contestId);
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Contests</h1>
          <CoinBalance balance={15000} />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <Badge className="flex-shrink-0 px-3 py-1.5 cursor-pointer hover-elevate active-elevate-2" data-testid="badge-filter-all">
            <Zap className="h-3 w-3 mr-1" />
            All
          </Badge>
          <Badge variant="outline" className="flex-shrink-0 px-3 py-1.5 cursor-pointer hover-elevate active-elevate-2" data-testid="badge-filter-featured">
            Featured
          </Badge>
          <Badge variant="outline" className="flex-shrink-0 px-3 py-1.5 cursor-pointer hover-elevate active-elevate-2" data-testid="badge-filter-closing">
            <Clock className="h-3 w-3 mr-1" />
            Closing Soon
          </Badge>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="flex flex-col gap-4">
          {mockContests.map((contest) => (
            <ContestCard
              key={contest.id}
              contest={contest}
              onJoin={handleJoinContest}
            />
          ))}
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-card/95 backdrop-blur-sm border-t border-border">
        <Button variant="outline" className="w-full" data-testid="button-view-my-contests">
          View My Contests
        </Button>
      </div>
    </div>
  );
}
