import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";
import { setupAuthRoutes } from "./authRoutes";
import { setupAdminRoutes } from "./adminRoutes";
import { serveStatic, log } from "./vite";
import { contestScheduler } from "./scheduler";
import { stockPriceService } from "./stockPriceService";
import { createWebSocketService } from "./websocketService";
import { gamificationScheduler } from "./gamificationScheduler";

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

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('Please set DATABASE_URL in your Render environment variables');
  process.exit(1);
}

console.log('🚀 Starting Estocks Complete Render Server...');
console.log('📊 Database URL configured:', process.env.DATABASE_URL ? 'Yes' : 'No');
console.log('🔑 JWT Secret configured:', process.env.JWT_SECRET ? 'Yes' : 'No');
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');
console.log('🔧 Port:', process.env.PORT || 10000);

// Health check endpoint for Render monitoring
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const { storage } = await import('./storage');
    await storage.getAllStocks(); // This will test DB connection
    
    res.status(200).json({ 
      status: 'ok', 
      database: 'connected',
      frontend: 'serving',
      api: 'full-implementation',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      mode: 'complete-render-production',
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      mode: 'complete-render-production'
    });
  }
});

// API endpoint for root path
app.get('/api', (req, res) => {
  res.json({
    name: "Estocks API",
    version: "1.0.0",
    description: "Complete backend API for Estocks trading app with full authentication",
    endpoints: {
      auth: "/api/auth/*",
      stocks: "/api/stocks/*",
      contests: "/api/contests/*",
      users: "/api/users/*",
      health: "/health"
    },
    deployment: "complete-render-production",
    features: [
      "Full authentication system",
      "Real-time stock prices",
      "Contest management",
      "User portfolios",
      "Gamification system",
      "WebSocket support"
    ]
  });
});

// Setup authentication routes
setupAuthRoutes(app);

// Setup admin routes
setupAdminRoutes(app);

// Setup error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  console.error('Server error:', err);
});

// Start the server
const port = process.env.PORT || 10000;

async function startServer() {
  try {
    console.log('🔧 Setting up routes...');
    const server = await registerRoutes(app);

    console.log('📁 Setting up static file serving...');
    // Always serve static files for production
    try {
      serveStatic(app);
      console.log('✅ Static file serving configured');
    } catch (error) {
      console.warn('⚠️ Static file serving failed:', error);
      console.warn('This is expected if frontend files are not built yet');
      
      // Add a fallback route for the root path
      app.get('/', (req, res) => {
        res.json({
          message: 'Estocks Complete API Server',
          status: 'running',
          frontend: 'not built',
          endpoints: {
            health: '/health',
            api: '/api'
          },
          note: 'Frontend files not found. Please build the client first.'
        });
      });
    }

    console.log(`🌐 Starting server on port ${port}...`);
    server.listen(port, "0.0.0.0", () => {
      console.log(`✅ Estocks Complete Render Server running on port ${port}`);
      console.log(`🌐 Server URL: http://localhost:${port}`);
      console.log('🎉 Server startup complete!');
      
      // Initialize services after server is running
      console.log('🔌 Initializing WebSocket service...');
      try {
        const wsService = createWebSocketService(server);
        console.log('✅ WebSocket service initialized');
      } catch (wsError) {
        console.error('⚠️ WebSocket service failed to initialize:', wsError);
      }

      console.log('⏰ Initializing schedulers...');
      try {
        // Contest scheduler auto-starts in constructor
        console.log('✅ Contest scheduler initialized');
        
        // Gamification scheduler auto-starts in constructor
        console.log('✅ Gamification scheduler initialized');
      } catch (schedulerError) {
        console.error('⚠️ Schedulers failed to initialize:', schedulerError);
      }

      console.log('📊 Initializing stock price service...');
      try {
        // Stock price service auto-starts in constructor
        console.log('✅ Stock price service initialized');
      } catch (stockError) {
        console.error('⚠️ Stock price service failed to initialize:', stockError);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Error details:', error);
    process.exit(1);
  }
}

startServer();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
