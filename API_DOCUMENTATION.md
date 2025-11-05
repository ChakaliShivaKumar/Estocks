# API Documentation

## Base URL
- Development: `http://localhost:3000`
- Production: `https://your-domain.com`

## Authentication
All protected endpoints require authentication via JWT token stored in HTTP-only cookie.

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `CONFLICT` - Resource conflict (e.g., already exists)
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

## Health Checks

### GET /health
Health check endpoint with service status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 3600,
    "services": {
      "database": {
        "status": "healthy",
        "responseTime": 5
      }
    }
  }
}
```

### GET /ready
Readiness probe for Kubernetes/container orchestration.

### GET /live
Liveness probe for Kubernetes/container orchestration.

## Authentication Endpoints

### POST /api/auth/register
Register a new user.

**Rate Limit:** 5 requests per 15 minutes per IP

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "user": { ... },
  "token": "jwt_token"
}
```

### POST /api/auth/login
Login user.

**Rate Limit:** 5 requests per 15 minutes per IP

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### POST /api/auth/logout
Logout user.

**Authentication:** Required

### GET /api/auth/me
Get current authenticated user.

**Authentication:** Required

## Stock Endpoints

### GET /api/stocks
Get all available stocks.

**Response:**
```json
[
  {
    "symbol": "AAPL",
    "companyName": "Apple Inc.",
    "sector": "Technology",
    "currentPrice": "150.00",
    "priceChange": "2.50",
    "priceChangePercent": "1.69",
    "lastUpdated": "2024-01-01T00:00:00.000Z",
    "isActive": true
  }
]
```

### GET /api/stocks/:symbol
Get specific stock by symbol.

## Contest Endpoints

### GET /api/contests
Get all active contests.

### GET /api/contests/:id
Get contest details by ID.

### POST /api/contests
Create a new contest.

**Authentication:** Required

**Rate Limit:** 10 requests per hour per user

**Request Body:**
```json
{
  "name": "Weekly Challenge",
  "description": "Weekly trading challenge",
  "entryFee": 100,
  "prizePool": 1000,
  "maxParticipants": 50,
  "startTime": "2024-01-08T00:00:00.000Z",
  "endTime": "2024-01-15T00:00:00.000Z",
  "visibility": "public",
  "allowFriends": true
}
```

### POST /api/contests/:id/join
Join a contest with a portfolio.

**Authentication:** Required

**Request Body:**
```json
{
  "portfolio": [
    {
      "stockSymbol": "AAPL",
      "coinsInvested": 50
    },
    {
      "stockSymbol": "GOOGL",
      "coinsInvested": 50
    }
  ]
}
```

**Validation:**
- Portfolio must total exactly 100 coins
- All stock symbols must be valid
- User cannot join the same contest twice

### GET /api/contests/:id/leaderboard
Get contest leaderboard.

**Query Parameters:**
- `userId` (optional) - Filter user-specific data
- `enhanced` (optional, boolean) - Return enhanced leaderboard with social features

### GET /api/contests/:id/leaderboard/history
Get leaderboard history snapshots.

**Query Parameters:**
- `limit` (optional, default: 100) - Number of snapshots to return

## Portfolio Endpoints

### GET /api/users/:userId/contests/:contestId/portfolio
Get user's portfolio holdings for a specific contest.

**Authentication:** Required

**Response:**
```json
{
  "entry": { ... },
  "holdings": [
    {
      "id": "...",
      "stockSymbol": "AAPL",
      "coinsInvested": 50,
      "sharesQuantity": "0.33",
      "purchasePrice": "150.00",
      "currentPrice": "152.50",
      "currentValue": 50.83,
      "profitLoss": 0.83,
      "profitLossPercent": 1.66
    }
  ],
  "totalValue": 100.83,
  "totalProfitLoss": 0.83,
  "roi": 0.83
}
```

## User Endpoints

### GET /api/users/:userId/profile
Get user profile.

**Authentication:** Required (own profile or admin)

### PUT /api/users/:userId/profile
Update user profile.

**Authentication:** Required (own profile only)

**Request Body:**
```json
{
  "fullName": "John Doe",
  "bio": "Trader",
  "phoneNumber": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "location": "New York"
}
```

### GET /api/users/:userId/contests
Get user's contest entries.

**Authentication:** Required

## Admin Endpoints

All admin endpoints require admin role.

### GET /api/admin/dashboard
Get admin dashboard statistics.

### POST /api/admin/stocks
Create a new stock.

### PUT /api/admin/stocks/:symbol
Update stock information.

### POST /api/admin/contests
Create an admin contest.

### GET /api/admin/users
Get all users (paginated).

## Rate Limiting

- **API Routes:** 100 requests per 15 minutes per IP
- **Auth Routes:** 5 requests per 15 minutes per IP
- **Contest Creation:** 10 requests per hour per user

Rate limit headers are included in responses:
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Time when limit resets

## WebSocket

### Connection
Connect to WebSocket server for real-time stock price updates.

**Events:**
- `stock-price-update` - Real-time stock price changes
- `portfolio-update` - Portfolio value updates
- `leaderboard-update` - Leaderboard position changes

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

## Notes

- All timestamps are in ISO 8601 format (UTC)
- All monetary values are in coins (integer)
- All price values are decimal strings with 2 decimal places
- Pagination uses `page` and `limit` query parameters
- Date ranges use ISO 8601 datetime strings

