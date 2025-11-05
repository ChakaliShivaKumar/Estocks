import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupAuthRoutes } from "./authRoutes";
import { setupAdminRoutes } from "./adminRoutes";
import { setupVite, serveStatic, log } from "./vite";
import { contestScheduler } from "./scheduler";
import { stockPriceService } from "./stockPriceService";
import { createWebSocketService } from "./websocketService";
import { gamificationScheduler } from "./gamificationScheduler";
import { configEnv } from "./config/env";
import { securityHeaders, apiLimiter, authLimiter } from "./middleware/security";
import { errorHandler } from "./middleware/errorHandler";
import { healthCheck, readinessCheck, livenessCheck } from "./middleware/healthCheck";

const app = express();

// Security headers (must be first)
app.use(securityHeaders);

// Configure CORS for mobile app support
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests from Capacitor mobile apps (no origin header)
    if (!origin) return callback(null, true);
    
    // Allow configured origin
    if (configEnv.corsOrigin && origin === configEnv.corsOrigin) {
      return callback(null, true);
    }
    
    // Allow localhost for development
    if (configEnv.isDevelopment && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
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

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

// Health check endpoints (before rate limiting)
app.get("/health", healthCheck);
app.get("/ready", readinessCheck);
app.get("/live", livenessCheck);

// Rate limiting (apply to API routes)
app.use("/api", apiLimiter);

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

console.log('🚀 Starting Estocks server...');
console.log('📊 Database URL configured:', process.env.DATABASE_URL ? 'Yes' : 'No');
console.log('🔑 JWT Secret configured:', process.env.JWT_SECRET ? 'Yes' : 'No');
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

// Setup authentication routes
setupAuthRoutes(app);

// Setup admin routes
setupAdminRoutes(app);

// Global error handler (must be last middleware)
app.use(errorHandler);

// Start the server
const port = configEnv.port;

async function startServer() {
  try {
    console.log('🔧 Setting up routes...');
    const server = await registerRoutes(app);

    console.log('📁 Setting up static file serving...');
    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (configEnv.isDevelopment) {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    console.log(`🌐 Starting server on port ${port}...`);
    server.listen(Number(port), "0.0.0.0", () => {
      log(`🚀 Server running on port ${port} in ${configEnv.nodeEnv} mode`);
      console.log(`✅ Estocks server running on port ${port}`);
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
