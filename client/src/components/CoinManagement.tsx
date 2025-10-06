import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Coins, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  ArrowUpDown,
  History,
  Plus,
  Minus
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface CoinTransaction {
  id: string;
  type: string;
  amount: number;
  coinsBefore: number;
  coinsAfter: number;
  cashAmount?: string;
  exchangeRate?: string;
  paymentMethod?: string;
  status: string;
  description: string;
  createdAt: string;
}

interface ExchangeRate {
  exchangeRate: number;
  rateText: string;
}

export function CoinManagement() {
  const [activeTab, setActiveTab] = useState<"buy" | "exchange" | "history">("buy");
  const [buyAmount, setBuyAmount] = useState("");
  const [exchangeAmount, setExchangeAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, updateUser } = useAuth();

  useEffect(() => {
    fetchExchangeRate();
    fetchTransactions();
  }, []);

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch('/api/coins/exchange-rate', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setExchangeRate(data);
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/users/${user.id}/coins/transactions?limit=20`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleBuyCoins = async () => {
    if (!user || !buyAmount || !exchangeRate) return;

    const amount = parseInt(buyAmount);
    if (amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${user.id}/coins/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount,
          paymentMethod: 'credit_card',
          paymentId: `mock_payment_${Date.now()}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to purchase coins');
      }

      const data = await response.json();
      
      // Update user's coin balance
      if (updateUser) {
        updateUser({ coinsBalance: data.transaction.coinsAfter });
      }
      
      // Refresh transactions
      await fetchTransactions();
      
      // Reset form
      setBuyAmount("");
      alert(`Successfully purchased ${amount} coins!`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to purchase coins');
    } finally {
      setLoading(false);
    }
  };

  const handleExchangeCoins = async () => {
    if (!user || !exchangeAmount) return;

    const amount = parseInt(exchangeAmount);
    if (amount <= 0 || amount > user.coinsBalance) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${user.id}/coins/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ coinsAmount: amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to exchange coins');
      }

      const data = await response.json();
      
      // Update user's coin balance
      if (updateUser) {
        updateUser({ coinsBalance: data.transaction.coinsAfter });
      }
      
      // Refresh transactions
      await fetchTransactions();
      
      // Reset form
      setExchangeAmount("");
      alert(`Successfully exchanged ${amount} coins for $${(amount / (exchangeRate?.exchangeRate || 100)).toFixed(2)}!`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to exchange coins');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'exchange':
        return <Minus className="h-4 w-4 text-blue-600" />;
      case 'contest_entry':
        return <Minus className="h-4 w-4 text-orange-600" />;
      case 'prize':
        return <Plus className="h-4 w-4 text-yellow-600" />;
      default:
        return <ArrowUpDown className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase':
      case 'prize':
        return 'text-green-600';
      case 'exchange':
      case 'contest_entry':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!user || !exchangeRate) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          Loading coin management...
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Coins className="h-6 w-6" />
        <h2 className="text-xl font-bold">Coin Management</h2>
        <Badge variant="secondary" className="ml-auto">
          {user.coinsBalance.toLocaleString()} coins
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="buy" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Buy Coins
          </TabsTrigger>
          <TabsTrigger value="exchange" className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Exchange
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="space-y-4">
          <div className="text-center text-sm text-muted-foreground mb-4">
            {exchangeRate.rateText}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="buyAmount">Amount (coins)</Label>
            <Input
              id="buyAmount"
              type="number"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              placeholder="Enter amount to purchase"
              min="1"
            />
          </div>

          {buyAmount && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Coins to purchase:</span>
                <span className="font-semibold">{parseInt(buyAmount) || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cost:</span>
                <span className="font-semibold">
                  ${((parseInt(buyAmount) || 0) / exchangeRate.exchangeRate).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <Button 
            onClick={handleBuyCoins} 
            disabled={loading || !buyAmount || parseInt(buyAmount) <= 0}
            className="w-full"
          >
            {loading ? "Processing..." : "Buy Coins"}
          </Button>
        </TabsContent>

        <TabsContent value="exchange" className="space-y-4">
          <div className="text-center text-sm text-muted-foreground mb-4">
            {exchangeRate.rateText}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="exchangeAmount">Coins to exchange</Label>
            <Input
              id="exchangeAmount"
              type="number"
              value={exchangeAmount}
              onChange={(e) => setExchangeAmount(e.target.value)}
              placeholder="Enter coins to exchange"
              min="1"
              max={user.coinsBalance}
            />
          </div>

          {exchangeAmount && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Coins to exchange:</span>
                <span className="font-semibold">{parseInt(exchangeAmount) || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cash received:</span>
                <span className="font-semibold">
                  ${((parseInt(exchangeAmount) || 0) / exchangeRate.exchangeRate).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <Button 
            onClick={handleExchangeCoins} 
            disabled={loading || !exchangeAmount || parseInt(exchangeAmount) <= 0 || parseInt(exchangeAmount) > user.coinsBalance}
            className="w-full"
          >
            {loading ? "Processing..." : "Exchange for Cash"}
          </Button>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No transactions yet
              </div>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount} coins
                    </div>
                    {transaction.cashAmount && (
                      <div className="text-sm text-muted-foreground">
                        ${parseFloat(transaction.cashAmount).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
