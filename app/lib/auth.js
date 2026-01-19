import { verifyToken } from './jwt';

// Server-side functions
export const getCurrentUser = async (request) => {
  try {
    // Only import prisma server-side
    if (typeof window !== 'undefined') {
      return null;
    }
    
    const { default: prisma } = await import('./prisma');
    
    if (!prisma) {
      return null;
    }
    
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return null;
    }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true
      }
    });
    
    return user;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
};

export const requireAuth = async (request) => {
  const user = await getCurrentUser(request);
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
};

// Client-side helper functions (for backward compatibility)
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  // Check for JWT token (new multi-user system) or admin session (legacy admin system)
  const token = localStorage.getItem('authToken');
  const adminSession = localStorage.getItem('adminSession');
  return !!(token || adminSession === 'true');
};

export const logout = () => {
  if (typeof window === 'undefined') return;
  // Clear both JWT token (new system) and admin session (legacy system)
  localStorage.removeItem('authToken');
  localStorage.removeItem('adminSession');
};

// Legacy admin functions (for backward compatibility with admin pages)
// Note: This function only works client-side
export const login = (username, password) => {
  // This is for admin login (localStorage-based)
  // For regular user login, use the API route /api/auth/login
  if (typeof window === 'undefined') {
    return { success: false, error: 'Not available on server' };
  }
  
  // Access localStorage directly for admin credentials
  // This matches the old behavior from storage.js
  try {
    const adminCredentialsKey = 'adminCredentials';
    const stored = localStorage.getItem(adminCredentialsKey);
    const credentials = stored ? JSON.parse(stored) : null;
    
    if (!credentials) {
      return { success: false, error: 'Geen admin credentials gevonden' };
    }
    
    if (credentials.username === username && credentials.password === password) {
      localStorage.setItem('adminSession', 'true');
      return { success: true };
    }
    
    return { success: false, error: 'Ongeldige gebruikersnaam of wachtwoord' };
  } catch (error) {
    console.error('Error in admin login:', error);
    return { success: false, error: 'Login failed' };
  }
};

export const checkAuth = () => {
  return isAuthenticated();
};

export const isAdmin = () => {
  // For now, any authenticated user can access admin
  // You can add role-based checks later
  return isAuthenticated();
};

// Helper to get user ID from request token (server-side)
export const getUserIdFromToken = (request) => {
  try {
    if (typeof window !== 'undefined') return null;
    
    const authHeader = request.headers?.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    const { verifyToken } = require('./jwt');
    const decoded = verifyToken(token);
    
    return decoded?.userId || null;
  } catch (error) {
    console.error('Error getting user ID from token:', error);
    return null;
  }
};
