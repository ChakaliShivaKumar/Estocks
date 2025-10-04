import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface StockPriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: Date;
}

export interface PortfolioValue {
  totalValue: number;
  holdings: Array<{
    symbol: string;
    shares: number;
    currentPrice: number;
    value: number;
    change: number;
    changePercent: number;
  }>;
}

export function useStockPrices() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [stockPrices, setStockPrices] = useState<StockPriceData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:3000', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('📱 Connected to WebSocket');
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('📱 Disconnected from WebSocket');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('📱 WebSocket connection error:', err);
      setError('Failed to connect to real-time updates');
    });

    // Listen for stock price updates
    newSocket.on('stock-prices', (prices: StockPriceData[]) => {
      setStockPrices(prices);
    });

    // Listen for individual stock price updates
    newSocket.on('stock-price', (data: { symbol: string; price: StockPriceData }) => {
      setStockPrices(prev => {
        const updated = [...prev];
        const index = updated.findIndex(p => p.symbol === data.symbol);
        if (index >= 0) {
          updated[index] = data.price;
        } else {
          updated.push(data.price);
        }
        return updated;
      });
    });

    // Listen for errors
    newSocket.on('error', (error: { message: string }) => {
      setError(error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const getStockPrice = useCallback((symbol: string): StockPriceData | null => {
    return stockPrices.find(price => price.symbol === symbol) || null;
  }, [stockPrices]);

  const refreshStockPrice = useCallback((symbol: string) => {
    if (socket) {
      socket.emit('get-stock-price', symbol);
    }
  }, [socket]);

  const refreshAllPrices = useCallback(() => {
    if (socket) {
      socket.emit('refresh-stock-prices');
    }
  }, [socket]);

  const calculatePortfolioValue = useCallback((holdings: Array<{ symbol: string; shares: number }>): Promise<PortfolioValue> => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Portfolio calculation timeout'));
      }, 5000);

      socket.emit('calculate-portfolio-value', holdings);
      
      socket.once('portfolio-value', (value: PortfolioValue) => {
        clearTimeout(timeout);
        resolve(value);
      });

      socket.once('error', (error: { message: string }) => {
        clearTimeout(timeout);
        reject(new Error(error.message));
      });
    });
  }, [socket]);

  const getPriceChangeIndicator = useCallback((changePercent: number): 'up' | 'down' | 'neutral' => {
    if (changePercent > 0.1) return 'up';
    if (changePercent < -0.1) return 'down';
    return 'neutral';
  }, []);

  const formatPriceChange = useCallback((change: number, changePercent: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
  }, []);

  return {
    stockPrices,
    isConnected,
    error,
    getStockPrice,
    refreshStockPrice,
    refreshAllPrices,
    calculatePortfolioValue,
    getPriceChangeIndicator,
    formatPriceChange
  };
}
