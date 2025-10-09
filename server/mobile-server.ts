import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "dotenv";
import { registerRoutes } from "./routes";
import { setupAuthRoutes } from "./authRoutes";
import { setupAdminRoutes } from "./adminRoutes";
import { serveStatic, log } from "./vite";
import { contestScheduler } from "./scheduler";
import { stockPriceService } from "./stockPriceService";
import { createWebSocketService } from "./websocketService";
import { gamificationScheduler } from "./gamificationScheduler";

// Load environment variables (only in development)
if (process.env.NODE_ENV !== 'production') {
  config();
}

const app = express();

// Configure CORS for mobile app support - more permissive for mobile testing
app.use(cors({
  origin: true, // Allow all origins for mobile testing
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

console.log('🚀 Starting Estocks Mobile Server...');
console.log('📊 Database URL configured:', process.env.DATABASE_URL ? 'Yes' : 'No');
console.log('🔑 JWT Secret configured:', process.env.JWT_SECRET ? 'Yes' : 'No');
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

// Health check endpoint for mobile testing
app.get('/health', async (req, res) => {
  try {
    // Simple database connection test
    const { storage } = await import('./storage');
    await storage.getAllStocks(); // This will test DB connection
    
    res.status(200).json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      mode: 'mobile-production'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      mode: 'mobile-production'
    });
  }
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

async function startServer() {
  try {
    console.log('🔧 Setting up routes...');
    const server = await registerRoutes(app);

    console.log('📁 Setting up static file serving for mobile...');
    // Always serve static files for mobile testing
    serveStatic(app);

    console.log(`🌐 Starting mobile server on port ${port}...`);
    server.listen(port, "0.0.0.0", () => {
      console.log(`✅ Estocks Mobile Server running on port ${port}`);
      console.log(`🌐 Server URL: http://localhost:${port}`);
      console.log(`📱 Mobile URL: http://172.20.7.203:${port}`);
      console.log('🎉 Mobile server startup complete!');
      
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
    console.error('❌ Failed to start server:', error);
    console.error('Error details:', error);
    process.exit(1);
  }
}

startServer();
