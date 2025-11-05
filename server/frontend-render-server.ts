import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import fs from "fs";
import { serveStatic } from "./vite";
import { registerRoutes } from "./routes";
import { setupAuthRoutes } from "./authRoutes";
import { setupAdminRoutes } from "./adminRoutes";

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

console.log('🚀 Starting Estocks Frontend Render Server...');
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');
console.log('🔧 Port:', process.env.PORT || 10000);

// Health check endpoint for Render monitoring
app.get('/health', async (req, res) => {
  try {
    res.status(200).json({ 
      status: 'ok', 
      database: 'not-connected',
      frontend: 'serving',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      mode: 'frontend-render-production',
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      mode: 'frontend-render-production'
    });
  }
});

// Setup API routes
console.log('🔧 Setting up API routes...');
(async () => {
  try {
    // Setup authentication routes
    setupAuthRoutes(app);
    console.log('✅ Authentication routes configured');
    
    // Setup admin routes
    setupAdminRoutes(app);
    console.log('✅ Admin routes configured');
    
    // Setup main API routes
    await registerRoutes(app);
    console.log('✅ Main API routes configured');
    
  } catch (error) {
    console.error('❌ Failed to set up API routes:', error);
    console.log('⚠️ Running with basic API endpoints only');
  }
})();

// API endpoint for root path
app.get('/api', (req, res) => {
  res.json({
    name: "Estocks API",
    version: "1.0.0",
    description: "Backend API for Estocks trading app",
    endpoints: {
      health: "/health",
      api: "/api"
    },
    deployment: "frontend-render-production"
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
      message: 'Estocks Frontend Server',
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
const port = Number(process.env.PORT) || 10000;

async function startServer() {
  app.listen(port, "0.0.0.0", () => {
    console.log(`✅ Estocks Frontend Render Server running on port ${port}`);
    console.log(`🌐 Server URL: http://localhost:${port}`);
    console.log('🎉 Server startup complete!');
  });
}

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
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
