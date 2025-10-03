import { LeaderboardEntry } from "../LeaderboardEntry";

export default function LeaderboardEntryExample() {
  const user = {
    rank: 1,
    userId: "1",
    username: "TraderPro",
    portfolioValue: 125000,
    roi: 25.4,
  };

  return (
    <div className="p-4 max-w-md">
      <LeaderboardEntry user={user} />
    </div>
  );
}
