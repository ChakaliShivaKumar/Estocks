import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PortfolioPerformanceChart } from "./PortfolioPerformanceChart";
import { SectorAllocationChart } from "./SectorAllocationChart";
import { PerformanceAnalytics } from "./PerformanceAnalytics";
import { PortfolioComparison } from "./PortfolioComparison";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useContest } from "@/contexts/ContestContext";
import { BarChart3, PieChart, TrendingUp, Users } from "lucide-react";

interface PortfolioAnalytics {
  performanceHistory: Array<{
    timestamp: string;
    portfolioValue: number;
  }>;
  sectorAllocation: Array<{
    sector: string;
    value: number;
    percentage: number;
  }>;
  bestPerformers: Array<{
    symbol: string;
    roi: number;
  }>;
  worstPerformers: Array<{
    symbol: string;
    roi: number;
  }>;
}

export function PortfolioAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<PortfolioAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const { selectedContest } = useContest();

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user || !selectedContest) return;

      try {
        setLoading(true);
        const response = await fetch(
          `/api/users/${user.id}/contests/${selectedContest.id}/portfolio/analytics`,
          { credentials: 'include' }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        
        const data = await response.json();
        setAnalytics(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, selectedContest]);

  if (!selectedContest) {
    return (
      <div className="flex flex-col h-full justify-center">
        <Card className="p-8 text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Contest Selected</h2>
          <p className="text-muted-foreground">Select a contest to view portfolio analytics</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full justify-center items-center">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full justify-center items-center">
        <div className="text-red-500 mb-2">Error loading analytics</div>
        <div className="text-sm text-muted-foreground">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Portfolio Analytics</h1>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="allocation" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Allocation
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Compare
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PortfolioPerformanceChart 
              data={analytics?.performanceHistory || []}
              initialValue={100}
            />
            <SectorAllocationChart 
              data={analytics?.sectorAllocation || []}
            />
          </div>
          
          <PerformanceAnalytics 
            bestPerformers={analytics?.bestPerformers || []}
            worstPerformers={analytics?.worstPerformers || []}
          />
        </TabsContent>

        <TabsContent value="performance">
          <PortfolioPerformanceChart 
            data={analytics?.performanceHistory || []}
            initialValue={100}
          />
        </TabsContent>

        <TabsContent value="allocation">
          <SectorAllocationChart 
            data={analytics?.sectorAllocation || []}
          />
        </TabsContent>

        <TabsContent value="comparison">
          <PortfolioComparison />
        </TabsContent>
      </Tabs>
    </div>
  );
}
