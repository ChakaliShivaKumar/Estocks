import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { stockPriceService, type StockPriceData } from './stockPriceService';

export class WebSocketService {
  private io: SocketIOServer;
  private priceUpdateInterval: NodeJS.Timeout | null = null;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:3000", "http://localhost:5173"],
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
    this.startPriceBroadcasts();
    
    console.log('🔌 WebSocket service initialized');
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`📱 Client connected: ${socket.id}`);

      // Send current stock prices when client connects
      socket.emit('stock-prices', stockPriceService.getAllStockPrices());

      // Handle client requests for specific stock prices
      socket.on('get-stock-price', async (symbol: string) => {
        try {
          const price = await stockPriceService.getStockPriceAsync(symbol);
          socket.emit('stock-price', { symbol, price });
        } catch (error) {
          socket.emit('error', { message: `Failed to get price for ${symbol}` });
        }
      });

      // Handle client requests to refresh stock prices
      socket.on('refresh-stock-prices', async () => {
        try {
          const prices = stockPriceService.getAllStockPrices();
          socket.emit('stock-prices', prices);
        } catch (error) {
          socket.emit('error', { message: 'Failed to refresh stock prices' });
        }
      });

      // Handle portfolio value calculation requests
      socket.on('calculate-portfolio-value', async (holdings: Array<{ symbol: string; shares: number }>) => {
        try {
          const portfolioValue = await this.calculatePortfolioValue(holdings);
          socket.emit('portfolio-value', portfolioValue);
        } catch (error) {
          socket.emit('error', { message: 'Failed to calculate portfolio value' });
        }
      });

      socket.on('disconnect', () => {
        console.log(`📱 Client disconnected: ${socket.id}`);
      });
    });
  }

  private startPriceBroadcasts() {
    // Broadcast price updates every 30 seconds
    this.priceUpdateInterval = setInterval(() => {
      const prices = stockPriceService.getAllStockPrices();
      this.io.emit('stock-prices', prices);
    }, 30000);

    console.log('📡 Started price broadcast service (30s interval)');
  }

  private async calculatePortfolioValue(holdings: Array<{ symbol: string; shares: number }>): Promise<{
    totalValue: number;
    holdings: Array<{
      symbol: string;
      shares: number;
      currentPrice: number;
      value: number;
      change: number;
      changePercent: number;
    }>;
  }> {
    const holdingsWithValues = [];
    let totalValue = 0;

    for (const holding of holdings) {
      const priceData = stockPriceService.getStockPrice(holding.symbol);
      if (priceData) {
        const value = holding.shares * priceData.price;
        totalValue += value;

        holdingsWithValues.push({
          symbol: holding.symbol,
          shares: holding.shares,
          currentPrice: priceData.price,
          value: value,
          change: priceData.change,
          changePercent: priceData.changePercent
        });
      }
    }

    return {
      totalValue,
      holdings: holdingsWithValues
    };
  }

  // Public methods for manual broadcasts
  public broadcastStockPrice(symbol: string, priceData: StockPriceData) {
    this.io.emit('stock-price', { symbol, price: priceData });
  }

  public broadcastAllPrices() {
    const prices = stockPriceService.getAllStockPrices();
    this.io.emit('stock-prices', prices);
  }

  public broadcastPortfolioUpdate(userId: string, portfolioData: any) {
    this.io.to(userId).emit('portfolio-update', portfolioData);
  }

  public broadcastContestUpdate(contestId: string, contestData: any) {
    this.io.emit('contest-update', { contestId, ...contestData });
  }

  public getConnectedClients(): number {
    return this.io.engine.clientsCount;
  }

  public stop() {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = null;
    }
    this.io.close();
    console.log('🔌 WebSocket service stopped');
  }
}

// Export a function to create the WebSocket service
export function createWebSocketService(httpServer: HTTPServer): WebSocketService {
  return new WebSocketService(httpServer);
}
