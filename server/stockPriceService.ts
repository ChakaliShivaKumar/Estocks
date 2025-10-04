import axios from 'axios';
import { storage } from './storage.ts';

// Stock price data interface
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

// Alpha Vantage API configuration
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'ZNN13UGP6HP5J24T';
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// Mock data for development (when API key is not available)
const MOCK_STOCK_DATA: Record<string, StockPriceData> = {
  'AAPL': {
    symbol: 'AAPL',
    price: 175.50,
    change: 2.30,
    changePercent: 1.33,
    volume: 45000000,
    high: 176.20,
    low: 173.10,
    open: 174.20,
    previousClose: 173.20,
    timestamp: new Date()
  },
  'GOOGL': {
    symbol: 'GOOGL',
    price: 142.80,
    change: -1.20,
    changePercent: -0.83,
    volume: 28000000,
    high: 144.50,
    low: 141.90,
    open: 144.00,
    previousClose: 144.00,
    timestamp: new Date()
  },
  'MSFT': {
    symbol: 'MSFT',
    price: 378.90,
    change: 4.50,
    changePercent: 1.20,
    volume: 32000000,
    high: 380.10,
    low: 374.40,
    open: 375.20,
    previousClose: 374.40,
    timestamp: new Date()
  },
  'TSLA': {
    symbol: 'TSLA',
    price: 245.20,
    change: -3.80,
    changePercent: -1.53,
    volume: 55000000,
    high: 250.10,
    low: 243.50,
    open: 249.00,
    previousClose: 249.00,
    timestamp: new Date()
  },
  'AMZN': {
    symbol: 'AMZN',
    price: 155.30,
    change: 1.90,
    changePercent: 1.24,
    volume: 38000000,
    high: 156.80,
    low: 153.40,
    open: 154.20,
    previousClose: 153.40,
    timestamp: new Date()
  },
  'META': {
    symbol: 'META',
    price: 485.60,
    change: 8.20,
    changePercent: 1.72,
    volume: 25000000,
    high: 487.30,
    low: 477.40,
    open: 479.20,
    previousClose: 477.40,
    timestamp: new Date()
  },
  'NVDA': {
    symbol: 'NVDA',
    price: 875.40,
    change: 15.60,
    changePercent: 1.82,
    volume: 42000000,
    high: 880.20,
    low: 859.80,
    open: 862.50,
    previousClose: 859.80,
    timestamp: new Date()
  },
  'NFLX': {
    symbol: 'NFLX',
    price: 485.20,
    change: -2.10,
    changePercent: -0.43,
    volume: 18000000,
    high: 488.50,
    low: 483.10,
    open: 487.30,
    previousClose: 487.30,
    timestamp: new Date()
  },
  // Indian stocks
  'TCS': {
    symbol: 'TCS',
    price: 3850.50,
    change: 25.30,
    changePercent: 0.66,
    volume: 1200000,
    high: 3875.80,
    low: 3825.20,
    open: 3830.20,
    previousClose: 3825.20,
    timestamp: new Date()
  },
  'WIPRO': {
    symbol: 'WIPRO',
    price: 425.80,
    change: -3.20,
    changePercent: -0.75,
    volume: 2500000,
    high: 430.50,
    low: 422.30,
    open: 429.00,
    previousClose: 429.00,
    timestamp: new Date()
  },
  'HDFCBANK': {
    symbol: 'HDFCBANK',
    price: 1650.40,
    change: 12.60,
    changePercent: 0.77,
    volume: 1800000,
    high: 1665.20,
    low: 1637.80,
    open: 1640.20,
    previousClose: 1637.80,
    timestamp: new Date()
  },
  'INFY': {
    symbol: 'INFY',
    price: 1850.30,
    change: -8.70,
    changePercent: -0.47,
    volume: 2200000,
    high: 1865.80,
    low: 1841.60,
    open: 1859.00,
    previousClose: 1859.00,
    timestamp: new Date()
  },
  'RELIANCE': {
    symbol: 'RELIANCE',
    price: 2450.80,
    change: 35.20,
    changePercent: 1.46,
    volume: 1500000,
    high: 2465.50,
    low: 2415.60,
    open: 2420.40,
    previousClose: 2415.60,
    timestamp: new Date()
  },
  'TATAMOTORS': {
    symbol: 'TATAMOTORS',
    price: 680.50,
    change: -5.80,
    changePercent: -0.84,
    volume: 3200000,
    high: 688.20,
    low: 675.30,
    open: 686.30,
    previousClose: 686.30,
    timestamp: new Date()
  }
};

class StockPriceService {
  private priceCache: Map<string, StockPriceData> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private isUsingMockData = ALPHA_VANTAGE_API_KEY === 'demo';

  constructor() {
    this.initializePriceCache();
    this.startPriceUpdates();
  }

  private async initializePriceCache() {
    try {
      const stocks = await storage.getAllStocks();
      for (const stock of stocks) {
        if (MOCK_STOCK_DATA[stock.symbol]) {
          this.priceCache.set(stock.symbol, MOCK_STOCK_DATA[stock.symbol]);
        }
      }
      console.log(`📈 Initialized price cache for ${this.priceCache.size} stocks`);
    } catch (error) {
      console.error('Error initializing price cache:', error);
    }
  }

  private startPriceUpdates() {
    // Update prices every 30 seconds
    this.updateInterval = setInterval(async () => {
      await this.updateAllPrices();
    }, 30000);

    console.log('🔄 Started real-time price updates (30s interval)');
  }

  private async updateAllPrices() {
    try {
      const stocks = await storage.getAllStocks();
      const updatePromises = stocks.map(stock => this.updateStockPrice(stock.symbol));
      await Promise.all(updatePromises);
      
      console.log(`📊 Updated prices for ${stocks.length} stocks`);
    } catch (error) {
      console.error('Error updating stock prices:', error);
    }
  }

  private async updateStockPrice(symbol: string): Promise<StockPriceData | null> {
    try {
      let priceData: StockPriceData;

      if (this.isUsingMockData) {
        // Use mock data with some randomization
        try {
          priceData = this.generateMockPriceData(symbol);
        } catch (error) {
          // If no mock data available, skip this stock
          console.log(`⚠️ No mock data for ${symbol}, skipping price update`);
          return null;
        }
      } else {
        // Try to fetch real data from Alpha Vantage first
        const fetchedPrice = await this.fetchRealTimePrice(symbol);
        if (fetchedPrice) {
          priceData = fetchedPrice;
        } else {
          // Fall back to mock data if real API fails
          try {
            priceData = this.generateMockPriceData(symbol);
            console.log(`📊 Using mock data for ${symbol} (API unavailable)`);
          } catch (error) {
            console.log(`⚠️ No data available for ${symbol}, skipping price update`);
            return null;
          }
        }
      }

      if (priceData) {
        this.priceCache.set(symbol, priceData);
        
        // Update database
        await storage.updateStockPrice(symbol, priceData.price, priceData.change, priceData.changePercent);

        return priceData;
      }
    } catch (error) {
      console.error(`Error updating price for ${symbol}:`, error);
    }

    return null;
  }

  private generateMockPriceData(symbol: string): StockPriceData {
    const baseData = MOCK_STOCK_DATA[symbol];
    if (!baseData) {
      throw new Error(`No mock data available for ${symbol}`);
    }

    // Add some randomization to simulate price movement
    const volatility = 0.02; // 2% volatility
    const randomChange = (Math.random() - 0.5) * volatility;
    const newPrice = baseData.price * (1 + randomChange);
    const change = newPrice - baseData.price;
    const changePercent = (change / baseData.price) * 100;

    return {
      ...baseData,
      price: Math.round(newPrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      timestamp: new Date()
    };
  }

  private async fetchRealTimePrice(symbol: string): Promise<StockPriceData | null> {
    try {
      const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: ALPHA_VANTAGE_API_KEY
        },
        timeout: 10000
      });

      const data = response.data['Global Quote'];
      if (!data || data['01. symbol'] !== symbol) {
        throw new Error(`Invalid response for ${symbol}`);
      }

      return {
        symbol: data['01. symbol'],
        price: parseFloat(data['05. price']),
        change: parseFloat(data['09. change']),
        changePercent: parseFloat(data['10. change percent'].replace('%', '')),
        volume: parseInt(data['06. volume']),
        high: parseFloat(data['03. high']),
        low: parseFloat(data['04. low']),
        open: parseFloat(data['02. open']),
        previousClose: parseFloat(data['08. previous close']),
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Error fetching real-time price for ${symbol}:`, error);
      return null;
    }
  }

  // Public methods
  public getStockPrice(symbol: string): StockPriceData | null {
    return this.priceCache.get(symbol) || null;
  }

  public getAllStockPrices(): StockPriceData[] {
    return Array.from(this.priceCache.values());
  }

  public async getStockPriceAsync(symbol: string): Promise<StockPriceData | null> {
    // If not in cache, fetch it
    if (!this.priceCache.has(symbol)) {
      const result = await this.updateStockPrice(symbol);
      return result;
    }
    return this.priceCache.get(symbol) || null;
  }

  public async refreshStockPrice(symbol: string): Promise<StockPriceData | null> {
    return await this.updateStockPrice(symbol);
  }

  public getPriceChangeIndicator(changePercent: number): 'up' | 'down' | 'neutral' {
    if (changePercent > 0.1) return 'up';
    if (changePercent < -0.1) return 'down';
    return 'neutral';
  }

  public formatPriceChange(change: number, changePercent: number): string {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
  }

  public stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('🛑 Stopped real-time price updates');
    }
  }
}

// Create singleton instance
export const stockPriceService = new StockPriceService();

// Graceful shutdown
process.on('SIGINT', () => {
  stockPriceService.stop();
});

process.on('SIGTERM', () => {
  stockPriceService.stop();
});
