import { EmptyState } from "../EmptyState";
import { Briefcase } from "lucide-react";

export default function EmptyStateExample() {
  return (
    <div className="p-4">
      <EmptyState
        icon={Briefcase}
        title="No Portfolios Yet"
        description="Create your first portfolio to start competing in contests and climbing the leaderboard."
        actionLabel="Create Portfolio"
        onAction={() => console.log("Create portfolio clicked")}
      />
    </div>
  );
}
