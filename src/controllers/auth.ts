import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { logger } from '../utils/logger';

// Validation schema
const adminLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

// Generate JWT tokens
const generateTokens = (userId: string) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured. Please set JWT_SECRET in your .env file.');
  }

  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
  
  return { accessToken, refreshToken };
};

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = adminLoginSchema.parse(req.body);

    // Find user
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const { accessToken, refreshToken } = generateTokens(user._id.toString());

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Admin login error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof z.ZodError ? 'Validation error' : 'Login failed'
    });
  }
};

export const getAdminProfile = async (req: Request, res: Response) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, error: 'JWT_SECRET is not configured' });
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    const user = await User.findById(decoded.userId).select('-passwordHash');
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          role: user.role
        }
      }
    });
  } catch (error) {
    logger.error('Get admin profile error:', error);
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

