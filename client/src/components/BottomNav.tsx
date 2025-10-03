import { TrendingUp, Briefcase, Trophy, User } from "lucide-react";
import { useLocation } from "wouter";

const navItems = [
  { label: "Market", icon: TrendingUp, path: "/" },
  { label: "Portfolio", icon: Briefcase, path: "/portfolio" },
  { label: "Contests", icon: Trophy, path: "/contests" },
  { label: "Profile", icon: User, path: "/profile" },
];

export function BottomNav() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-card-border z-50">
      <div className="h-full flex items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;

          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 hover-elevate active-elevate-2 rounded-md"
              data-testid={`button-nav-${item.label.toLowerCase()}`}
            >
              <Icon
                className={`h-5 w-5 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
