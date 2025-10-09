import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

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

// Check if DATABASE_URL is set (only exit in production on Render)
if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production' && process.env.RENDER) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('Please set DATABASE_URL in your Render environment variables');
  process.exit(1);
}

console.log('🚀 Starting Estocks Simple Render Server...');
console.log('📊 Database URL configured:', process.env.DATABASE_URL ? 'Yes' : 'No');
console.log('🔑 JWT Secret configured:', process.env.JWT_SECRET ? 'Yes' : 'No');
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');
console.log('🔧 Port:', process.env.PORT || 10000);

// Health check endpoint for Render monitoring
app.get('/health', async (req, res) => {
  try {
    res.status(200).json({ 
      status: 'ok', 
      database: 'configured',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      mode: 'simple-render-production',
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      mode: 'simple-render-production'
    });
  }
});

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
    deployment: "simple-render-production"
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Estocks API Server',
    status: 'running',
    mode: 'simple-api-only',
    endpoints: {
      health: '/health',
      api: '/api'
    },
    timestamp: new Date().toISOString()
  });
});

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
  console.log(`✅ Estocks Simple Render Server running on port ${port}`);
  console.log(`🌐 Server URL: http://localhost:${port}`);
  console.log('🎉 Server startup complete!');
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
