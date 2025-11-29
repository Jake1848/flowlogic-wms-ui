import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'flowlogic-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Generate a JWT token
export function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verify a JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Authentication middleware
export function authMiddleware(req, res, next) {
  // Skip auth for public routes
  const publicPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/health',
  ];

  if (publicPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Get token from header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide a valid access token',
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Your session has expired. Please log in again.',
    });
  }

  // Attach user info to request
  req.user = decoded;
  next();
}

// Role-based authorization middleware
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to access this resource',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `This action requires one of the following roles: ${roles.join(', ')}`,
      });
    }

    next();
  };
}

// Optional auth middleware (allows unauthenticated access but attaches user if token present)
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
}

export { JWT_SECRET, JWT_EXPIRES_IN };
