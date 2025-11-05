# Estocks - Fantasy Stock Trading Platform

A modern, full-stack fantasy stock trading game where users compete in contests by building portfolios and tracking their performance in real-time.

## 🚀 Features

- **User Authentication**: Secure JWT-based authentication with HTTP-only cookies
- **Stock Market**: Browse and select from real-time stock data
- **Contest System**: Join public contests or create private ones
- **Portfolio Management**: Track holdings, P&L, and ROI
- **Leaderboards**: Real-time rankings and performance tracking
- **Gamification**: Achievements, levels, XP, daily challenges, and streaks
- **Social Features**: Friends, private leagues, contest invitations, comments
- **Real-time Updates**: WebSocket-based live stock price updates
- **Mobile Ready**: Capacitor support for iOS and Android
- **Admin Panel**: Comprehensive admin dashboard for managing the platform
- **CI/CD Pipeline**: Automated testing and quality checks

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for routing
- **TanStack Query** for server state management
- **Tailwind CSS** + **Radix UI** for styling
- **Framer Motion** for animations
- **Capacitor** for mobile apps

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for database operations
- **PostgreSQL/Neon** for database
- **JWT** for authentication
- **Socket.io** for WebSocket connections
- **Express Rate Limit** for API protection

### Infrastructure
- **TypeScript** for type safety
- **Vite** for build tooling
- **Drizzle Kit** for database migrations
- **GitHub Actions** for CI/CD
- **Vitest** for testing
- **ESLint** for code quality

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Neon account)
- Git

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Estocks
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and fill in your configuration:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-secret-key-must-be-at-least-32-characters-long
JWT_EXPIRES_IN=7d
LOG_LEVEL=info
```

**Important**: Generate a secure JWT secret:
```bash
openssl rand -base64 32
```

### 4. Database Setup

#### Push Database Schema

```bash
npm run db:push
```

This will create all necessary tables in your database.

#### Seed Initial Data

```bash
npm run db:seed
```

This populates the database with initial stocks and sample data.

#### Setup Gamification Tables

```bash
npm run gamification:setup
```

#### Populate Daily Challenges

```bash
npm run gamification:challenges
```

#### Create Admin User

```bash
npm run admin:setup
```

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## 🧪 Testing & Quality Checks

### Run All CI Checks

```bash
npm run ci
```

This runs:
- Type checking
- Linting
- Build verification
- Tests

### Individual Commands

```bash
# Type check
npm run check

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

See [CI_CD_GUIDE.md](./CI_CD_GUIDE.md) for detailed CI/CD information.

## 📱 Mobile App Development

### Build for Android

```bash
npm run build:mobile
npm run sync:android
npm run open:android
```

### Development Server for Mobile

```bash
npm run dev:mobile
```

## 🔍 API Endpoints

### Health Checks
- `GET /health` - Health check with service status
- `GET /ready` - Readiness probe
- `GET /live` - Liveness probe

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Stocks
- `GET /api/stocks` - Get all stocks
- `GET /api/stocks/:symbol` - Get specific stock

### Contests
- `GET /api/contests` - Get active contests
- `GET /api/contests/:id` - Get contest details
- `POST /api/contests` - Create new contest (authenticated)
- `POST /api/contests/:id/join` - Join contest (authenticated)
- `GET /api/contests/:id/leaderboard` - Get leaderboard

### Portfolio
- `GET /api/users/:userId/contests/:contestId/portfolio` - Get portfolio holdings

### Admin
- `GET /api/admin/*` - Admin endpoints (requires admin role)

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API documentation.

## 🏗️ Project Structure

```
Estocks/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilities
├── server/                 # Express backend
│   ├── middleware/         # Express middleware
│   ├── routes/             # API routes
│   ├── config/             # Configuration
│   └── storage.ts          # Database operations
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schema
├── tests/                  # Test files
├── .github/                 # GitHub workflows
│   └── workflows/
│       └── ci.yml          # CI/CD pipeline
└── android/                # Android app configuration
```

## 🔒 Security Features

- **Rate Limiting**: API endpoints protected against abuse
- **Security Headers**: XSS, clickjacking, and MIME type protection
- **Input Validation**: Zod schema validation for all inputs
- **Error Handling**: Centralized error handling with proper error codes
- **JWT Authentication**: Secure token-based authentication
- **CORS Configuration**: Proper CORS setup for production

## 📊 Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User accounts and profiles
- `stocks` - Stock market data
- `contests` - Trading contests
- `contest_entries` - User participation in contests
- `portfolio_holdings` - Stock holdings in portfolios
- `achievements` - Achievement definitions
- `user_achievements` - User-earned achievements
- `daily_challenges` - Daily challenge definitions
- `social_connections` - Friend relationships
- `private_leagues` - Private league groups
- And more...

See `shared/schema.ts` for complete schema definition.

## 🧪 Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run check            # Type check TypeScript

# Testing & Quality
npm run ci               # Run all CI checks
npm run lint             # Lint code
npm run test             # Run tests

# Database
npm run db:push          # Push schema changes to database
npm run db:seed          # Seed initial data
npm run db:setup         # Push schema and seed

# Gamification
npm run gamification:setup      # Setup gamification tables
npm run gamification:challenges # Populate daily challenges

# Admin
npm run admin:setup      # Create admin user

# Mobile
npm run build:mobile     # Build for mobile
npm run sync:android     # Sync Capacitor
npm run build:android   # Build Android APK

# Production
npm run build            # Build for production
npm start                # Start production server
```

## 🐛 Troubleshooting

### Database Connection Issues

1. Verify `DATABASE_URL` in `.env` is correct
2. Ensure database is accessible
3. Check firewall/network settings

### Port Already in Use

Change the `PORT` in `.env` or kill the process using the port:
```bash
lsof -ti:3000 | xargs kill
```

### Type Errors

Run type checking:
```bash
npm run check
```

### CI/CD Pipeline Failures

See [CI_CD_GUIDE.md](./CI_CD_GUIDE.md) for troubleshooting CI/CD issues.

### Missing Environment Variables

Ensure all required variables in `.env.example` are set in your `.env` file.

## 📚 Documentation

- `PROJECT_FLOW_ANALYSIS.md` - Detailed project flow and architecture
- `FIXES_IMPLEMENTED.md` - List of fixes and improvements
- `REAL_TIME_STOCK_SYSTEM.md` - Real-time stock price system documentation
- `ADMIN_SYSTEM_GUIDE.md` - Admin system documentation
- `API_DOCUMENTATION.md` - Complete API documentation
- `CI_CD_GUIDE.md` - CI/CD pipeline guide
- `INVESTOR_READY_CHECKLIST.md` - Production readiness checklist
- `DEPLOYMENT_GUIDE.md` - Deployment instructions

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run `npm run ci` to ensure all checks pass
4. Test thoroughly
5. Submit a pull request

The CI/CD pipeline will automatically verify your changes.

## 📝 License

MIT License

## 🎯 Roadmap

- [ ] Payment integration for real-money contests
- [ ] Advanced analytics and charts
- [ ] Push notifications
- [ ] Social sharing features
- [ ] Mobile app store releases
- [ ] Advanced admin features
- [ ] E2E testing
- [ ] Performance monitoring

## 📞 Support

For issues and questions, please open an issue on the repository.

---

**Built with ❤️ for fantasy stock trading enthusiasts**

**Status**: ✅ Production Ready | ✅ CI/CD Active
