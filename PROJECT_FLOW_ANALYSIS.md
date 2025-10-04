# Estocks - Stock Fantasy Trading App - Project Flow Analysis

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React/TypeScript)                │
├─────────────────────────────────────────────────────────────────┤
│  App.tsx (Router)                                               │
│  ├── AuthProvider (Context)                                     │
│  ├── ThemeProvider (Dark/Light)                                 │
│  ├── QueryClientProvider (TanStack Query)                      │
│  └── Router Logic:                                              │
│      ├── AuthenticatedApp (if user logged in)                  │
│      │   ├── Market (/market) - Stock selection                │
│      │   ├── Contests (/contests) - Contest browsing           │
│      │   ├── Portfolio (/portfolio) - Holdings view            │
│      │   ├── Leaderboard (/leaderboard) - Rankings             │
│      │   └── Profile (/profile) - User settings                │
│      └── UnauthenticatedApp (if not logged in)                 │
│          ├── Login (/login)                                     │
│          └── Register (/register)                               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP/API Calls
                                │
┌─────────────────────────────────────────────────────────────────┐
│                        SERVER (Express/Node.js)                 │
├─────────────────────────────────────────────────────────────────┤
│  index.ts (Main Server)                                         │
│  ├── Middleware: JSON, CORS, Cookie Parser, Logging            │
│  ├── Auth Routes (authRoutes.ts)                               │
│  │   ├── POST /api/auth/register                               │
│  │   ├── POST /api/auth/login                                  │
│  │   ├── POST /api/auth/logout                                 │
│  │   └── GET /api/auth/me                                      │
│  └── API Routes (routes.ts)                                    │
│      ├── GET /api/stocks - Fetch all stocks                    │
│      ├── GET /api/stocks/:symbol - Get specific stock          │
│      ├── GET /api/contests - Get active contests               │
│      ├── GET /api/contests/:id - Get contest details           │
│      ├── GET /api/contests/:id/leaderboard - Rankings          │
│      ├── POST /api/contests/:id/join - Join contest            │
│      └── GET /api/users/:userId/contests/:contestId/portfolio  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Database Queries
                                │
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL/Neon)                   │
├─────────────────────────────────────────────────────────────────┤
│  Tables:                                                        │
│  ├── users (id, username, email, fullName, password,           │
│  │         coinsBalance, createdAt, updatedAt)                 │
│  ├── stocks (symbol, companyName, sector, currentPrice,        │
│  │         priceChange, priceChangePercent, lastUpdated,       │
│  │         isActive)                                           │
│  ├── contests (id, name, description, entryFee, prizePool,     │
│  │          maxParticipants, startTime, endTime, status,       │
│  │          featured, createdAt)                               │
│  ├── contest_entries (id, userId, contestId,                   │
│  │                   totalCoinsInvested, finalPortfolioValue,  │
│  │                   roi, rank, createdAt)                     │
│  ├── portfolio_holdings (id, entryId, stockSymbol,             │
│  │                      coinsInvested, sharesQuantity,         │
│  │                      purchasePrice, createdAt)              │
│  └── price_history (id, stockSymbol, price, timestamp)         │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 User Flow Analysis

### 1. Authentication Flow
```
User Registration/Login
    ↓
AuthContext manages state
    ↓
JWT token stored in HTTP-only cookie
    ↓
Protected routes check authentication
    ↓
User data available throughout app
```

### 2. Contest Participation Flow
```
User browses Market page
    ↓
Selects stocks and allocates 100 coins
    ↓
Clicks "Join Contest" button
    ↓
POST /api/contests/:id/join with portfolio
    ↓
Server creates contest entry + portfolio holdings
    ↓
User can view portfolio in Portfolio page
```

### 3. Portfolio Management Flow
```
User joins contest
    ↓
Portfolio holdings created in database
    ↓
Portfolio page fetches holdings via API
    ↓
Real-time P&L calculation based on current stock prices
    ↓
ROI tracking for leaderboard ranking
```

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for routing (lightweight alternative to React Router)
- **TanStack Query** for server state management
- **Tailwind CSS** + **Radix UI** for styling
- **Framer Motion** for animations
- **Lucide React** for icons

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for database operations
- **Neon PostgreSQL** for database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Cookie-based sessions**

### Database Schema
- **Users**: Authentication and coin balance
- **Stocks**: Market data with real-time prices
- **Contests**: Competition structure and timing
- **Contest Entries**: User participation tracking
- **Portfolio Holdings**: Individual stock positions
- **Price History**: Historical data for charts

## 🔧 Key Features

### ✅ Implemented
1. **User Authentication** - Registration, login, logout with JWT
2. **Stock Market** - Browse and select stocks with coin allocation
3. **Contest System** - Join contests with portfolio creation
4. **Portfolio Tracking** - View holdings with P&L calculations
5. **Leaderboard** - Contest rankings based on ROI
6. **Responsive Design** - Mobile-first with bottom navigation
7. **Dark/Light Theme** - Theme switching capability

### 🚧 In Progress / TODO
1. **Real-time Stock Prices** - WebSocket integration for live updates
2. **Contest Management** - Admin panel for creating contests
3. **Advanced Portfolio Analytics** - Charts and detailed metrics
4. **Social Features** - User profiles, following, sharing
5. **Payment Integration** - Real money contests
6. **Push Notifications** - Contest updates and alerts

## 🔍 Current Issues & Improvements Needed

### 1. **Market Page Integration**
- Market page has portfolio creation UI but no connection to contests
- "Join Contest" button doesn't actually join a contest
- Need to integrate with contest selection flow

### 2. **Contest Flow**
- Contests page uses hardcoded portfolio instead of user's market selections
- No way to create custom portfolios from market page
- Missing contest-to-portfolio connection

### 3. **Portfolio Management**
- Portfolio page uses hardcoded contest ID
- No way to select which contest's portfolio to view
- Missing contest context throughout the app

### 4. **Data Flow Issues**
- No state management for selected stocks across pages
- No way to pass portfolio data from Market to Contests
- Missing contest selection context

## 🎯 Recommended Next Steps

1. **Fix Market-Contest Integration**
   - Connect Market page portfolio creation to contest joining
   - Add contest selection in Market page
   - Implement proper state management for portfolio data

2. **Improve Contest Flow**
   - Add contest selection in Market page
   - Remove hardcoded portfolios from Contests page
   - Create proper contest-to-portfolio relationship

3. **Enhanced Portfolio Management**
   - Add contest selection in Portfolio page
   - Implement portfolio switching between contests
   - Add portfolio creation from Market page

4. **State Management**
   - Add React Context for portfolio state
   - Implement proper data flow between pages
   - Add loading states and error handling

5. **Real-time Features**
   - Implement WebSocket for live stock prices
   - Add real-time portfolio updates
   - Implement live leaderboard updates

## 📊 Database Relationships

```
users (1) ──→ (many) contest_entries
contests (1) ──→ (many) contest_entries
contest_entries (1) ──→ (many) portfolio_holdings
stocks (1) ──→ (many) portfolio_holdings
stocks (1) ──→ (many) price_history
```

This architecture supports a scalable fantasy trading platform with proper separation of concerns, secure authentication, and efficient data management.
