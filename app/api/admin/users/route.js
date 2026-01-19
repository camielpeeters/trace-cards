import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth';
import { getPrisma } from '../../../lib/prisma';
import { standardRateLimit } from '../../../lib/rate-limit';

// Force dynamic rendering to avoid build-time Prisma issues
export const dynamic = 'force-dynamic';

// Get all users (admin only)
export async function GET(request) {
  try {
    // Rate limiting
    const rateLimitError = await standardRateLimit(request);
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
    
    // Try to get current user (works with JWT tokens)
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get Prisma client instance
    const prisma = getPrisma();
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            purchaseCards: true,
            shopCards: true,
            purchaseOffers: true,
            shopOrders: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Add response caching headers (5 minutes)
    return NextResponse.json(
      { users },
      {
        headers: {
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
        },
      }
    );
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
