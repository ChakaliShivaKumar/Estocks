import { ContestCard } from "../ContestCard";

export default function ContestCardExample() {
  const contest = {
    id: "1",
    name: "Daily Tech Titans",
    entryFee: 500,
    prizePool: 50000,
    participants: 847,
    maxParticipants: 1000,
    timeRemaining: "4h 23m",
    featured: true,
  };

  return (
    <div className="p-4 max-w-md">
      <ContestCard
        contest={contest}
        onJoin={(id) => console.log("Join contest:", id)}
      />
    </div>
  );
}
