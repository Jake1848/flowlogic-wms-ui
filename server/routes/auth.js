import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export default function authRoutes(prisma) {
  const router = Router();

  // Login
  router.post('/login', asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Username and password are required',
      });
    }

    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username },
        ],
        isActive: true,
      },
      include: {
        company: {
          select: { id: true, code: true, name: true },
        },
        warehouses: {
          include: {
            warehouse: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid username or password',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid username or password',
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate token
    const token = generateToken(user);

    // Prepare user data (exclude password hash)
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      company: user.company,
      warehouses: user.warehouses.map(uw => ({
        ...uw.warehouse,
        isDefault: uw.isDefault,
      })),
      defaultWarehouseId: user.defaultWarehouseId,
    };

    res.json({
      token,
      user: userData,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
    });
  }));

  // Register (admin only in production, open for development)
  router.post('/register', asyncHandler(async (req, res) => {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      role = 'OPERATOR',
      companyId,
      warehouseIds = [],
    } = req.body;

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Username, email, password, firstName, and lastName are required',
      });
    }

    // Check if username or email already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });

    if (existing) {
      return res.status(409).json({
        error: 'User already exists',
        message: existing.username === username
          ? 'Username is already taken'
          : 'Email is already registered',
      });
    }

    // Get or create default company (for development)
    let company = await prisma.company.findFirst();
    if (!company && !companyId) {
      company = await prisma.company.create({
        data: {
          code: 'DEFAULT',
          name: 'Default Company',
        },
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        role,
        companyId: companyId || company.id,
      },
      include: {
        company: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    // Assign to warehouses if provided
    if (warehouseIds.length > 0) {
      await prisma.userWarehouse.createMany({
        data: warehouseIds.map((warehouseId, index) => ({
          userId: user.id,
          warehouseId,
          isDefault: index === 0,
        })),
      });
    }

    // Generate token
    const token = generateToken(user);

    // Prepare user data
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      company: user.company,
      warehouses: [],
    };

    res.status(201).json({
      token,
      user: userData,
      expiresIn: 24 * 60 * 60,
    });
  }));

  // Get current user profile
  router.get('/me', asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to access your profile',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        company: {
          select: { id: true, code: true, name: true },
        },
        warehouses: {
          include: {
            warehouse: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Your account may have been deleted',
      });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      company: user.company,
      warehouses: user.warehouses.map(uw => ({
        ...uw.warehouse,
        isDefault: uw.isDefault,
      })),
      defaultWarehouseId: user.defaultWarehouseId,
      lastLoginAt: user.lastLoginAt,
    });
  }));

  // Update password
  router.post('/change-password', asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to change your password',
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Current password and new password are required',
      });
    }

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Your account may have been deleted',
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid password',
        message: 'Current password is incorrect',
      });
    }

    // Hash and update new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  }));

  // Refresh token
  router.post('/refresh', asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in again',
      });
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Account unavailable',
        message: 'Your account is no longer active',
      });
    }

    // Generate new token
    const token = generateToken(user);

    res.json({
      token,
      expiresIn: 24 * 60 * 60,
    });
  }));

  // Logout (client-side, but can be used to invalidate tokens in future)
  router.post('/logout', (req, res) => {
    // In a more complete implementation, you might:
    // - Add the token to a blacklist
    // - Clear any server-side session
    // For now, just acknowledge the logout
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  });

  return router;
}
