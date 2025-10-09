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

// Mock authentication endpoints to prevent app crashes
app.post('/api/auth/login', (req, res) => {
  res.status(501).json({
    error: "Authentication not implemented",
    message: "This is a demo server. Authentication features are not available.",
    status: "not-implemented"
  });
});

app.get('/api/auth/me', (req, res) => {
  res.status(401).json({
    error: "Not authenticated",
    message: "Please login to access this feature",
    status: "unauthenticated"
  });
});

app.post('/api/auth/register', (req, res) => {
  res.status(501).json({
    error: "Registration not implemented",
    message: "This is a demo server. Registration features are not available.",
    status: "not-implemented"
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({
    message: "Logged out successfully",
    status: "success"
  });
});

// Mock stock endpoints
app.get('/api/stocks', (req, res) => {
  res.json({
    stocks: [],
    message: "Stock data not available in demo mode",
    status: "demo-mode"
  });
});

// Mock contest endpoints
app.get('/api/contests', (req, res) => {
  res.json({
    contests: [],
    message: "Contest data not available in demo mode",
    status: "demo-mode"
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
