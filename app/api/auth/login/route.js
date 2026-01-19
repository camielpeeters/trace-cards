import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getPrisma } from '../../../lib/prisma';
import { signToken } from '../../../lib/jwt';
import { authRateLimit } from '../../../lib/rate-limit';

// Force dynamic rendering (uses Prisma)
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Rate limiting for login attempts
    const rateLimitError = await authRateLimit(request);
    if (rateLimitError) {
      return NextResponse.json(
        { error: rateLimitError.error },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitError.retryAfter.toString(),
          },
        }
      );
    }
    
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Missing username or password' },
        { status: 400 }
      );
    }
    
    // Get Prisma client instance
    const prisma = getPrisma();
    
    if (!prisma) {
      console.error('Prisma client is not available');
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!validPassword) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }
    
    // Generate token
    const token = signToken(user.id, user.username);
    
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
