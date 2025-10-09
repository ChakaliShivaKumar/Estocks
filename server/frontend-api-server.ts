import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import fs from "fs";
import { serveStatic } from "./vite";

const app = express();

// Configure CORS for production deployment
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests from Capacitor mobile apps (no origin header)
    if (!origin) return callback(null, true);
    
    // Allow Render domain and subdomains
    if (origin.includes('onrender.com')) {
      return callback(null, true);
    }
    
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow any HTTPS origin for mobile apps
    if (origin.startsWith('https://')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

console.log('🚀 Starting Estocks Frontend + API Server...');
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');
console.log('🔧 Port:', process.env.PORT || 10000);

// Health check endpoint for Render monitoring
app.get('/health', async (req, res) => {
  try {
    res.status(200).json({ 
      status: 'ok', 
      database: 'not-connected',
      frontend: 'serving',
      api: 'basic-endpoints',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      mode: 'frontend-api-production',
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      mode: 'frontend-api-production'
    });
  }
});

// Basic API endpoints to prevent JSON parsing errors
app.get('/api', (req, res) => {
  res.json({
    name: "Estocks API",
    version: "1.0.0",
    description: "Backend API for Estocks trading app",
    endpoints: {
      health: "/health",
      api: "/api"
    },
    deployment: "frontend-api-production"
  });
});

// Demo user data for demo mode
const demoUser = {
  id: "demo-user-123",
  username: "demo_trader",
  email: "demo@estocks.com",
  fullName: "Demo Trader",
  coinsBalance: 10000,
  profilePicture: null,
  bio: "Demo user for testing Estocks features",
  phoneNumber: null,
  dateOfBirth: null,
  location: "Demo City",
  level: 5,
  experiencePoints: 2500,
  currentStreak: 7,
  longestStreak: 15,
  lastActiveDate: new Date().toISOString(),
  referralCode: "DEMO123",
  referredBy: null,
  totalReferrals: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Mock authentication endpoints for demo mode
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Accept any credentials in demo mode
  if (email && password) {
    res.json({
      message: "Demo login successful",
      user: demoUser,
      status: "success"
    });
  } else {
    res.status(400).json({
      error: "Email and password required",
      message: "Please provide email and password for demo login",
      status: "error"
    });
  }
});

app.get('/api/auth/me', (req, res) => {
  // Always return demo user in demo mode
  res.json({
    user: demoUser,
    status: "authenticated"
  });
});

app.post('/api/auth/register', (req, res) => {
  // Auto-login as demo user after registration
  res.json({
    message: "Demo registration successful",
    user: demoUser,
    status: "success"
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({
    message: "Demo logout successful",
    status: "success"
  });
});

// Demo stock data
const demoStocks = [
  {
    id: "AAPL",
    symbol: "AAPL",
    name: "Apple Inc.",
    currentPrice: 175.43,
    change: 2.15,
    changePercent: 1.24,
    volume: 45678900,
    marketCap: 2750000000000,
    sector: "Technology"
  },
  {
    id: "GOOGL",
    symbol: "GOOGL", 
    name: "Alphabet Inc.",
    currentPrice: 142.56,
    change: -1.23,
    changePercent: -0.86,
    volume: 28934500,
    marketCap: 1800000000000,
    sector: "Technology"
  },
  {
    id: "TSLA",
    symbol: "TSLA",
    name: "Tesla Inc.",
    currentPrice: 248.12,
    change: 5.67,
    changePercent: 2.34,
    volume: 67891200,
    marketCap: 790000000000,
    sector: "Automotive"
  },
  {
    id: "MSFT",
    symbol: "MSFT",
    name: "Microsoft Corporation",
    currentPrice: 378.91,
    change: 3.45,
    changePercent: 0.92,
    volume: 23456700,
    marketCap: 2800000000000,
    sector: "Technology"
  }
];

// Demo contest data
const demoContests = [
  {
    id: "contest-1",
    name: "Weekly Tech Challenge",
    description: "Trade technology stocks and compete for the top spot!",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    entryFee: 100,
    prizePool: 1000,
    maxParticipants: 50,
    currentParticipants: 23,
    status: "active",
    createdBy: "demo_trader"
  },
  {
    id: "contest-2", 
    name: "Beginner's Luck",
    description: "Perfect for new traders to learn the ropes",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    entryFee: 50,
    prizePool: 500,
    maxParticipants: 25,
    currentParticipants: 18,
    status: "active",
    createdBy: "demo_trader"
  }
];

// Mock stock endpoints
app.get('/api/stocks', (req, res) => {
  res.json({
    stocks: demoStocks,
    message: "Demo stock data loaded successfully",
    status: "success"
  });
});

app.get('/api/stocks/:symbol', (req, res) => {
  const { symbol } = req.params;
  const stock = demoStocks.find(s => s.symbol === symbol.toUpperCase());
  
  if (stock) {
    res.json({
      stock: stock,
      status: "success"
    });
  } else {
    res.status(404).json({
      error: "Stock not found",
      message: `Stock with symbol ${symbol} not found`,
      status: "error"
    });
  }
});

// Mock contest endpoints
app.get('/api/contests', (req, res) => {
  res.json({
    contests: demoContests,
    message: "Demo contest data loaded successfully", 
    status: "success"
  });
});

app.get('/api/contests/:id', (req, res) => {
  const { id } = req.params;
  const contest = demoContests.find(c => c.id === id);
  
  if (contest) {
    res.json({
      contest: contest,
      status: "success"
    });
  } else {
    res.status(404).json({
      error: "Contest not found",
      message: `Contest with id ${id} not found`,
      status: "error"
    });
  }
});

// Mock user portfolio endpoint
app.get('/api/users/:userId/portfolio', (req, res) => {
  res.json({
    portfolio: {
      userId: demoUser.id,
      totalValue: 10500.00,
      totalGain: 500.00,
      totalGainPercent: 5.0,
      holdings: [
        {
          stockId: "AAPL",
          symbol: "AAPL",
          name: "Apple Inc.",
          quantity: 10,
          averagePrice: 170.00,
          currentPrice: 175.43,
          totalValue: 1754.30,
          gain: 54.30,
          gainPercent: 3.19
        },
        {
          stockId: "GOOGL",
          symbol: "GOOGL", 
          name: "Alphabet Inc.",
          quantity: 5,
          averagePrice: 145.00,
          currentPrice: 142.56,
          totalValue: 712.80,
          gain: -12.20,
          gainPercent: -1.68
        }
      ]
    },
    status: "success"
  });
});

// Serve static files (React app)
console.log('📁 Setting up static file serving...');
try {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
  if (fs.existsSync(distPath)) {
    serveStatic(app);
    console.log('✅ Static file serving configured');
  } else {
    console.log('❌ No static files found at:', distPath);
    throw new Error('Static files not found');
  }
} catch (error) {
  console.error('❌ Failed to set up static file serving:', error);
  
  // Fallback route for root path
  app.get('/', (req, res) => {
    res.json({
      message: 'Estocks Frontend + API Server',
      status: 'error',
      mode: 'frontend-not-found',
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoints: {
        health: '/health',
        api: '/api'
      },
      timestamp: new Date().toISOString()
    });
  });
}

// Setup error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  console.error('Server error:', err);
});

// Start the server
const port = process.env.PORT || 10000;

app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Estocks Frontend + API Server running on port ${port}`);
  console.log(`🌐 Server URL: http://localhost:${port}`);
  console.log('🎉 Server startup complete!');
  console.log('📱 Mobile app can now access both frontend and API endpoints');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
