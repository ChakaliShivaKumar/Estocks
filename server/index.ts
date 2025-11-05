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

(async () => {
  // Setup authentication routes
  setupAuthRoutes(app);
  
  // Setup admin routes
  setupAdminRoutes(app);
  
  const server = await registerRoutes(app);

  // Initialize WebSocket service
  const wsService = createWebSocketService(server);

  // Global error handler (must be last middleware)
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (configEnv.isDevelopment) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start schedulers
  gamificationScheduler.start();

  const port = configEnv.port;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`🚀 Server running on port ${port} in ${configEnv.nodeEnv} mode`);
  });
})();
