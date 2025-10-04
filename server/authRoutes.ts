import { Express } from 'express';
import { storage } from './storage.ts';
import { hashPassword, verifyPassword, generateToken, verifyToken, AuthRequest } from './auth.ts';
import { randomUUID } from 'crypto';

export function setupAuthRoutes(app: Express) {
  // Register new user
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, email, password, fullName } = req.body;

      // Validation
      if (!username || !email || !password || !fullName) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ error: 'Username already taken' });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);

      const newUser = await storage.createUser({
        username,
        email,
        fullName,
        password: hashedPassword
      });

      // Generate JWT token
      const token = generateToken({
        userId: newUser.id,
        username: newUser.username,
        email: newUser.email
      });

      // Set HTTP-only cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json({
        success: true,
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Login user
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        username: user.username,
        email: user.email
      });

      // Set HTTP-only cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = user;
      res.json({
        success: true,
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Logout user
  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ success: true, message: 'Logged out successfully' });
  });

  // Get current user
  app.get('/api/auth/me', async (req: AuthRequest, res) => {
    try {
      const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'No authentication token' });
      }

      const decoded = verifyToken(token);
      const user = await storage.getUser(decoded.userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Return user data (without password)
      const { password, ...userWithoutPassword } = user;
      res.json({
        success: true,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  });
}