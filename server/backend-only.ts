import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupAuthRoutes } from "./authRoutes";
import { setupAdminRoutes } from "./adminRoutes";
import { createWebSocketService } from "./websocketService";
import { gamificationScheduler } from "./gamificationScheduler";

const app = express();

// Configure CORS for mobile app support
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests from Capacitor mobile apps (no origin header)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow Capacitor HTTPS scheme
    if (origin.startsWith('https://')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      console.log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
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

console.log('🚀 Starting Estocks Backend API...');
console.log('📊 Database URL configured:', process.env.DATABASE_URL ? 'Yes' : 'No');
console.log('🔑 JWT Secret configured:', process.env.JWT_SECRET ? 'Yes' : 'No');
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

// Health check endpoint for Render
app.get('/health', async (req, res) => {
  try {
    // Simple database connection test
    const { storage } = await import('./storage');
    await storage.getAllStocks(); // This will test DB connection
    
    res.status(200).json({ 
      status: 'ok', 
      database: 'connected',
      api: 'running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// API Info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Estocks API',
    version: '1.0.0',
    description: 'Backend API for Estocks trading app',
    endpoints: {
      auth: '/api/auth/*',
      stocks: '/api/stocks/*',
      contests: '/api/contests/*',
      users: '/api/users/*',
      health: '/health'
    }
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
const port = process.env.PORT || 3000;

async function startBackendAPI() {
  try {
    console.log('🔧 Setting up API routes...');
    const server = await registerRoutes(app);

    console.log(`🌐 Starting backend API on port ${port}...`);
    server.listen(port, "0.0.0.0", () => {
      console.log(`✅ Estocks Backend API running on port ${port}`);
      console.log(`🌐 API URL: http://localhost:${port}`);
      console.log(`📋 Health check: http://localhost:${port}/health`);
      console.log(`📖 API info: http://localhost:${port}/api`);
      console.log('🎉 Backend API startup complete!');
      
      // Initialize services after server is running
      console.log('🔌 Initializing WebSocket service...');
      try {
        const wsService = createWebSocketService(server);
        console.log('✅ WebSocket service initialized');
      } catch (wsError) {
        console.error('⚠️ WebSocket service failed to initialize:', wsError);
      }

      console.log('⏰ Starting schedulers...');
      try {
        gamificationScheduler.start();
        console.log('✅ Schedulers started');
      } catch (schedulerError) {
        console.error('⚠️ Schedulers failed to start:', schedulerError);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start backend API:', error);
    console.error('Error details:', error);
    process.exit(1);
  }
}

startBackendAPI();
