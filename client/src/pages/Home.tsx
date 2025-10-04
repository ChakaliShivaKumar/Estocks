import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Target, 
  Trophy, 
  Users, 
  Coins, 
  BarChart3, 
  Clock,
  ArrowRight,
  Star,
  Zap
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const features = [
    {
      icon: <Target className="h-6 w-6" />,
      title: "Stock Selection",
      description: "Choose from real stocks and allocate your 100 coins strategically"
    },
    {
      icon: <Trophy className="h-6 w-6" />,
      title: "Contest Competition",
      description: "Join contests and compete with other traders for the highest ROI"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Portfolio Tracking",
      description: "Monitor your investments and track performance in real-time"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Leaderboards",
      description: "See how you rank against other traders in each contest"
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Browse Stocks",
      description: "Explore the market and select stocks you want to invest in",
      action: "Go to Market"
    },
    {
      step: "2", 
      title: "Allocate Coins",
      description: "Distribute your 100 coins across your chosen stocks",
      action: "Create Portfolio"
    },
    {
      step: "3",
      title: "Join Contests",
      description: "Enter contests and compete with other traders",
      action: "Browse Contests"
    },
    {
      step: "4",
      title: "Track Performance",
      description: "Monitor your portfolio and climb the leaderboards",
      action: "View Portfolio"
    }
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 pb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-full">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Estocks</h1>
                <p className="text-muted-foreground">Fantasy Stock Trading</p>
              </div>
            </div>
          </div>
          
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-3">
              {user ? `Welcome back, ${user.fullName}!` : "Trade Stocks, Win Contests"}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Experience the thrill of stock trading without the risk. Create portfolios, join contests, 
              and compete for the highest returns in our fantasy trading platform.
            </p>
          </div>

          {!user && (
            <div className="flex gap-3 justify-center">
              <Button 
                size="lg" 
                onClick={() => setLocation('/register')}
                className="px-8"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setLocation('/login')}
                className="px-8"
              >
                Sign In
              </Button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="px-6 -mt-4 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Coins className="h-5 w-5 text-primary mr-2" />
                <span className="font-semibold">100 Coins</span>
              </div>
              <p className="text-sm text-muted-foreground">Starting Budget</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-primary mr-2" />
                <span className="font-semibold">Daily</span>
              </div>
              <p className="text-sm text-muted-foreground">New Contests</p>
            </Card>
          </div>
        </div>

        {/* Features Section */}
        <div className="px-6 mb-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Why Choose Estocks?
          </h3>
          <div className="grid gap-4">
            {features.map((feature, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="px-6 mb-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            How It Works
          </h3>
          <div className="space-y-4">
            {howItWorks.map((step, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{step.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                    {user && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const routes = ['/market', '/market', '/contests', '/portfolio'];
                          setLocation(routes[index]);
                        }}
                      >
                        {step.action}
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Contest Types */}
        <div className="px-6 mb-8">
          <h3 className="text-xl font-bold mb-4">Contest Types</h3>
          <div className="grid gap-3">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    <Badge variant="default">Featured</Badge>
                    Daily Tech Titans
                  </h4>
                  <p className="text-sm text-muted-foreground">High-stakes tech stock competition</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">500 coins</p>
                  <p className="text-xs text-muted-foreground">Prize Pool</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    <Badge variant="outline">Quick</Badge>
                    Flash Trading
                  </h4>
                  <p className="text-sm text-muted-foreground">2-hour rapid trading contest</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">200 coins</p>
                  <p className="text-xs text-muted-foreground">Prize Pool</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        {user && (
          <div className="px-6 mb-8">
            <Card className="p-6 bg-primary/5 border-primary/20">
              <div className="text-center">
                <h3 className="text-lg font-bold mb-2">Ready to Start Trading?</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first portfolio and join a contest to begin competing!
                </p>
                <Button 
                  size="lg" 
                  onClick={() => setLocation('/market')}
                  className="px-8"
                >
                  Browse Stocks
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 pb-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 Estocks. Fantasy trading for educational purposes.</p>
            <p className="mt-1">Not real money. Not real risk. Real learning.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
